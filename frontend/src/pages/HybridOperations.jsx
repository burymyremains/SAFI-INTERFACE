import React, { useMemo, useReducer, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  LinearProgress,
  Button,
  Stack,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Lock,
  Power,
  Radio,
  ShieldAlert,
  Zap,
  RefreshCw,
} from "lucide-react";

/**
 * =========================
 *  1) Estado base (Frontend)
 * =========================
 * Esto es “lo que después te va a llegar por backend”.
 * Por ahora lo controlamos con UI (simulación).
 */
const initialState = {
  timestamp: new Date().toLocaleTimeString(),
  modo: "TIERRA",
  estado: "SEGURO",

  enlace_primario: { estado: "OK", rssi: -45, ultimo_ms: 12 },
  enlace_secundario: { estado: "OK", rssi: -82, ultimo_ms: 45 },

  seguridad: { paro_emergencia: false, llave_armado: false, zona_despejada: false },

  sensores: {
    ptanque_bar: 42.1,
    plinea_bar: 38.2,
    pcamara_bar: 0.12,
    mox_kg: 120.4,
    empuje_n: 0,
    temp_linea_c: 24.7,
  },

  valvulas: {
    oxidizer_fill: "CERRADA",
    nitrogen_purge: "CERRADA",
    engine_isolation: "CERRADA",
    engine_vent: "CERRADA",
    ground_vent: "CERRADA",
    relief: "CERRADA",
    quick_disconnect: "CERRADA",
    mov_air_solenoid: "CERRADA",
  },

  interbloqueos: [
    { id: "ZONA", ok: false, texto: "Zona despejada confirmada" },
    { id: "ESTOP", ok: true, texto: "Paro de emergencia INACTIVO" },
    { id: "COMMS", ok: true, texto: "Enlaces de comunicación estables" },
    { id: "PRES", ok: false, texto: "Presión de carga requerida" },
  ],

  alarmas: [
    { nivel: "INFO", texto: "Sistema inicializado en modo TIERRA." },
    { nivel: "ADVERTENCIA", texto: "Tanque N2O por debajo del umbral operativo." },
  ],

  procedimiento: {
    paso: 3,
    total: 12,
    notas: ["Conexión GSE establecida.", "Verificación de telemetría completa.", "Iniciando fase de presurización N2."],
  },
};

/**
 * =========================
 *  2) Reducer (Frontend)
 * =========================
 */
function reducer(state, action) {
  switch (action.type) {
    case "SET_TIMESTAMP":
      return { ...state, timestamp: action.value };
    case "SET_FIELD":
      return { ...state, [action.key]: action.value };
    case "SET_NESTED":
      return { ...state, [action.key]: { ...state[action.key], ...action.value } };
    case "SET_SENSORS":
      return { ...state, sensores: { ...state.sensores, ...action.value } };
    case "SET_VALVES":
      return { ...state, valvulas: { ...state.valvulas, ...action.value } };
    case "SET_INTERLOCKS":
      return { ...state, interbloqueos: action.value };
    case "SET_ALARMS":
      return { ...state, alarmas: action.value };
    case "RESET":
      return { ...initialState, timestamp: new Date().toLocaleTimeString() };
    default:
      return state;
  }
}

/**
 * =========================
 *  3) UI Components
 * =========================
 */
function KPIBox({ label, value, unit, color = "rgba(34,211,238,0.95)", Icon }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 2.5,
        borderColor: "rgba(255,255,255,0.09)",
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(10px)",
        "&:hover": { borderColor: "rgba(34,211,238,0.35)" },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 900,
              color: "rgba(148,163,184,0.85)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </Typography>
          {Icon ? <Icon size={14} color="rgba(148,163,184,0.65)" /> : null}
        </Box>

        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.8 }}>
          <Typography
            sx={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 22,
              fontWeight: 900,
              color,
              lineHeight: 1,
            }}
          >
            {value ?? "---"}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 900,
              color: "rgba(148,163,184,0.75)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            {unit}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function InterlockItem({ ok, text }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        p: 1.1,
        borderRadius: 2,
        border: "1px solid",
        borderColor: ok ? "rgba(16,185,129,0.22)" : "rgba(244,63,94,0.22)",
        bgcolor: ok ? "rgba(16,185,129,0.06)" : "rgba(244,63,94,0.06)",
        color: ok ? "rgba(167,243,208,0.95)" : "rgba(253,164,175,0.95)",
      }}
    >
      {ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      <Typography sx={{ fontSize: 13, fontWeight: 650 }}>{text}</Typography>
    </Box>
  );
}

function ValveLabel({ name, state, x, y }) {
  const isOpen = String(state || "").toUpperCase() === "ABIERTA";
  return (
    <Box sx={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", pointerEvents: "none" }}>
      <Box
        sx={{
          px: 1,
          py: 0.35,
          fontSize: 9,
          fontWeight: 900,
          textTransform: "uppercase",
          bgcolor: "rgba(30,41,59,0.92)",
          color: "rgba(148,163,184,0.9)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "none",
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          textAlign: "center",
          minWidth: 90,
        }}
      >
        {name}
      </Box>
      <Box
        sx={{
          px: 1.2,
          py: 0.8,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
          border: "1px solid",
          borderColor: isOpen ? "rgba(16,185,129,0.45)" : "rgba(244,63,94,0.45)",
          bgcolor: "rgba(15,23,42,0.60)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
          textAlign: "center",
          minWidth: 90,
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: isOpen ? "rgba(52,211,153,0.95)" : "rgba(251,113,133,0.95)",
            lineHeight: 1,
          }}
        >
          {state || "---"}
        </Typography>
      </Box>
    </Box>
  );
}

function fmt(val) {
  if (val === null || val === undefined || Number.isNaN(val)) return "---";
  return Number(val).toFixed(2);
}

/**
 * =========================
 *  4) Página: HybridOps
 * =========================
 */
export default function HybridOps() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // “Simulación” local: en lugar de WebSocket
  const [simOn, setSimOn] = useState(true);

  // Chip visual de estado
  const stateChip = useMemo(() => {
    const ok = state.estado === "SEGURO";
    return (
      <Chip
        label={state.estado}
        size="small"
        sx={{
          fontWeight: 900,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          bgcolor: ok ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)",
          border: "1px solid",
          borderColor: ok ? "rgba(16,185,129,0.35)" : "rgba(244,63,94,0.35)",
          color: ok ? "rgba(52,211,153,0.95)" : "rgba(251,113,133,0.95)",
        }}
      />
    );
  }, [state.estado]);

  // Mantener timestamp “vivo” sin backend
  React.useEffect(() => {
    if (!simOn) return;
    const t = setInterval(() => dispatch({ type: "SET_TIMESTAMP", value: new Date().toLocaleTimeString() }), 1000);
    return () => clearInterval(t);
  }, [simOn]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#020617", color: "rgba(226,232,240,0.92)" }}>
      {/* HEADER SAFI */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          px: { xs: 2, md: 3 },
          py: 1.6,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(2, 6, 23, 0.72)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 1.6, alignItems: "center" }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              borderRadius: 1.5,
              bgcolor: "rgba(34,211,238,0.10)",
              border: "1px solid rgba(34,211,238,0.20)",
            }}
          >
            <Cpu size={18} color="rgba(34,211,238,0.95)" />
          </Box>

          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.03em", textTransform: "uppercase", fontStyle: "italic", color: "white" }}>
              Hybrid Systems Ops{" "}
              <Box component="span" sx={{ ml: 1, fontSize: 11, fontStyle: "normal", color: "rgba(34,211,238,0.95)" }}>
                SAFI-UAEMéx
              </Box>
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mt: 0.3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                <Clock size={12} color="rgba(148,163,184,0.75)" />
                <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(148,163,184,0.75)" }}>
                  {state.timestamp || "---"}
                </Typography>
              </Box>
              <Box sx={{ width: 4, height: 4, borderRadius: 99, bgcolor: "rgba(148,163,184,0.35)" }} />
              <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(34,211,238,0.9)" }}>
                FRONTEND-ONLY
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Controles rápidos arriba */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.6 }}>
          <FormControlLabel
            control={<Switch checked={simOn} onChange={(e) => setSimOn(e.target.checked)} />}
            label={
              <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(148,163,184,0.8)" }}>
                Simulation
              </Typography>
            }
          />
          <Tooltip title="Reset a valores iniciales">
            <IconButton onClick={() => dispatch({ type: "RESET" })} sx={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 2 }}>
              <RefreshCw size={16} color="rgba(148,163,184,0.9)" />
            </IconButton>
          </Tooltip>

          <Box sx={{ display: { xs: "none", md: "block" }, textAlign: "right" }}>
            <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)" }}>
              Master State
            </Typography>
            <Box sx={{ mt: 0.6 }}>{stateChip}</Box>
          </Box>
        </Box>
      </Box>

      {/* MAIN */}
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Grid container spacing={2.2}>
          {/* KPIs */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <KPIBox
                  label="Primary Link"
                  value={state.enlace_primario.estado}
                  unit={`${state.enlace_primario.rssi} dBm`}
                  Icon={Radio}
                  color="rgba(52,211,153,0.95)"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPIBox
                  label="Secondary Link"
                  value={state.enlace_secundario.estado}
                  unit={`${state.enlace_secundario.rssi} dBm`}
                  Icon={Activity}
                  color="rgba(251,191,36,0.95)"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPIBox
                  label="Safety Lock"
                  value={state.seguridad.llave_armado ? "ARMED" : "LOCKED"}
                  unit="Keyswitch"
                  Icon={ShieldAlert}
                  color={state.seguridad.llave_armado ? "rgba(251,113,133,0.95)" : "rgba(52,211,153,0.95)"}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KPIBox
                  label="Ground Clear"
                  value={state.seguridad.zona_despejada ? "CONFIRMED" : "WAITING"}
                  unit="Radar"
                  Icon={Lock}
                  color={state.seguridad.zona_despejada ? "rgba(52,211,153,0.95)" : "rgba(148,163,184,0.85)"}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* P&ID - MÁS ANCHO (como pediste) */}
          <Grid item xs={12} lg={9}>
            <Card
              variant="outlined"
              sx={{
                height: 640,
                position: "relative",
                overflow: "hidden",
                borderRadius: 3,
                borderColor: "rgba(255,255,255,0.08)",
                bgcolor: "rgba(15, 23, 42, 0.55)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Box sx={{ position: "absolute", top: 14, left: 14, zIndex: 5 }}>
                <Chip
                  label="P&ID (FRONTEND MOCK)"
                  size="small"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    bgcolor: "rgba(34,211,238,0.10)",
                    border: "1px solid rgba(34,211,238,0.25)",
                    color: "rgba(34,211,238,0.92)",
                  }}
                />
              </Box>

              <Box sx={{ width: "100%", height: "100%", position: "relative", bgcolor: "rgba(15,23,42,0.35)" }}>
                <Box sx={{ width: "100%", height: "100%", p: 3.5, opacity: 0.9 }}>
                  {/* SVG base: placeholder (luego lo hacemos igualito al sistema real) */}
                  <svg viewBox="0 0 1200 520" width="100%" height="100%">
                    <defs>
                      <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(34, 211, 238, 0.20)" />
                        <stop offset="100%" stopColor="rgba(34, 211, 238, 0.60)" />
                      </linearGradient>
                    </defs>

                    {/* Ground / GSE */}
                    <rect x="40" y="300" width="90" height="170" rx="12" fill="rgba(30,41,59,0.85)" stroke="rgba(34,211,238,0.35)" strokeWidth="2" />
                    <rect x="150" y="300" width="90" height="170" rx="12" fill="rgba(30,41,59,0.85)" stroke="rgba(34,211,238,0.35)" strokeWidth="2" />
                    <text x="85" y="350" fill="rgba(148,163,184,0.75)" fontSize="14" fontWeight="800" textAnchor="middle">N2O</text>
                    <text x="195" y="350" fill="rgba(148,163,184,0.75)" fontSize="14" fontWeight="800" textAnchor="middle">N2</text>

                    {/* Lines */}
                    <path d="M40 260 L240 260 L240 190 L420 190" fill="none" stroke="url(#pipeGrad)" strokeWidth="10" />
                    <path d="M40 510 L330 510 L330 310 L420 310" fill="none" stroke="rgba(251, 191, 36, 0.30)" strokeWidth="7" strokeDasharray="6,6" />

                    {/* Manifold */}
                    <rect x="420" y="150" width="170" height="200" rx="18" fill="rgba(30,41,59,0.70)" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
                    <text x="505" y="250" fill="rgba(226,232,240,0.85)" fontSize="14" fontWeight="900" textAnchor="middle">MANIFOLD</text>

                    {/* QD */}
                    <path d="M590 250 L820 250" fill="none" stroke="url(#pipeGrad)" strokeWidth="10" />
                    <circle cx="820" cy="250" r="12" fill="rgba(244,63,94,0.9)" />

                    {/* Rocket Tank */}
                    <rect x="880" y="70" width="220" height="400" rx="110" fill="rgba(30,41,59,0.30)" stroke="rgba(34,211,238,0.50)" strokeWidth="3" />
                    <text x="990" y="270" fill="rgba(34,211,238,0.95)" fontSize="18" fontWeight="900" textAnchor="middle">OX TANK</text>
                  </svg>
                </Box>

                {/* Overlays válvulas */}
                <ValveLabel name="OX FILL" state={state.valvulas.oxidizer_fill} x="34%" y="32%" />
                <ValveLabel name="N2 PURGE" state={state.valvulas.nitrogen_purge} x="34%" y="57%" />
                <ValveLabel name="MAIN ISO" state={state.valvulas.engine_isolation} x="60%" y="46%" />
                <ValveLabel name="VENT" state={state.valvulas.engine_vent} x="82%" y="15%" />

                {/* Badges presión */}
                <Box sx={{ position: "absolute", top: "36%", right: 18, display: "flex", flexDirection: "column", gap: 1.2 }}>
                  <Box sx={{ p: 1.1, borderRadius: 2, border: "1px solid rgba(34,211,238,0.25)", bgcolor: "rgba(15,23,42,0.55)", minWidth: 210 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: "rgba(148,163,184,0.75)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      Tank Pressure
                    </Typography>
                    <Typography sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 18, fontWeight: 900, color: "rgba(34,211,238,0.95)" }}>
                      {fmt(state.sensores.ptanque_bar)} bar
                    </Typography>
                  </Box>

                  <Box sx={{ p: 1.1, borderRadius: 2, border: "1px solid rgba(251,191,36,0.25)", bgcolor: "rgba(15,23,42,0.55)", minWidth: 210 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: "rgba(148,163,184,0.75)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      Cam. Pressure
                    </Typography>
                    <Typography sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 18, fontWeight: 900, color: "rgba(251,191,36,0.95)" }}>
                      {fmt(state.sensores.pcamara_bar)} bar
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Panel Derecho: ahora será “Control Panel” de simulación */}
          <Grid item xs={12} lg={3}>
            <Stack spacing={2.2}>
              {/* Sensores */}
              <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(10px)" }}>
                <CardContent sx={{ p: 2.2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.6 }}>
                    <Zap size={14} color="rgba(34,211,238,0.95)" />
                    <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(148,163,184,0.8)" }}>
                      Frontend Controls
                    </Typography>
                  </Box>

                  <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(148,163,184,0.75)" }}>
                    Master State
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={state.estado}
                    onChange={(e) => dispatch({ type: "SET_FIELD", key: "estado", value: e.target.value })}
                    sx={{
                      mt: 0.8,
                      bgcolor: "rgba(2,6,23,0.35)",
                      borderRadius: 2,
                      "& fieldset": { borderColor: "rgba(255,255,255,0.10)" },
                      color: "rgba(226,232,240,0.92)",
                    }}
                  >
                    <MenuItem value="SEGURO">SEGURO</MenuItem>
                    <MenuItem value="ARMADO">ARMADO</MenuItem>
                    <MenuItem value="CARGA">CARGA</MenuItem>
                    <MenuItem value="ABORTO">ABORTO</MenuItem>
                  </Select>

                  <Typography sx={{ mt: 2, fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(148,163,184,0.75)" }}>
                    Mode
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={state.modo}
                    onChange={(e) => dispatch({ type: "SET_FIELD", key: "modo", value: e.target.value })}
                    sx={{
                      mt: 0.8,
                      bgcolor: "rgba(2,6,23,0.35)",
                      borderRadius: 2,
                      "& fieldset": { borderColor: "rgba(255,255,255,0.10)" },
                      color: "rgba(226,232,240,0.92)",
                    }}
                  >
                    <MenuItem value="TIERRA">TIERRA</MenuItem>
                    <MenuItem value="PRUEBA">PRUEBA</MenuItem>
                    <MenuItem value="CUENTA REGRESIVA">CUENTA REGRESIVA</MenuItem>
                  </Select>

                  <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={state.seguridad.llave_armado}
                        onChange={(e) => dispatch({ type: "SET_NESTED", key: "seguridad", value: { llave_armado: e.target.checked } })}
                      />
                    }
                    label={<Typography sx={{ fontSize: 12, fontWeight: 800, color: "rgba(226,232,240,0.88)" }}>Keyswitch Armed</Typography>}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={state.seguridad.zona_despejada}
                        onChange={(e) => dispatch({ type: "SET_NESTED", key: "seguridad", value: { zona_despejada: e.target.checked } })}
                      />
                    }
                    label={<Typography sx={{ fontSize: 12, fontWeight: 800, color: "rgba(226,232,240,0.88)" }}>Zona Despejada</Typography>}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={state.seguridad.paro_emergencia}
                        onChange={(e) => dispatch({ type: "SET_NESTED", key: "seguridad", value: { paro_emergencia: e.target.checked } })}
                      />
                    }
                    label={<Typography sx={{ fontSize: 12, fontWeight: 800, color: "rgba(226,232,240,0.88)" }}>Paro de Emergencia</Typography>}
                  />
                </CardContent>
              </Card>

              {/* Válvulas */}
              <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(10px)" }}>
                <CardContent sx={{ p: 2.2 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(148,163,184,0.8)", mb: 1.4 }}>
                    Valves (Mock)
                  </Typography>

                  {Object.keys(state.valvulas).map((k) => (
                    <Box key={k} sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
                      <Typography sx={{ flex: 1, fontSize: 11, color: "rgba(148,163,184,0.8)" }}>
                        {k}
                      </Typography>
                      <Select
                        size="small"
                        value={state.valvulas[k]}
                        onChange={(e) => dispatch({ type: "SET_VALVES", value: { [k]: e.target.value } })}
                        sx={{
                          minWidth: 135,
                          bgcolor: "rgba(2,6,23,0.35)",
                          borderRadius: 2,
                          "& fieldset": { borderColor: "rgba(255,255,255,0.10)" },
                          color: "rgba(226,232,240,0.92)",
                        }}
                      >
                        <MenuItem value="CERRADA">CERRADA</MenuItem>
                        <MenuItem value="ABIERTA">ABIERTA</MenuItem>
                        <MenuItem value="SIM">SIM</MenuItem>
                      </Select>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Sensores sliders */}
              <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(10px)" }}>
                <CardContent sx={{ p: 2.2 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(148,163,184,0.8)", mb: 1.6 }}>
                    Sensors (Sliders)
                  </Typography>

                  <Typography sx={{ fontSize: 10, color: "rgba(148,163,184,0.8)" }}>Tank Pressure (bar): {fmt(state.sensores.ptanque_bar)}</Typography>
                  <Slider
                    value={state.sensores.ptanque_bar}
                    min={0}
                    max={70}
                    step={0.1}
                    onChange={(_, v) => dispatch({ type: "SET_SENSORS", value: { ptanque_bar: v } })}
                  />

                  <Typography sx={{ fontSize: 10, color: "rgba(148,163,184,0.8)" }}>Line Pressure (bar): {fmt(state.sensores.plinea_bar)}</Typography>
                  <Slider
                    value={state.sensores.plinea_bar}
                    min={0}
                    max={70}
                    step={0.1}
                    onChange={(_, v) => dispatch({ type: "SET_SENSORS", value: { plinea_bar: v } })}
                  />

                  <Typography sx={{ fontSize: 10, color: "rgba(148,163,184,0.8)" }}>Chamber Pressure (bar): {fmt(state.sensores.pcamara_bar)}</Typography>
                  <Slider
                    value={state.sensores.pcamara_bar}
                    min={0}
                    max={5}
                    step={0.01}
                    onChange={(_, v) => dispatch({ type: "SET_SENSORS", value: { pcamara_bar: v } })}
                  />

                  <Typography sx={{ fontSize: 10, color: "rgba(148,163,184,0.8)" }}>Line Temp (°C): {fmt(state.sensores.temp_linea_c)}</Typography>
                  <Slider
                    value={state.sensores.temp_linea_c}
                    min={-10}
                    max={80}
                    step={0.1}
                    onChange={(_, v) => dispatch({ type: "SET_SENSORS", value: { temp_linea_c: v } })}
                  />
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Interlocks + Alarmas + Procedimiento (abajo, estilo SAFI) */}
          <Grid item xs={12}>
            <Grid container spacing={2.2}>
              <Grid item xs={12} lg={6}>
                <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(10px)" }}>
                  <CardContent sx={{ p: 2.2 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(148,163,184,0.8)", mb: 1.6 }}>
                      Safety Interlocks
                    </Typography>

                    <Stack spacing={1.1}>
                      {state.interbloqueos.map((i) => (
                        <InterlockItem key={i.id} ok={!!i.ok} text={i.texto} />
                      ))}
                    </Stack>

                    <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

                    <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(148,163,184,0.8)", mb: 1.2 }}>
                      Quick Toggle (Mock)
                    </Typography>

                    <Grid container spacing={1.2}>
                      {state.interbloqueos.map((i, idx) => (
                        <Grid item xs={12} md={6} key={i.id}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => {
                              const next = [...state.interbloqueos];
                              next[idx] = { ...next[idx], ok: !next[idx].ok };
                              dispatch({ type: "SET_INTERLOCKS", value: next });
                            }}
                            sx={{
                              borderColor: i.ok ? "rgba(16,185,129,0.35)" : "rgba(244,63,94,0.35)",
                              color: i.ok ? "rgba(52,211,153,0.95)" : "rgba(251,113,133,0.95)",
                              fontWeight: 900,
                              letterSpacing: "0.10em",
                              textTransform: "uppercase",
                              py: 1.2,
                              borderRadius: 2,
                            }}
                          >
                            {i.id}: {i.ok ? "OK" : "FAIL"}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={6}>
                <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(10px)" }}>
                  <CardContent sx={{ p: 2.2 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(148,163,184,0.8)", mb: 1.6 }}>
                      Alarm Log (Mock)
                    </Typography>

                    <Stack spacing={1.1} sx={{ maxHeight: 180, overflowY: "auto", pr: 0.5 }}>
                      {state.alarmas.map((a, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.1,
                            borderRadius: 1.8,
                            border: "1px solid",
                            borderColor: a.nivel === "ADVERTENCIA" ? "rgba(251,191,36,0.22)" : "rgba(59,130,246,0.22)",
                            bgcolor: a.nivel === "ADVERTENCIA" ? "rgba(251,191,36,0.08)" : "rgba(59,130,246,0.08)",
                            color: a.nivel === "ADVERTENCIA" ? "rgba(253,230,138,0.95)" : "rgba(191,219,254,0.95)",
                            fontSize: 12,
                          }}
                        >
                          <Box component="span" sx={{ fontWeight: 900, mr: 1 }}>
                            [{a.nivel}]
                          </Box>
                          {a.texto}
                        </Box>
                      ))}
                    </Stack>

                    <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

                    <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(148,163,184,0.8)", mb: 1.2 }}>
                      Add Alarm
                    </Typography>

                    <AlarmComposer
                      onAdd={(alarm) => dispatch({ type: "SET_ALARMS", value: [alarm, ...state.alarmas].slice(0, 50) })}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Comandos críticos (solo UI) + Progreso */}
          <Grid item xs={12}>
            <Grid container spacing={2.2}>
              <Grid item xs={12} lg={8}>
                <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(10px)" }}>
                  <CardContent sx={{ p: 2.2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(148,163,184,0.8)" }}>
                        Procedural Sequence
                      </Typography>
                      <Chip
                        size="small"
                        label={`Step ${state.procedimiento.paso} of ${state.procedimiento.total}`}
                        sx={{
                          fontWeight: 900,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          bgcolor: "rgba(30,41,59,0.9)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "rgba(34,211,238,0.9)",
                        }}
                      />
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={(state.procedimiento.paso / state.procedimiento.total) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 99,
                        bgcolor: "rgba(30,41,59,0.9)",
                        "& .MuiLinearProgress-bar": { borderRadius: 99, background: "rgba(34,211,238,0.95)" },
                      }}
                    />

                    <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

                    <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(148,163,184,0.8)", mb: 1 }}>
                      Notes
                    </Typography>

                    <Stack spacing={0.8}>
                      {state.procedimiento.notas.map((n, i) => (
                        <Typography key={i} sx={{ fontSize: 13, color: "rgba(226,232,240,0.92)" }}>
                          • {n}
                        </Typography>
                      ))}
                    </Stack>

                    <Box sx={{ display: "flex", gap: 1.2, mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => dispatch({ type: "SET_FIELD", key: "procedimiento", value: { ...state.procedimiento, paso: Math.max(1, state.procedimiento.paso - 1) } })}
                        sx={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(226,232,240,0.8)", fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase" }}
                      >
                        Step -
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => dispatch({ type: "SET_FIELD", key: "procedimiento", value: { ...state.procedimiento, paso: Math.min(state.procedimiento.total, state.procedimiento.paso + 1) } })}
                        sx={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(226,232,240,0.8)", fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase" }}
                      >
                        Step +
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(244,63,94,0.25)", bgcolor: "rgba(244,63,94,0.08)", backdropFilter: "blur(10px)" }}>
                  <CardContent sx={{ p: 2.2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.6 }}>
                      <Power size={14} color="rgba(251,113,133,0.95)" />
                      <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(251,113,133,0.95)" }}>
                        Critical Commands (UI)
                      </Typography>
                    </Box>

                    <Stack spacing={1.3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => dispatch({ type: "SET_FIELD", key: "estado", value: "ARMADO" })}
                        sx={{ py: 1.7, borderColor: "rgba(251,191,36,0.35)", color: "rgba(251,191,36,0.9)", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}
                      >
                        Arm System
                      </Button>

                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => dispatch({ type: "SET_SENSORS", value: { empuje_n: 1200 } })}
                        sx={{ py: 1.7, borderColor: "rgba(244,63,94,0.35)", color: "rgba(251,113,133,0.9)", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}
                      >
                        Initiate Hot Fire (Mock)
                      </Button>

                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => dispatch({ type: "SET_FIELD", key: "estado", value: "ABORTO" })}
                        sx={{
                          py: 2.0,
                          bgcolor: "rgba(225,29,72,0.95)",
                          "&:hover": { bgcolor: "rgba(190,18,60,0.95)" },
                          fontWeight: 900,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          borderRadius: 2.5,
                          boxShadow: "0 18px 50px rgba(225,29,72,0.25)",
                        }}
                      >
                        Emergency Abort
                      </Button>
                    </Stack>

                    <Typography sx={{ mt: 1.6, fontSize: 11, color: "rgba(148,163,184,0.75)" }}>
                      Esto solo modifica UI (no ejecuta comandos reales).
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Footer */}
          <Grid item xs={12}>
            <Box
              sx={{
                mt: 1,
                px: { xs: 2, md: 3 },
                py: 1.2,
                borderTop: "1px solid rgba(255,255,255,0.08)",
                bgcolor: "rgba(15,23,42,0.35)",
                borderRadius: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)" }}>
                Frontend Mock • System Latency: 42ms • <Box component="span" sx={{ color: "rgba(52,211,153,0.95)" }}>UI Connected</Box>
              </Typography>
              <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)" }}>
                © SAFI-UAEMéx HYBRID SYSTEMS UNIT
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

/**
 * Componente mini para agregar alarmas (frontend).
 */
function AlarmComposer({ onAdd }) {
  const [nivel, setNivel] = useState("INFO");
  const [texto, setTexto] = useState("");

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Select
        size="small"
        value={nivel}
        onChange={(e) => setNivel(e.target.value)}
        sx={{
          minWidth: 140,
          bgcolor: "rgba(2,6,23,0.35)",
          borderRadius: 2,
          "& fieldset": { borderColor: "rgba(255,255,255,0.10)" },
          color: "rgba(226,232,240,0.92)",
        }}
      >
        <MenuItem value="INFO">INFO</MenuItem>
        <MenuItem value="ADVERTENCIA">ADVERTENCIA</MenuItem>
        <MenuItem value="CRITICO">CRITICO</MenuItem>
      </Select>

      <TextField
        size="small"
        placeholder="Mensaje de alarma…"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        sx={{
          flex: 1,
          "& .MuiInputBase-root": { bgcolor: "rgba(2,6,23,0.35)", borderRadius: 2, color: "rgba(226,232,240,0.92)" },
          "& fieldset": { borderColor: "rgba(255,255,255,0.10)" },
        }}
      />

      <Button
        variant="contained"
        onClick={() => {
          if (!texto.trim()) return;
          onAdd({ nivel, texto: texto.trim() });
          setTexto("");
        }}
        sx={{
          bgcolor: "rgba(34,211,238,0.95)",
          color: "rgba(2,6,23,0.95)",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          borderRadius: 2,
          px: 2,
          "&:hover": { bgcolor: "rgba(34,211,238,0.85)" },
        }}
      >
        Add
      </Button>
    </Box>
  );
}
