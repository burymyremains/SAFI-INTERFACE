
// src/components/LayerManager.jsx
import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Stack } from '@mui/material';

export default function LayerManager({ layers, setLayers }) {
  const columns = [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'type', headerName: 'Tipo', width: 100, editable: true },
    { field: 'angle', headerName: 'Ángulo (°)', width: 100, editable: true },
    { field: 'passes', headerName: 'Pasadas', width: 100, editable: true },
    { field: 'overlap', headerName: 'Solape (mm)', width: 100, editable: true }
  ];

  const addLayer = () => {
    const newId = layers.length ? Math.max(...layers.map(r => r.id)) + 1 : 1;
    setLayers([...layers, { id: newId, type: 'hoop', angle: 45, passes: 1, overlap: 0 }]);
  };

  const handleEdit = (params) => {
    const updated = layers.map(layer =>
      layer.id === params.id ? { ...layer, [params.field]: params.value } : layer
    );
    setLayers(updated);
  };

  return (
    <Stack spacing={1}>
      <Button variant="contained" color="primary" onClick={addLayer}>
        AÑADIR CAPA
      </Button>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={layers}
          columns={columns}
          editMode="cell"
          onCellEditCommit={handleEdit}
          hideFooter
        />
      </div>
      <Button variant="outlined" onClick={() => console.log(JSON.stringify(layers))}>
        Exportar JSON
      </Button>
    </Stack>
  );
}