import app from "./app.js";
import { createServer } from "http";
import { initWebSocket } from "./websocket.js";
import { PORT } from "./config.js";

const server = createServer(app);
initWebSocket(server);

server.listen(PORT, () =>
  console.log("Servidor HTTP + WS corriendo en puerto", PORT)
);
