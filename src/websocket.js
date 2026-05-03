import { Server } from "socket.io";
import { pool } from "./db.js";

let io;
let ignicionState = false;

// Guardamos la última marca temporal (o ID) emitida por canal
const lastTimestamps = {
  "nuevos-datos": null,
  "banco-datos": null,
  "xitzin2-datos": null,
  "baterias": null,
  "xitzin2-baterias": null,
  "laniakea": null,
};

export function initWebSocket(server) {
  io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("WS conectado:", socket.id);

    (async () => {
      const data = await pool.query("SELECT * FROM data ORDER BY date DESC, time DESC LIMIT 150");
      const banco = await pool.query("SELECT * FROM prueba_estatica_0 ORDER BY id DESC LIMIT 100");
      const laniakea = await pool.query ("SELECT * FROM datos_laniakea ORDER BY date DESC, time DESC LIMIT 100");
      const x2data = await pool.query("SELECT * FROM xitzin_2_data");
      const bats = await pool.query("SELECT * FROM battery_status");
      const x2bats = await pool.query("SELECT * FROM xitzin_2_batteries");

      socket.emit("nuevos-datos", data.rows);
      socket.emit("banco-datos", banco.rows);
      socket.emit("xitzin2-datos", x2data.rows);
      socket.emit("baterias", bats.rows);
      socket.emit("xitzin2-baterias", x2bats.rows);
      socket.emit("ignicion-estado", { command: ignicionState ? "IGNICION" : null });
      socket.emit("laniakea", laniakea.rows);

      // Guardamos última referencia
      lastTimestamps["nuevos-datos"] = `${data.rows[0]?.date}-${data.rows[0]?.time}`;
      lastTimestamps["banco-datos"] = banco.rows[0]?.id;
      lastTimestamps["xitzin2-datos"] = JSON.stringify(x2data.rows[0]);
      lastTimestamps["baterias"] = JSON.stringify(bats.rows);
      lastTimestamps["xitzin2-baterias"] = JSON.stringify(x2bats.rows);
      lastTimestamps["laniakea"] = `${laniakea.rows[0]?.date}-${laniakea.rows[0]?.time}`;
    })().catch(console.error);

    socket.on("ignicion", ({ command }) => {
      if (command === "IGNICION") {
        ignicionState = true;
        io.emit("ignicion-estado", { command: "IGNICION" });
        setTimeout(() => {
          ignicionState = false;
          io.emit("ignicion-estado", { command: null });
        }, 1000);
      }
    });

    socket.on("disconnect", () => {
      console.log("WS desconectado:", socket.id);
    });
  });

  // 🔁 Emisión controlada solo si cambia la última marca temporal
  const emitIfNew = async ({ query, channel, getLast }) => {
    const { rows } = await pool.query(query);
    if (rows.length === 0) return;

    const newTimestamp = getLast(rows);
    if (newTimestamp !== lastTimestamps[channel]) {
      io.emit(channel, rows);
      lastTimestamps[channel] = newTimestamp;
    }
  };

  setInterval(() => emitIfNew({
    query: "SELECT * FROM data ORDER BY date DESC, time DESC LIMIT 150",
    channel: "nuevos-datos",
    getLast: (rows) => `${rows[0]?.date}-${rows[0]?.time}`,
  }), 100);

  setInterval(() => emitIfNew({
    query: "SELECT * FROM prueba_estatica_0 ORDER BY id DESC LIMIT 100",
    channel: "banco-datos",
    getLast: (rows) => rows[0]?.id,
  }), 500);

  setInterval(() => emitIfNew({
    query: "SELECT * FROM xitzin_2_data",
    channel: "xitzin2-datos",
    getLast: (rows) => JSON.stringify(rows[0]),
  }), 200);

  setInterval(() => emitIfNew({
    query: "SELECT * FROM battery_status",
    channel: "baterias",
    getLast: (rows) => JSON.stringify(rows),
  }), 5000);

  setInterval(() => emitIfNew({
    query: "SELECT * FROM xitzin_2_batteries",
    channel: "xitzin2-baterias",
    getLast: (rows) => JSON.stringify(rows),
  }), 5000);

  setInterval(() => emitIfNew({
    query: "SELECT * FROM datos_laniakea ORDER BY date DESC, time DESC LIMIT 100",
    channel: "laniakea",
    getLast: (rows) => JSON.stringify(rows),
  }), 200);
  
}
