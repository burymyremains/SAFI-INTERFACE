import serial
import requests
import time
from datetime import datetime

# === CONFIGURACIÓN ===
SERIAL_PORT = "/dev/ttyUSB0"
BAUD_RATE = 115200
API_URL = "http://localhost:3000/api/laniakea"

def run_telemetry():
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"Conectado a SAFI-Hardware en: {SERIAL_PORT}")
    except Exception as e:
        print(f"Error: No se pudo abrir el puerto {SERIAL_PORT}: {e}")
        return

    print("Esperando telemetría de Laniakea...\n")

    while True:
        try:
            line = ser.readline().decode("utf-8").strip()
            if not line:
                continue

            # Formato esperado del ESP32: lat,long,alt
            parts = line.split(",")
            if len(parts) < 3:
                print(f"⚠️ Trama incompleta: {line}")
                continue

            payload = {
                "latitud": float(parts[0]),
                "longitud": float(parts[1]),
                "altitud": float(parts[2]),
                "aceleracion": 0.0,
                "accel_x": 0.0,
                "accel_y": 0.0,
                "accel_z": 0.0,
                "conops": "FLIGHT_MODE",
                "voltaje": 0.0,
                "corriente": 0.0
            }

            # Enviar al Backend
            try:
                response = requests.post(API_URL, json=payload, timeout=2)
                if response.status_code == 201:
                    print(f"Dato enviado | Alt: {payload['altitud']}m | Lat: {payload['latitud']}")
                else:
                    print(f"Error servidor ({response.status_code}): {response.text}")
            except requests.exceptions.RequestException as e:
                print(f"Error de red (¿Backend encendido?): {e}")

        except ValueError:
            print(f"Error de conversión en trama: {line}")
        except KeyboardInterrupt:
            print("\nMonitoreo detenido por el usuario.")
            break
        except Exception as e:
            print(f"Error inesperado: {e}")

    ser.close()

if __name__ == "__main__":
    run_telemetry()