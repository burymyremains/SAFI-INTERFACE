import requests
import time
import random

API_URL = "http://localhost:3000/api/laniakea"

def simular_telemetria():
    print("Iniciando Simulador de Telemetría SAFI - Misión Laniakea")
    print(f"Destino de red: {API_URL}")

    # Coordenadas base (Laguna de Sayula)
    lat_base = 19.9500
    lon_base = -103.5000

    altitud = 0.0
    velocidad_y = 0.0
    apogeo_alcanzado = False
    drogue_desplegado = False
    main_desplegado = False

    # === FASE 0: PREFLIGHT (Pre-vuelo & Chequeo de Sistemas) ===
    conops = "Preflight"
    print(f"[{conops.upper()}] Iniciando revisión de aviónica y telemetría...")
    time.sleep(1)
    print(f"[{conops.upper()}] Rechecking XBee link... [OK]")
    print(f"[{conops.upper()}] GPS Fix lock: {lat_base}, {lon_base}... [OK]")
    print(f"[{conops.upper()}] Sensores inicializados... [OK]")
    print(f"[{conops.upper()}] Conexión con base de datos... [OK]")
    print(f"[{conops.upper()}] Todo en buenas condiciones para el lanzamiento.")

    # Cuenta regresiva
    for cuenta in range(5, 0, -1):
        print(f"🚀 T-{cuenta} segundos...")
        # Enviamos un estado de prevuelo estático en ceros a la BD
        payload_pre = {
            "latitud": lat_base, "longitud": lon_base, "altitud": 0.0,
            "aceleracion": 0.0, "accel_x": 0.0, "accel_y": 0.0, "accel_z": 9.81,
            "conops": conops, "voltaje": 4.15, "corriente": 0.12
        }
        try: requests.post(API_URL, json=payload_pre, timeout=1)
        except: pass
        time.sleep(1)

    print("IGNICIÓN Y DESPEGUE")

    segundo_vuelo = 0

    # FASES DE VUELO ACTIVO
    while True:
        try:
            segundo_vuelo += 1

            #FÍSICA SIMULADA DEL COHETE
            if segundo_vuelo <= 15:
                # Lift-off: Empuje dinámico potente hacia los ~3,000 metros
                conops = "Lift-off"
                velocidad_y = random.uniform(220.0, 260.0) - (segundo_vuelo * 4) # Aceleración inicial
                altitud += velocidad_y
                aceleracion_z = round(random.uniform(25.0, 45.0), 2)

            elif altitud < 3100 and not apogeo_alcanzado:
                # Nos acercamos al punto máximo (Apogeo )
                conops = "Lift-off"
                velocidad_y = random.uniform(15.0, 40.0)
                altitud += velocidad_y
                aceleracion_z = round(random.uniform(5.0, 9.8), 2)
                if altitud >= 3000:
                    altitud = random.uniform(3050.0, 3120.0) # Forzar el pico cerca de 3km
                    apogeo_alcanzado = True

            elif apogeo_alcanzado and not drogue_desplegado:
                # Alcanzamos la cima de la trayectoria
                conops = "Apogee"
                velocidad_y = 0.0
                aceleracion_z = 0.0
                drogue_desplegado = True  # Inmediatamente pasa a la siguiente fase

            elif drogue_desplegado and not main_desplegado:
                # Drogue: Caída libre controlada por paracaídas secundario de arrastre
                conops = "Drogue"
                velocidad_y = random.uniform(45.0, 60.0) # Descenso rápido pero frenado
                altitud -= velocidad_y
                aceleracion_z = round(random.uniform(9.8, 12.0), 2)
                if altitud <= 600: # A los 600 metros se abre el principal
                    main_desplegado = True

            elif main_desplegado and altitud > 5:
                # Main: Apertura del paracaídas principal
                conops = "Main"
                velocidad_y = random.uniform(5.0, 8.0) # Descenso lento
                altitud -= velocidad_y
                aceleracion_z = round(random.uniform(9.5, 9.9), 2)

            else:
                # Land: El cohete tocó el suelo
                conops = "Land"
                altitud = 0.0
                velocidad_y = 0.0
                aceleracion_z = 9.81

            # Deriva geográfica sutil por el viento durante la caída
            latitud = lat_base + (segundo_vuelo * 0.00003)
            longitud = lon_base + (segundo_vuelo * 0.00002)

            # Armando el paquete de datos estructurado exacto para tu BD
            payload = {
                "latitud": round(latitud, 6),
                "longitud": round(longitud, 6),
                "altitud": round(max(0.0, altitud), 2),
                "aceleracion": round(velocidad_y, 2) if conops == "Lift-off" else 0.0,
                "accel_x": round(random.uniform(-0.5, 0.5), 2),
                "accel_y": round(random.uniform(-0.5, 0.5), 2),
                "accel_z": aceleracion_z,
                "conops": conops, # Aquí se inyecta dinámicamente la fase de la misión
                "voltaje": round(random.uniform(3.8, 4.0), 2),
                "corriente": round(random.uniform(0.15, 0.25), 2)
            }

            # Enviar los datos por HTTP POST
            try:
                response = requests.post(API_URL, json=payload, timeout=2)
                if response.status_code in [200, 201]:
                    print(f"[{payload['conops']}] Enviado | Altitud: {payload['altitud']}m | Vel: {payload['aceleracion']} m/s")
                else:
                    print(f"Error en Backend ({response.status_code}): {response.text}")
            except requests.exceptions.RequestException as e:
                print(f"Error de comunicación con la Estación Terrena: {e}")

            # Si ya aterrizó, dejamos de enviar bucles infinitos de telemetría de vuelo
            if conops == "Land":
                print("\n[MISION COMPLETADA]")
                break

            time.sleep(1)

        except KeyboardInterrupt:
            print("\nSimulador abortado por el operador de comando.")
            break

if __name__ == "__main__":
    simular_telemetria()