import serial
import requests
import time
import websocket
import json

# Configuración del puerto serial
port = "/dev/ttyACM0"  # Cambia esto según tu sistema operativo
baud_rate = 9600  

# Configuración de URLs del servidor
server_url_data = "http://192.168.100.18:3000/api/bancodepruebas"  
server_url_command = "http://192.168.100.18:3000/api/ignicion"  

# Configuración WebSocket
ws = websocket.WebSocket()
try:
    ws.connect("ws://192.168.100.18:8081")  # Conectar al servidor WebSocket
except Exception as e:
    print(f"Error al conectar a WebSocket: {e}")

# Iniciar conexión serial con Arduino
ser = serial.Serial(port, baud_rate)
time.sleep(2)

def send_data_to_server(data):
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(server_url_data, json=data, headers=headers)
        if response.status_code == 200:
            return True  # POST exitoso
        else:
            print(f"Error en el POST: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error al conectar con el servidor: {e}")
        return False
    
def check_for_ignition_command():
    try:
        response = requests.get(server_url_command)
        if response.status_code == 200:
            command = response.json().get("command")
            if command == "IGNICION":
                print("Comando de ignición recibido desde el servidor: " + time.strftime("%H:%M:%S:%MS"))
                ser.write("IGNICION".encode('utf-8'))
                return True
        return False
    except Exception as e:
        print(f"Error al consultar el comando de ignición: {e}")
        return False

# Lógica principal
while True:
    if ser.in_waiting > 0:
        raw_data = ser.readline().decode('utf-8').strip()
        try:
            valores = raw_data.split(',')
            #   fuerza_total = float(valores[0]) + float(valores[1]) + float(valores[2])
            data = {
                "id_prueba": 0,
                "fuerza": float(valores[0]),
                "temperatura": float(valores[1]),
                "presion": float(valores[4])
            }

            # Enviar datos a la base de datos y por WebSocket
            if send_data_to_server(data):
                try:
                    ws.send(json.dumps(data))  # Enviar por WebSocket
                    #print(data)
                except Exception as e:
                    print(f"Error enviando WebSocket: {e}")
            if check_for_ignition_command():
                    try:
                        # Leer datos específicos del Arduino al recibir el comando
                        ignition_data = ser.readline().decode('utf-8').strip()
                        #print(f"Datos de ignición: {ignition_data}")
                    except Exception as e:
                        print(f"Error al leer datos de ignición: {e}")

        except Exception as e:
            print(f"Error al procesar los datos: {e}")


#puro empuje
