import serial
import requests
import json
from datetime import datetime

# === CONFIGURACIÓN ===
SERIAL_PORT = "/dev/ttyUSB0"
BAUD_RATE = 115200
API_URL = "http://localhost:3000/api/laniakea"  # tu endpoint backend

# === ABRIR PUERTO SERIAL ===
try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print(f"Conectado al puerto serial: {SERIAL_PORT}")
except Exception as e:
    print(f"Error abriendo el puerto serial: {e}")
    exit(1)

print("Esperando datos del ESP32...\n")

while True:
    try:
        line = ser.readline().decode("utf-8").strip()
        if not line:
            continue

        # Esperamos formato: lat,long,alt
        parts = line.split(",")

        if len(parts) < 3:
            print("Trama inválida:", line)
            continue

        latitud = float(parts[0])
        longitud = float(parts[1])
        altitud = float(parts[2])

        # === Generar JSON ===
        payload = {
            "timestamp": datetime.now().isoformat(),
            "latitud": latitud,
            "longitud": longitud,
            "aceleracion": 0.0,
            "accel_x": 0.0,
            "accel_y": 0.0,
            "accel_z": 0.0,
            "altitud": altitud,
            "conops": "",
            "voltaje": 0.0,
            "corriente": 0.0
        }

        # === Enviar POST ===
        try:
            response = requests.post(API_URL, json=payload, timeout=5)
            if response.status_code == 201:
                print(f"✅ Enviado correctamente: {payload}")
            else:
                print(f"⚠️ Error {response.status_code}: {response.text}")
        except Exception as e:
            print(f"❌ Error al enviar POST: {e}")

    except KeyboardInterrupt:
        print("\nFinalizando programa...")
        break
    except Exception as e:
        print(f"Error general: {e}")
