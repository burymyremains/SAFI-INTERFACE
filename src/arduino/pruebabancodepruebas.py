#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import json
import random
import queue
import threading
from datetime import datetime

# ===== Dependencias opcionales (según lo que actives en Config) =====
# pip install pyserial requests
# pip install "python-socketio[client]"   # solo si ENABLE_SOCKETIO = True
# pip install websocket-client            # solo si ENABLE_WS = True

# ----------------- Config -----------------
USE_SIMULATED_SERIAL = True    # True: genera datos aleatorios. False: usa hardware real
SERIAL_PORT = "/dev/ttyACM0"   # Ignorado si USE_SIMULATED_SERIAL=True
BAUD_RATE   = 9600
SERIAL_TIMEOUT_S = 1.0

# Envío por HTTP (recomendado/estable)
ENABLE_HTTP = True
SERVER_URL_DATA    = "http://192.168.1.107:3000/api/bancodepruebas"
SERVER_URL_COMMAND = "http://192.168.1.107:3000/api/ignicion"
REQUEST_TIMEOUT_S  = 3.0

# Realtime por Socket.IO (actívalo si tu backend usa socket.io)
ENABLE_SOCKETIO = False
SIO_URL   = "http://192.168.1.107:3000"  # normalmente el mismo puerto del backend
SIO_EVENT = "banco_de_pruebas"            # <--- cámbialo al evento que tu server escuche

# Realtime por WebSocket Puro (actívalo solo si tu backend NO es socket.io)
ENABLE_WS = False
WS_URL = "ws://192.168.1.107:8081"
WS_RETRY_DELAY_S = 10.0

# Poll de comando de ignición por HTTP (si no lo recibes por realtime)
COMMAND_POLL_MS = 500  # cada 0.5s

# Simulador: rangos y frecuencia
SIM_INTERVAL_S = 0.25  # cada cuánto genera una línea simulada
RANGO_FUERZA = (0.0, 500.0)
RANGO_TEMP   = (10.0, 80.0)
RANGO_PRES   = (900.0, 1100.0)

ID_PRUEBA_FIJO = 0     # Lo dejaste fijo en 0
ROUND_DECIMALS = 3     # Redondeo de floats al enviar
# ------------------------------------------

# ====== Imports condicionales para evitar requerir librerías no usadas ======
try:
    import requests
except Exception:
    requests = None

try:
    import serial
except Exception:
    serial = None

# Socket.IO opcional
if ENABLE_SOCKETIO:
    import socketio
    sio = socketio.Client(reconnection=True)
else:
    sio = None

# WebSocket opcional
if ENABLE_WS:
    import websocket
    ws_app = None
    ws_send_lock = threading.Lock()
    ws_connected = False
else:
    ws_app = None
    ws_send_lock = None
    ws_connected = False

# Cola donde llegan «líneas» del serial (real o simulado)
line_queue = queue.Queue(maxsize=200)

# ====== Utilidades comunes ======
def now_date_time_strings():
    """Devuelve ('YYYY-MM-DD', 'HH:MM:SS') usando hora local del sistema."""
    now = datetime.now()
    return now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S")

def build_payload(fuerza: float, temperatura: float, presion: float):
    date_str, time_str = now_date_time_strings()
    data = {
        "id_prueba": ID_PRUEBA_FIJO,
        "fuerza": round(float(fuerza), ROUND_DECIMALS),
        "temperatura": round(float(temperatura), ROUND_DECIMALS),
        "presion": round(float(presion), ROUND_DECIMALS),
        "date": date_str,
        "time": time_str
    }
    return data

# ====== HTTP helpers ======
def send_data_to_server(data):
    if not ENABLE_HTTP:
        return True
    if requests is None:
        print("[HTTP] 'requests' no está instalado, omitiendo POST.")
        return False
    headers = {'Content-Type': 'application/json'}
    try:
        r = requests.post(SERVER_URL_DATA, json=data, headers=headers, timeout=REQUEST_TIMEOUT_S)
        if r.status_code == 200:
            return True
        print(f"[HTTP] POST {r.status_code}: {r.text[:200]}")
        print(f"[HTTP] Payload: {json.dumps(data)}")
        return False
    except Exception as e:
        print(f"[HTTP] Error POST: {e}")
        print(f"[HTTP] Payload: {json.dumps(data)}")
        return False

_last_command_check = 0.0
def check_for_ignition_command():
    """Consulta el comando de ignición por HTTP con ritmo fijo."""
    global _last_command_check
    if not ENABLE_HTTP or requests is None:
        return False
    now_ms = time.time() * 1000.0
    if (now_ms - _last_command_check) < COMMAND_POLL_MS:
        return False
    _last_command_check = now_ms
    try:
        r = requests.get(SERVER_URL_COMMAND, timeout=REQUEST_TIMEOUT_S)
        if r.status_code == 200:
            j = r.json()
            cmd = (j.get("command") or "").upper()
            if cmd == "IGNICION" or cmd == "IGNICIÓN":
                ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                print(f"[CMD] Comando de ignición recibido: {ts}")
                return True
        return False
    except Exception as e:
        print(f"[HTTP] Error GET comando: {e}")
        return False

# ====== Socket.IO (opcional) ======
def start_socketio_thread():
    if not ENABLE_SOCKETIO or sio is None:
        return

    @sio.event
    def connect():
        print("[SIO] Conectado")

    @sio.event
    def disconnect():
        print("[SIO] Desconectado")

    @sio.event
    def connect_error(data):
        print(f"[SIO] Error de conexión: {data}")

    def runner():
        while True:
            try:
                # Puedes incluir transports=['websocket'] si tu server lo soporta
                sio.connect(SIO_URL, transports=['websocket'])
                sio.wait()
            except Exception as e:
                print(f"[SIO] Excepción: {e}")
                time.sleep(2)

    t = threading.Thread(target=runner, daemon=True)
    t.start()

def sio_safe_emit(evento, payload):
    if not ENABLE_SOCKETIO or sio is None:
        return
    try:
        if sio.connected:
            sio.emit(evento, payload)
    except Exception as e:
        print(f"[SIO] Error emit: {e}")

# ====== WebSocket puro (opcional) ======
def start_ws_thread():
    if not ENABLE_WS:
        return

    def ws_on_open(ws):
        nonlocal_vars['ws_connected'] = True
        print("[WS] Conectado")

    def ws_on_close(ws, status_code, msg):
        nonlocal_vars['ws_connected'] = False
        print(f"[WS] Cerrado (code={status_code}, msg={msg})")

    def ws_on_error(ws, error):
        nonlocal_vars['ws_connected'] = False
        print(f"[WS] Error: {error}")

    def worker():
        while True:
            try:
                nonlocal_vars['ws_app'] = websocket.WebSocketApp(
                    WS_URL,
                    on_open=ws_on_open,
                    on_close=ws_on_close,
                    on_error=ws_on_error
                )
                nonlocal_vars['ws_app'].run_forever(ping_interval=20, ping_timeout=10)
            except Exception as e:
                print(f"[WS] Excepción en run_forever: {e}")
            time.sleep(WS_RETRY_DELAY_S)

    # uso de "nonlocal" a través de un diccionario mutable
    global ws_app, ws_connected, ws_send_lock
    nonlocal_vars = {"ws_app": None, "ws_connected": False}
    ws_app = nonlocal_vars['ws_app']
    ws_connected = nonlocal_vars['ws_connected']
    if ws_send_lock is None:
        # crear lock si no existía
        globals()['ws_send_lock'] = threading.Lock()

    t = threading.Thread(target=worker, daemon=True)
    t.start()

def ws_safe_send(payload: dict):
    if not ENABLE_WS:
        return
    try:
        if ws_app and ws_send_lock:
            with ws_send_lock:
                ws_app.send(json.dumps(payload))
    except Exception as e:
        print(f"[WS] Error enviando: {e}")

# ====== Simulador de serial ======
def simulated_serial_generator(stop_event: threading.Event):
    """Genera líneas CSV: fuerza,temperatura,presion en la cola 'line_queue'."""
    print("[SIM] Simulador serial activo.")
    while not stop_event.is_set():
        f = round(random.uniform(*RANGO_FUERZA), ROUND_DECIMALS)
        t = round(random.uniform(*RANGO_TEMP), ROUND_DECIMALS)
        p = round(random.uniform(*RANGO_PRES), ROUND_DECIMALS)
        line = f"{f},{t},{p}"
        try:
            line_queue.put_nowait(line)
        except queue.Full:
            pass
        time.sleep(SIM_INTERVAL_S)

def simulated_serial_write_mock(data_bytes: bytes):
    """Simula recepción de un comando; responde con una línea 'OK_IGNITION,...'."""
    cmd = data_bytes.decode('utf-8', errors='ignore').strip().upper()
    print(f"[SIM SERIAL] Recibido comando -> {cmd}")
    if "IGNICION" in cmd or "IGNICIÓN" in cmd:
        resp = "OK_IGNITION,100.0,25.0,1010.0"
        try:
            line_queue.put_nowait(resp)
        except queue.Full:
            pass

# ====== Programa principal ======
def main():
    # Realtime
    start_socketio_thread()
    start_ws_thread()

    # Serial o Simulado
    sim_stop = threading.Event()
    sim_thread = None
    ser = None

    if USE_SIMULATED_SERIAL:
        sim_thread = threading.Thread(target=simulated_serial_generator, args=(sim_stop,), daemon=True)
        sim_thread.start()
    else:
        if serial is None:
            print("[SERIAL] pyserial no está instalado y USE_SIMULATED_SERIAL=False.")
            return
        try:
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=SERIAL_TIMEOUT_S)
            time.sleep(2)
            print(f"[SERIAL] Abierto {SERIAL_PORT} @ {BAUD_RATE}")
        except Exception as e:
            print(f("[SERIAL] No se pudo abrir el puerto: {e}"))
            return

    try:
        while True:
            # Lee línea
            line = None
            if USE_SIMULATED_SERIAL:
                try:
                    line = line_queue.get(timeout=1.0)
                except queue.Empty:
                    line = None
            else:
                try:
                    raw = ser.readline().decode('utf-8', errors='ignore').strip()
                    line = raw if raw else None
                except Exception as e:
                    print(f"[SERIAL] Error lectura: {e}")
                    line = None

            if not line:
                # Aunque no haya línea, consulta ignición con ritmo fijo por HTTP
                if check_for_ignition_command():
                    if USE_SIMULATED_SERIAL:
                        simulated_serial_write_mock(b"IGNICION")
                    else:
                        try:
                            ser.write(b"IGNICION\n")
                            resp = ser.readline().decode('utf-8', errors='ignore').strip()
                            if resp:
                                print(f"[SERIAL] Respuesta ignición: {resp}")
                        except Exception as e:
                            print(f"[SERIAL] Error al escribir ignición: {e}")
                continue

            # Parseo CSV esperado: fuerza,temperatura,presion
            partes = [p.strip() for p in line.split(',')]
            if len(partes) < 3:
                print(f"[PARSE] Línea inválida: '{line}'")
                continue

            try:
                fuerza = float(partes[0])
                temperatura = float(partes[1])
                presion = float(partes[2])
            except ValueError:
                print(f"[PARSE] No numérica: '{line}'")
                continue

            # Construir payload con date/time separados (como tu tabla)
            data = build_payload(fuerza, temperatura, presion)

            # Enviar por HTTP
            ok_http = send_data_to_server(data)

            # Emitir por realtime si lo activaste
            if ENABLE_SOCKETIO:
                sio_safe_emit(SIO_EVENT, data)
            if ENABLE_WS:
                ws_safe_send(data)

            # Revisa comando de ignición con ritmo fijo
            if check_for_ignition_command():
                if USE_SIMULATED_SERIAL:
                    simulated_serial_write_mock(b"IGNICION")
                else:
                    try:
                        ser.write(b"IGNICION\n")
                        resp = ser.readline().decode('utf-8', errors='ignore').strip()
                        if resp:
                            print(f"[SERIAL] Respuesta ignición: {resp}")
                    except Exception as e:
                        print(f"[SERIAL] Error al escribir ignición: {e}")

    except KeyboardInterrupt:
        print("\n[SALIR] Ctrl+C")
    finally:
        if USE_SIMULATED_SERIAL:
            sim_stop.set()
            if sim_thread is not None:
                sim_thread.join(timeout=1.0)
        else:
            if ser is not None:
                ser.close()
        print("[FIN] Programa terminado.")

if __name__ == "__main__":
    main()
