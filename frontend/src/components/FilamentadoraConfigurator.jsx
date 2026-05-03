// src/components/WindingConfigurator.jsx
import React, { useState, useEffect } from 'react';
import { Box, Grid, TextField, Typography, Button, Stack } from '@mui/material';
import { styled } from '@mui/system';

const ConfigCard = styled(Box)({
  background: '#112240',
  padding: 16,
  borderRadius: 8,
  color: '#CBD6E3',
});

export default function WindingConfigurator({
  onConfigChange,
  onStart,
  onPause,
  onStop,
  status
}) {
  const [cfg, setCfg] = useState({
    diameter: 25,
    length: 200,
    width: 0.25,
    angle: 75,
    rpm: 30,
    feed: 4,
    layers: 10
  });

  // Avisamos al padre cada vez que cfg cambia
  useEffect(() => {
    onConfigChange(cfg);
  }, [cfg]);

  const handleField = (field) => (e) => {
    const val = parseFloat(e.target.value);
    setCfg(c => ({ ...c, [field]: isNaN(val) ? '' : val }));
  };

  return (
    <ConfigCard>
      <Typography variant="h6" gutterBottom color="#61DAFB">
        Configuración de Bobinado
      </Typography>

      <Grid container spacing={2}>
        {[
          { label: 'Diámetro (mm)', key: 'diameter' },
          { label: 'Longitud (mm)', key: 'length' },
          { label: 'Filamento Ø (mm)', key: 'width' },
          { label: 'Ángulo (°)', key: 'angle' },
          { label: 'RPM Mandril', key: 'rpm' },
          { label: 'Avance (mm/s)', key: 'feed' },
          { label: 'Capas', key: 'layers' },
        ].map(({ label, key }) => (
          <Grid item xs={6} key={key}>
            <TextField
              fullWidth
              variant="outlined"
              label={label}
              value={cfg[key]}
              onChange={handleField(key)}
              InputLabelProps={{ style: { color: '#61DAFB' } }}
              inputProps={{ style: { color: '#CBD6E3' } }}
            />
          </Grid>
        ))}
      </Grid>

      {/* Botonera de control */}
      <Stack direction="row" spacing={2} mt={3} justifyContent="center">
        <Button
          variant="contained"
          color={status === 'running' ? 'success' : 'primary'}
          onClick={onStart}
        >
          Iniciar
        </Button>
        <Button
          variant="contained"
          color={status === 'paused' ? 'warning' : 'primary'}
          onClick={onPause}
        >
          Pausar
        </Button>
        <Button
          variant="contained"
          color={status === 'stopped' ? 'error' : 'primary'}
          onClick={onStop}
        >
          Stop
        </Button>
      </Stack>

      <Box mt={1} textAlign="center">
        <Typography variant="body2" color="gray">
          Estado: <strong style={{ color: '#61DAFB' }}>{status}</strong>
        </Typography>
      </Box>
    </ConfigCard>
  );
}
