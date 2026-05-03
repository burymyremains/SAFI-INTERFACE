// src/App.jsx
import React, { useState, useEffect } from 'react';
import ControlPanel from '../components/ControlPanel';
import PatternPreview3D from '../components/PatternPreview';
import WindingPreview2D from '../components/Filamentadora2D';
import { generateTrajectory } from '../utils/trajectory';
import { Box, Grid } from '@mui/material';

function App() {
  const [params, setParams] = useState({
    D: 25, L: 200, d: 0.25, θdeg: 75, rpm: 30, speed:4, N:10, res:200
  });
  const [trajectory, setTrajectory] = useState([]);
  const [status, setStatus] = useState('stopped');

  useEffect(() => {
    const pts = generateTrajectory(params);
    setTrajectory(pts);
  }, [params]);

  const handleStart = () => setStatus('running');
  const handlePause = () => setStatus('paused');
  const handleStop  = () => setStatus('stopped');

  return (
    <Box sx={{ p:2 }}>
      <Grid container spacing={2}>
        <Grid item>
          <ControlPanel
            params={params}
            setParams={setParams}
            onStart={handleStart}
            onPause={handlePause}
            onStop={handleStop}
            status={status}
          />
        </Grid>
        <Grid item xs>
          <Box sx={{ height:400 }}>
            <PatternPreview3D 
              trajectory={trajectory}
              D={params.D}
              L={params.L}
            />
          </Box>
        </Grid>
        <Grid item xs>
          <Box sx={{ height:200, background:'#0a1321', borderRadius:1, p:1 }}>
            <WindingPreview2D
              path={trajectory}
              tubeDiameter={params.D}
              tubeLength={params.L}
              zoom={1}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default App;
