// src/components/LogPanel.jsx
import React, { useState, useEffect } from 'react';
import { TextField } from '@mui/material';

export default function LogPanel() {
  const [logs, setLogs] = useState('');

  // Ejemplo de WebSocket para recibir logs desde backend
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8081');
    ws.onmessage = (e) => {
      setLogs(prev => prev + e.data + '\n');
    };
    return () => ws.close();
  }, []);

  return (
    <TextField
      multiline
      fullWidth
      minRows={8}
      value={logs}
      variant="outlined"
      InputProps={{ readOnly: true }}
    />
  );
}