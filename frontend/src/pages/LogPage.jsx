import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import { Link, Navigate } from "react-router-dom";
import { tokens } from "../../theme";
import { useData } from '../context/DataContext';
import Header from "../components/Header";

const DateSelectionPage = () => {
    const theme = useTheme();
    const { data, loadLogs } = useData();
    const colors = tokens(theme.palette.mode);
    const [selectedRows, setSelectedRows] = React.useState([]);
    
    useEffect(() => {
        loadLogs();
    }, []);

    // Definir función para obtener el identificador único de cada fila
    const getRowId = (row) => {
        return row.date; // Utiliza la propiedad 'date' de cada fila como identificador único
    };

    const columns = [
        { field: "log_id", headerName: "ID" },
        { field: "user_id", headerName: "ID Usuario" },
        { field: "username", headerName: "Usuario" },
        { field: "fecha", headerName: "Time" },
    ];

    return (
        <Box m="20px">
            <Header title="Logs de usuarios" />
            <Box m="10px">
            </Box>
            <Box
                m="30px 0 0 0"
                height="75vh"
                sx={{
                    "& .MuiDataGrid-root": { border: "none" },
                    "& .MuiDataGrid-cell": { borderBottom: "none" },
                    "& .name-column--cell": { color: colors.greenAccent[300] },
                    "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
                    "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
                    "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
                    "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
                }}
            >
                <DataGrid id="grid-two"
                    rows={data}
                    columns={columns}
                    getRowId={(row) => row.log_id}
                />
            </Box>
        </Box>
    );
}

export default DateSelectionPage;
