// src/components/FilamentadoraSection.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Grid, Box, CircularProgress, Typography, Button, Stack,
  Slider, FormControl, FormLabel
} from '@mui/material';
import WindingConfigurator from './FilamentadoraConfigurator';
import WindingPreview2D from './Filamentadora2D';
import { computeWindingPath } from '../utils/winding';
import debounce from 'lodash/debounce';

export default function FilamentadoraSection() {
  const [cfgCm, setCfgCm] = useState({
    diameter: 12.7,
    length: 240,
    width: 0.25,
    angle: 75,
    rpm: 30,
    feed: 4,
    layers: 10,
  });
  const [path, setPath] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('stopped'); // running | paused | stopped
  const [zoom, setZoom] = useState(1);

  // Debounced compute
  const debouncedCompute = useMemo(() =>
    debounce(cfg => {
      setLoading(true);
      setTimeout(() => {
        const cfgMm = {
          diameter: cfg.diameter * 10,
          length: cfg.length * 10,
          width: cfg.width,
          angle: cfg.angle,
          rpm: cfg.rpm,
          feed: cfg.feed,
          layers: cfg.layers,
        };
        setPath(computeWindingPath(cfgMm));
        setLoading(false);
      }, 0);
    }, 200)
  , []);

  useEffect(() => {
    debouncedCompute(cfgCm);
    return () => debouncedCompute.cancel();
  }, [cfgCm, debouncedCompute]);

  const handleConfigChange = newCfg => {
    setCfgCm(newCfg);
  };

  const handleStart = () => setStatus('running');
  const handlePause = () => setStatus('paused');
  const handleStop = () => setStatus('stopped');

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Panel de Configuración y Zoom */}
        <Grid item xs={12} md={4}>
          <WindingConfigurator onConfigChange={handleConfigChange} />
          <Box mt={3}>
            <FormControl fullWidth>
              <FormLabel sx={{ color: '#61DAFB' }}>Zoom</FormLabel>
              <Slider
                value={zoom}
                min={0.5}
                max={3}
                step={0.1}
                valueLabelDisplay="auto"
                onChange={(_, v) => setZoom(v)}
                sx={{
                  color: '#61DAFB',
                  '& .MuiSlider-thumb': { backgroundColor: '#61DAFB' }
                }}
              />
            </FormControl>
          </Box>
        </Grid>

        {/* Panel de Controles y Preview */}
        <Grid item xs={12} md={8}>
          {/* Botonera */}
          <Stack direction="row" spacing={2} mb={2}>
            <Button
              variant="contained"
              color={status === 'running' ? 'success' : 'primary'}
              onClick={handleStart}
            >
              Iniciar
            </Button>
            <Button
              variant="contained"
              color={status === 'paused' ? 'warning' : 'primary'}
              onClick={handlePause}
            >
              Pausar
            </Button>
            <Button
              variant="contained"
              color={status === 'stopped' ? 'error' : 'primary'}
              onClick={handleStop}
            >
              Stop
            </Button>
            <Typography alignSelf="center" ml={2}>
              Estado: <strong>{status}</strong>
            </Typography>
          </Stack>

          {/* Preview */}
          <Box
            position="relative"
            sx={{ border: '1px solid #333', borderRadius: 1, height: 300 }}
          >
            {loading && (
              <Box
                position="absolute"
                inset={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bgcolor="rgba(0,0,0,0.5)"
                zIndex={10}
              >
                <CircularProgress color="inherit" />
                <Typography ml={2} color="white">
                  Cargando…
                </Typography>
              </Box>
            )}
            <WindingPreview2D
              path={path}
              tubeDiameter={cfgCm.diameter * 10}
              tubeLength={cfgCm.length * 10}
              zoom={zoom}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
