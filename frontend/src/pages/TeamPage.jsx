import React, { useState, useEffect } from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Link, Navigate } from "react-router-dom";
import { tokens } from "../../theme";
import Header from "../components/Header";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import { useUsers } from "../context/UserContext";

const Team = () => {
  const theme = useTheme();
  const { users, loadUsers, deleteUser, updateUser } = useUsers();
  const colors = tokens(theme.palette.mode);
  const [selectedRows, setSelectedRows] = React.useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEdit = () => {
    
    //console.log("selected rows:", selectedRows)
    if (selectedRows.length === 1) {
      //console.log("Cantidad: ", selectedRows.length)

    }
    Navigate(`/users/${selectedRows[0].id}/edit`)
    updateUser(selectedRows[0].id, selectedRows[0].username);
    console.log(selectedRows[0].id, selectedRows[0].username)
  };

  const handleDelete = () => {
    // Logic for deleting selected user(s)
    selectedRows.forEach((row) => deleteUser(row.id));
    console.log("Delete selected user(s)", selectedRows);
    setSelectedRows([]);
  };



  const columns = [
    { field: "id", headerName: "ID" },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "created_at", headerName: "Created At", flex: 1 },
    { field: "updated_at", headerName: "Updated At", flex: 1 },
    {
      field: "level",
      headerName: "Level",
      flex: 1,
      renderCell: ({ value }) => {
        const levelText = value === 2 ? "Admin" : "Guardia";
        const icon = value === 2 ? <AdminPanelSettingsOutlinedIcon /> : <SecurityOutlinedIcon />;
        return (
          <Box
            width="60%"
            m="0 auto"
            p="5px"
            display="flex"
            justifyContent="center"
            backgroundColor={value === 1 ? colors.greenAccent[600] : colors.greenAccent[700]}
            borderRadius="4px"
          >
            {icon}
            <Typography color={colors.grey[100]} sx={{ ml: "5px" }}>
              {levelText}
            </Typography>
          </Box>
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Header title="Usuarios" subtitle="Lista de usuarios" />
      <Button className="gap-x-1" variant="contained" color="secondary"  component={Link} to="/signup">
        Añadir
      </Button>
      <Button variant="contained" color="secondary" onClick={handleDelete}>
        Eliminar
      </Button>
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
        <DataGrid
          checkboxSelection
          rows={users}
          columns={columns}
          onRowSelectionModelChange={(ids) => {
            const selectedIDs = new Set(ids);
            const selectedRowData = users.filter((row) =>
              selectedIDs.has(row.id)
            )
            setSelectedRows(selectedRowData)
          }}
          {...users}
        />
        
        
      </Box>
    </Box>
  );
};

export default Team;