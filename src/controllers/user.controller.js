import { pool } from "../db.js";
import bcrypt from "bcrypt";

export const getAllUsers = async (req, res, next) => {
  const result = await pool.query("SELECT * FROM users");
  return res.json(result.rows);
};

export const getUser = async (req, res) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe un usuario con ese id",
    });
  }

  return res.json(result.rows[0]);
};

export const getAllLogs = async (req, res) => {
  const result = await pool.query("SELECT * FROM logs_username");
  return res.json(result.rows);
}

export const createLog = async (req, res) => {
  const { user_id } = req.body;

  try {
    // Buscar el usuario por su UID hexadecimal
    const search = await pool.query(
      "SELECT * FROM users WHERE uid_hex = $1",
      [user_id]
    );

    // Verificar si se encontró un usuario
    if (search.rows.length === 0) {
      return res.status(400).json({
        error: "Usuario no encontrado"
      });
    }

    // Comparar el UID proporcionado con el UID almacenado en la base de datos
    if (search.rows[0].uid_hex !== user_id) {
      return res.status(400).json({
        error: "UID no válido"
      });
    }

    // Si todo está bien, insertar un registro en la tabla de logs
    const result = await pool.query(
      "INSERT INTO logs (user_id) VALUES ($1) RETURNING *",
      [search.rows[0].id]
    );

    return res.status(200).json({
      message: "Registro creado exitosamente"
    });
  } catch (error) {
    console.error("Error al crear el registro:", error);
    return res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};


export const updateUser = async (req, res) => {
  const id = req.params.id;
  const { username, email, password, level } = req.body;

  const result = await pool.query(
    "UPDATE users SET username = $1, password = $2, email = $3, level = $4 WHERE id = $5 RETURNING*",
    [username, password, email, level, id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe un usuario con ese id",
    });
  }

  return res.json(result.rows[0]);
};

export const deleteUser = async (req, res) => {
  const result = await pool.query("DELETE FROM users WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe un usuario con ese id",
    });
  }

  return res.sendStatus(204);
};
