import SerialPort from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { pool } from "./db.js"; // Asegúrate de que esté bien configurada la conexión a la BD

const SERIAL_PORT = "/dev/ttyUSB0"; // Cambia esto al puerto de tu dispositivo
const BAUD_RATE = 9600;

const startSerialReader = () => {
  const port = new SerialPort(SERIAL_PORT, { baudRate: BAUD_RATE });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  console.log(`Lector Serial iniciado en el puerto: ${SERIAL_PORT}`);

  // Leer datos del puerto serial
  parser.on("data", async (data) => {
    console.log("Datos recibidos:", data);

    // Aquí envías los datos a la base de datos
    try {
      const query = "INSERT INTO your_table (your_column) VALUES ($1)"; // Cambia esto según tu tabla
      await pool.query(query, [data]); // Usa el pool de conexiones
      console.log("Datos guardados en la base de datos:", data);
    } catch (err) {
      console.error("Error al guardar los datos:", err.message);
    }
  });

  port.on("error", (err) => {
    console.error("Error en el puerto serial:", err.message);
  });
};

export default startSerialReader;
