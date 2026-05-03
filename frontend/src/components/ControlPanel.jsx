// src/components/ControlPanel.jsx
import React from 'react';
import { TextField, Button, Box, Typography, Slider } from '@mui/material';

export default function ControlPanel({ params, setParams, onStart, onPause, onStop, status }) {
  const handleChange = (key) => (e, v) => {
    const val = v !== undefined ? v : e.target.value;
    setParams(prev => ({ ...prev, [key]: parseFloat(val) }));
  };

  return (
    <Box sx={{ p:2, background: '#13233b', color: '#fff', borderRadius:1, width:300 }}>
      <Typography variant="h6" gutterBottom>Configuración de Bobinado</Typography>

      <TextField
        label="Diámetro (mm)" type="number"
        value={params.D} onChange={handleChange('D')}
        fullWidth margin="dense"
      />
      <TextField
        label="Longitud (mm)" type="number"
        value={params.L} onChange={handleChange('L')}
        fullWidth margin="dense"
      />
      <TextField
        label="Filamento Ø (mm)" type="number"
        value={params.d} onChange={handleChange('d')}
        fullWidth margin="dense"
      />
      <TextField
        label="Ángulo (°)" type="number"
        value={params.θdeg} onChange={handleChange('θdeg')}
        fullWidth margin="dense"
      />
      <TextField
        label="RPM Mandril" type="number"
        value={params.rpm} onChange={handleChange('rpm')}
        fullWidth margin="dense"
      />
      <TextField
        label="Avance (mm/s)" type="number"
        value={params.speed} onChange={handleChange('speed')}
        fullWidth margin="dense"
      />

      <Box sx={{ mt:2 }}>
        <Typography gutterBottom>Capas: {params.N}</Typography>
        <Slider
          min={1} max={5000} step={1}
          value={params.N}
          onChange={handleChange('N')}
        />
      </Box>

      <Box sx={{ mt:2 }}>
        <Typography gutterBottom>Resolución (pts/rev): {params.res}</Typography>
        <Slider
          min={10} max={500} step={10}
          value={params.res}
          onChange={handleChange('res')}
        />
      </Box>

      <Box sx={{ display:'flex', justifyContent:'space-between', mt:2 }}>
        <Button variant="contained" onClick={onStart}>INICIAR</Button>
        <Button variant="outlined" onClick={onPause}>PAUSAR</Button>
        <Button variant="contained" color="error" onClick={onStop}>STOP</Button>
      </Box>

      <Typography sx={{ mt:1 }}>Estado: {status}</Typography>
    </Box>
  );
}
