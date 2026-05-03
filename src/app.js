import cors from "cors";
import taskRoutes from "./routes/tasks.routes.js";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import dataRoutes from "./routes/data.routes.js";
import { ORIGIN } from "./config.js";
import { pool } from "./db.js";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

const app = express();


// Middlewares

const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.1.8:5173',
  'http://192.168.100.18:5173',
  'http://192.168.1.140:5173',
  'http://192.168.1.130:5173',
  'http://172.26.50.96:5173',
  'http://192.168.1.107:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.get("/", (req, res) => res.json({ message: "welcome to my API" }));
app.get("/api/ping", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  return res.json(result.rows[0]);
});
app.use("/api", taskRoutes);
app.use("/api", usersRoutes);
app.use("/api", authRoutes);
app.use("/api", dataRoutes);


// Error Hander
app.use((err, req, res, next) => {
  res.status(500).json({
    status: "error",
    message: err.message,
  });
});

app.post('/api/bancodepruebas', (req, res) => {
  const data = req.body;

  // Guardar datos en la base de datos (ya está en tu código)
  // Enviar datos en tiempo real a los clientes WebSocket
  broadcastData(data);

  res.json({ message: "Datos recibidos y enviados por WebSocket" });
});


// Importar y ejecutar el lector serial
import startSerialReader from "./SerialReader.js";


export default app;
