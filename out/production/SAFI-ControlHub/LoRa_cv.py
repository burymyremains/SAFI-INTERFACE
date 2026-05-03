import serial
import requests
import time
import json
import struct

# Configuración del puerto serial
port = "/dev/ttyACM1"  # Cambia según tu sistema
baud_rate = 115200

# URL del backend para POST
server_url_data = "http://localhost:3000/api/data"

# Inicializar puerto serial
ser = serial.Serial(port, baud_rate)
time.sleep(2)

# Estado base acumulado
estado = {
    "altitude": 20000,    # en cm
    "temperature": 25,    # en °C
    "pressure": 1013,     # en deci-mbar
    "velocity": 120,      # en deci-m/s
    "accel_x": 0,
    "accel_y": 0,
    "accel_z": -1000,
    "mission_state": 0,
    "air_brake": 0
}

# Formato del paquete diferencial
formato = '<bbbbbbbBb'  # 9 bytes

# Función para enviar por POST
def send_data_to_server(data):
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(server_url_data, json=data, headers=headers)
        if response.status_code == 200:
            #print("POST exitoso:", data)
            return True
        else:
            print(f"Error en el POST: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error al conectar con el servidor: {e}")
        return False

# Bucle principal
while True:
    if ser.in_waiting >= struct.calcsize(formato):
        try:
            raw = ser.read(struct.calcsize(formato))
            fields = struct.unpack(formato, raw)

            # Aplicar diferencia acumulada
            estado["altitude"] += fields[0]
            estado["temperature"] += fields[1]
            estado["pressure"] += fields[2]
            estado["velocity"] += fields[3]
            estado["accel_x"] += fields[4]
            estado["accel_y"] += fields[5]
            estado["accel_z"] += fields[6]
            estado["mission_state"] = fields[7]
            estado["air_brake"] += fields[8]

            # Construcción del JSON
            # Construcción del JSON
            data = {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S") + f".{int((time.time() % 1)*1000):03d}",
                "altitude": float(estado["altitude"] / 100.0),
                "temperature": float(estado["temperature"]),
                "pressure": float(estado["pressure"] / 10.0),
                "velocity": float(estado["velocity"] / 10.0),
                "latitude": 0.0,
                "longitude": 0.0,
                "accel_x": estado["accel_x"],
                "accel_y": estado["accel_y"],
                "accel_z": estado["accel_z"],
                "mission_state": estado["mission_state"],
                "air_brake_angle": estado["air_brake"]
            }


            send_data_to_server(data)

        except Exception as e:
            print(f"Error al procesar paquete LoRa: {e}")
