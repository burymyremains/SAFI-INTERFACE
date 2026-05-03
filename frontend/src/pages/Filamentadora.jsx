// src/components/FilamentadoraControl.jsx
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Tooltip,
  CircularProgress,
  Box,
  Slider,
} from '@mui/material';
import { styled } from '@mui/system';
import Button from '@mui/material/Button';
import axios from 'axios';

const ControlCard = styled(Card)({
  backgroundColor: '#112240',
  color: '#CBD6E3',
  borderRadius: '8px',
  border: '1px solid #61DAFB',
  boxShadow: '0 4px 8px rgba(97, 218, 251, 0.1)',
  marginTop: '20px',
});

const ControlHeader = styled(Typography)({
  color: '#61DAFB',
  textTransform: 'uppercase',
  fontWeight: 'bold',
  textAlign: 'center',
  padding: '16px 0 8px',
  borderBottom: '2px solid #61DAFB',
});

const ControlButton = styled(Button)(({ theme }) => ({
  minWidth: 140,
  margin: theme.spacing(1),
  background: '#61DAFB',
  color: '#0A192F',
  '&:hover': {
    background: '#33BFFF',
  },
}));

const SliderLabel = styled(Typography)({
  color: '#CBD6E3',
  marginBottom: 4,
});

export default function FilamentadoraControl() {
  const [busy, setBusy] = useState(false);
  const [lastCmd, setLastCmd] = useState(null);

  // Estados de sliders
  const [rpm, setRpm] = useState(30);
  const [feedRate, setFeedRate] = useState(4);

  const sendCommand = async (command, payload = {}) => {
    setBusy(true);
    setLastCmd(command);
    try {
      await axios.post('http://localhost:3000/api/filamentadora', {
        command,
        ...payload
      });
    } catch (error) {
      console.error('Error al enviar comando:', error);
    } finally {
      setBusy(false);
    }
  };

  // Handlers de sliders
  const handleRpmChange = (_, value) => {
    setRpm(value);
  };
  const handleRpmCommitted = (_, value) => {
    sendCommand('SET_RPM', { value });
  };

  const handleFeedChange = (_, value) => {
    setFeedRate(value);
  };
  const handleFeedCommitted = (_, value) => {
    sendCommand('SET_FEED', { value });
  };

  return (
    <ControlCard>
      <ControlHeader variant="h6">
        Control de Filamentadora
      </ControlHeader>
      <CardContent>
        <Grid container spacing={4} justifyContent="center">

          {/* Botones de Giro y Cabezal */}
          <Grid item xs={12}>
            <Grid container justifyContent="center" spacing={2}>
              {[
                { cmd: 'START_ROT', label: 'Iniciar Giro' },
                { cmd: 'STOP_ROT', label: 'Detener Giro' },
                { cmd: 'MOVE_HEAD_FWD', label: 'Cabezal ⏩' },
                { cmd: 'MOVE_HEAD_BWD', label: 'Cabezal ⏪' },
              ].map(({ cmd, label }) => (
                <Grid key={cmd} item>
                  <Tooltip title={label} arrow>
                    <span>
                      <ControlButton
                        onClick={() => sendCommand(cmd)}
                        disabled={busy}
                        variant={lastCmd === cmd ? 'contained' : 'outlined'}
                      >
                        {busy && lastCmd === cmd
                          ? <CircularProgress size={20} color="inherit"/>
                          : label}
                      </ControlButton>
                    </span>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Slider de RPM */}
          <Grid item xs={12} md={6}>
            <SliderLabel>RPM    : <strong>{rpm}</strong></SliderLabel>
            <Slider
              value={rpm}
              min={0}
              max={100}
              step={1}
              onChange={handleRpmChange}
              onChangeCommitted={handleRpmCommitted}
              disabled={busy}
              valueLabelDisplay="auto"
              sx={{
                color: '#61DAFB',
                '& .MuiSlider-thumb': { backgroundColor: '#61DAFB' }
              }}
            />
          </Grid>

          {/* Slider de Velocidad de Cabezal */}
          <Grid item xs={12} md={6}>
            <SliderLabel>Avance Cabezal (mm/s): <strong>{feedRate}</strong></SliderLabel>
            <Slider
              value={feedRate}
              min={0}
              max={20}
              step={0.5}
              onChange={handleFeedChange}
              onChangeCommitted={handleFeedCommitted}
              disabled={busy}
              valueLabelDisplay="auto"
              sx={{
                color: '#61DAFB',
                '& .MuiSlider-thumb': { backgroundColor: '#61DAFB' }
              }}
            />
          </Grid>

          {/* Estado */}
          <Grid item xs={12}>
            <Box textAlign="center" mt={2}>
              <Typography variant="body2" color="gray">
                {busy
                  ? `Procesando comando: ${lastCmd}`
                  : 'Listo para recibir comandos'}
              </Typography>
            </Box>
          </Grid>

        </Grid>
      </CardContent>
    </ControlCard>
  );
}
