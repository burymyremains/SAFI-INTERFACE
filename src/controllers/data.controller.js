
import { pool } from "../db.js";
let ignicionState = false;

export const getAllData = async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM data LIMIT 150");
        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        return res.status(500).json({ message: 'Error al obtener los datos.' });
    }
};

export const getBancoData = async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM prueba_estatica_0 ORDER BY id DESC LIMIT 100");
        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        return res.status(500).json({ message: 'Error al obtener los datos.' });
    }
};

export const getLaniakeaData = async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM datos_laniakea ORDER BY date DESC, time DESC LIMIT 100");
        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        return res.status(500).json({ message: 'Error al obtener los datos.' });
    }
};

export const postBancoData = async (req, res, next) => {
    const {
        id_prueba,
        fuerza,
        temperatura,
        presion
    } = req.body;

    if (id_prueba === undefined || fuerza === undefined || temperatura === undefined || presion === undefined)  {
        return res.status(400).json({ message: 'Faltan parámetros en la solicitud.' });
    }

    try {
        // Obtener la fecha y la hora actuales del servidor
        const now = new Date();
        const date = now.toISOString().split('T')[0]; // Obtiene solo la fecha (YYYY-MM-DD)
        const time = now.toISOString().split('T')[1].split('.')[0]; // Obtiene solo la hora en formato HH:MM:SS

        const result = await pool.query(
            `INSERT INTO prueba_estatica_0 
                (id_prueba, fuerza, temperatura, presion, date, time) 
            VALUES 
                ($1, $2, $3, $4, $5, $6) 
            RETURNING *`,
            [id_prueba, fuerza, temperatura, presion, date, time]
        );

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al insertar los datos:', error);
        return res.status(500).json({ message: 'Error al insertar los datos.' });
    }
};

export const ignicion = async (req, res, next) => {
    try {
      const { command } = req.body;
  
      if (command === "IGNICION") {
        console.log("Comando de ignición recibido");
        ignicionState = true; // Activa la ignición
  
        // Programa la desactivación después de 1 segundo
        setTimeout(() => {
          ignicionState = false; 
          console.log("Ignición reseteada a NULL (false)");
        }, 1000);
  
        res.status(200).send({ message: "Comando de ignición procesado correctamente" });
      } else {
        res.status(400).send({ message: "Comando no reconocido" });
      }
    } catch (error) {
      console.error("Error al procesar el comando de ignición:", error);
      res.status(500).send({ message: "Error al procesar el comando de ignición" });
    }
  };

export const getignicion = async (req, res, next) => {
    try {
      // Devuelve IGNICION si está en true, NULL si está en false
      if (ignicionState) {
        return res.status(200).json({ command: "IGNICION" });
      }
      res.status(200).json({ command: null });
    } catch (error) {
      console.error("Error al obtener el estado de ignición:", error);
      res.status(500).json({ message: "Error al obtener el estado de ignición." });
    }
  };

export const getAllXitzin2Data = async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM xitzin_2_data");
        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        return res.status(500).json({ message: 'Error al obtener los datos.' });
    }
};

// Función para obtener en loop las filas de la tabla 'data'
export const fetchDataInLoop = (req, res) => {
    let index = 0; // Índice para controlar la fila a obtener
    const interval = 300; // Intervalo en milisegundos

    const intervalId = setInterval(async () => {
        try {
            const result = await pool.query("SELECT * FROM data");
            if (index < result.rows.length) {
                // Procesa la fila actual (index)
                console.log(result.rows[index]);
                index++;
            } else {
                // Si se alcanzan todas las filas, detiene el bucle
                clearInterval(intervalId);
            }
        } catch (error) {
            console.error('Error al obtener los datos:', error);
            clearInterval(intervalId); // Detiene el bucle en caso de error
            return res.status(500).json({ message: 'Error al obtener los datos.' });
        }
    }, interval);
};

export const postData = async (req, res, next) => {
    const {
        timestamp,
        altitude,
        temperature,
        pressure,
        velocity,
        latitude,
        longitude,
        accel_x,
        accel_y,
        accel_z,
        mission_state,
        air_brake_angle
    } = req.body;

    // Validar que todos los parámetros obligatorios estén presentes
    if (!timestamp || altitude === undefined || temperature === undefined || pressure === undefined || velocity === undefined ||
        latitude === undefined || longitude === undefined || accel_x === undefined || accel_y === undefined || accel_z === undefined ||
        mission_state === undefined || air_brake_angle === undefined) {
        return res.status(400).json({ message: 'Faltan parámetros en la solicitud.' });
    }

    try {
        // Extraer la fecha y la hora de 'timestamp'
        const date = new Date(timestamp).toISOString().split('T')[0]; // Obtiene solo la fecha
        const time = new Date(timestamp).toISOString().split('T')[1].split('.')[0]; // Obtiene solo la hora en formato HH:MM:SS

        const result = await pool.query(
            `INSERT INTO data 
                (date, time, altitude, temperature, pressure, velocity, latitude, longitude, accel_x, accel_y, accel_z, mission_state, air_brake_angle) 
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *`,
            [date, time, altitude, temperature, pressure, velocity, latitude, longitude, accel_x, accel_y, accel_z, mission_state, air_brake_angle]
        );

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al insertar los datos:', error);
        return res.status(500).json({ message: 'Error al insertar los datos.' });
    }
};


export const postLaniakeaData = async (req, res, next) => {
    const {
        latitud,
        longitud,
        altitud,
        aceleracion,
        accel_x, accel_y, accel_z,
        conops,
        voltaje,
        corriente
    } = req.body;

    // Validación simplificada
    if (latitud === undefined || longitud === undefined || altitud === undefined) {
        return res.status(400).json({ message: 'Faltan coordenadas o altitud.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO datos_laniakea 
                (latitud, longitud, aceleracion, accel_x, accel_y, accel_z, altitud, conops, voltaje, corriente, timestamp) 
             VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
             RETURNING *`,
            [latitud, longitud, aceleracion, accel_x, accel_y, accel_z, altitud, conops, voltaje, corriente]
        );

        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Error en datos_laniakea:', error);
        return res.status(500).json({ message: 'Error en la base de datos.' });
    }
};

export const postXitzin2Data = async (req, res, next) => {
    const {
        timestamp,
        altitude,
        temperature,
        pressure,
        velocity,
        latitude,
        longitude,
        accel_x,
        accel_y,
        accel_z,
        mission_state,
        air_brake_angle
    } = req.body;

    // Validar que todos los parámetros obligatorios estén presentes
    if (!timestamp || altitude === undefined || temperature === undefined || pressure === undefined || velocity === undefined ||
        latitude === undefined || longitude === undefined || accel_x === undefined || accel_y === undefined || accel_z === undefined ||
        mission_state === undefined || air_brake_angle === undefined) {
        return res.status(400).json({ message: 'Faltan parámetros en la solicitud.' });
    }

    try {
        // Extraer la fecha y la hora de 'timestamp'
        const date = new Date(timestamp).toISOString().split('T')[0]; // Obtiene solo la fecha
        const time = new Date(timestamp).toISOString().split('T')[1].split('.')[0]; // Obtiene solo la hora en formato HH:MM:SS

        const result = await pool.query(
            `INSERT INTO xitzin_2_data 
                (date, time, altitude, temperature, pressure, velocity, latitude, longitude, accel_x, accel_y, accel_z, mission_state, air_brake_angle) 
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *`,
            [date, time, altitude, temperature, pressure, velocity, latitude, longitude, accel_x, accel_y, accel_z, mission_state, air_brake_angle]
        );

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al insertar los datos:', error);
        return res.status(500).json({ message: 'Error al insertar los datos.' });
    }
};

export const getAllBatteries = async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM battery_status");
        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        return res.status(500).json({ message: 'Error al obtener los datos.' });
    }
};

export const updateBatteries = async (req, res) => {
    const { battery_id, battery_level, voltage, temperature } = req.body;
  
    if (!battery_id || battery_level === undefined || voltage === undefined || temperature === undefined) {
      return res.status(400).json({ message: 'Faltan parámetros en la solicitud.' });
    }
  
    try {
      const result = await pool.query(
        "UPDATE battery_status SET battery_level = $1, voltage = $2, temperature = $3, timestamp = CURRENT_TIMESTAMP WHERE battery_id = $4 RETURNING *",
        [battery_level, voltage, temperature, battery_id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Batería no encontrada.' });
      }
  
      return res.json(result.rows[0]);
    } catch (error) {
      console.error('Error al actualizar los datos:', error);
      return res.status(500).json({ message: 'Error al actualizar los datos.' });
    }
  };
  
  

export const getAllXitzin2Batteries = async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM xitzin_2_batteries");
        return res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        return res.status(500).json({ message: 'Error al obtener los datos.' });
    }
};

export const updateXitzin2Batteries = async (req, res) => {
    const { battery_id, battery_level, voltage, temperature } = req.body;
  
    if (!battery_id || battery_level === undefined || voltage === undefined || temperature === undefined) {
      return res.status(400).json({ message: 'Faltan parámetros en la solicitud.' });
    }
  
    try {
      const result = await pool.query(
        "UPDATE xitzin_2_batteries SET battery_level = $1, voltage = $2, temperature = $3, timestamp = CURRENT_TIMESTAMP WHERE battery_id = $4 RETURNING *",
        [battery_level, voltage, temperature, battery_id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Batería no encontrada.' });
      }
  
      return res.json(result.rows[0]);
    } catch (error) {
      console.error('Error al actualizar los datos:', error);
      return res.status(500).json({ message: 'Error al actualizar los datos.' });
    }
  };
  
