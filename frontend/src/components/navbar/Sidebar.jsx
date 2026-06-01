import React, { useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { useAuth } from "../../context/AuthContext";
import { tokens } from "../../../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { LogoutOutlined } from "@mui/icons-material";

const Item = ({ title, to, icon, selected, setSelected }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (
        <MenuItem
            active={selected === title}
            style={{
                color: colors.grey[100],
            }}
            onClick={() => setSelected(title)}
            icon={icon}
        >
            <Typography>{title}</Typography>
            <Link to={to} />
        </MenuItem>
    );
};

const Sidebar = () => {
    const theme = useTheme();
    const { user, signout, isAuth, isAdmin, isGuard } = useAuth();
    const colors = tokens(theme.palette.mode);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [selected, setSelected] = useState("Dashboard");

    return (
        <Box
            sx={{
                "& .pro-sidebar": {
                    position: "relative", // Permite fijar elementos al fondo del contenedor
                    height: "100vh",
                },
                "& .pro-sidebar-inner": {
                    background: `${colors.primary[400]} !important`,
                },
                "& .pro-icon-wrapper": {
                    backgroundColor: "transparent !important",
                },
                "& .pro-inner-item": {
                    padding: "5px 35px 5px 20px !important",
                },
                "& .pro-inner-item:hover": {
                    color: "#868dfb !important",
                },
                "& .pro-menu-item.active": {
                    color: "#6870fa !important",
                },
            }}
        >
            <ProSidebar collapsed={isCollapsed}>
                <Menu iconShape="square">
                    {/* LOGO Y BOTÓN DE COLAPSO */}
                    <MenuItem
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
                        style={{
                            margin: "10px 0 20px 0",
                            color: colors.grey[100],
                        }}
                    >
                        {!isCollapsed && (
                            <Box display="flex" justifyContent="space-between" alignItems="center" ml="15px">
                                <Typography variant="h3" color={colors.grey[100]}>
                                    SAFI
                                </Typography>
                                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                                    <MenuOutlinedIcon />
                                </IconButton>
                            </Box>
                        )}
                    </MenuItem>

                    {/* PERFIL DEL USUARIO ACTIVO */}
                    {!isCollapsed && isAuth && user && (
                        <Box mb="25px">
                            <Box textAlign="center">
                                <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" sx={{ m: "10px 0 0 0" }}>
                                    {user.username}
                                </Typography>
                                <Typography variant="h5" color="#4cceac">
                                    {isAdmin ? "Administrador" : "Operador"}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* CONTENEDOR DE RUTAS NAVEGABLES */}
                    <Box paddingLeft={isCollapsed ? undefined : "10%"} sx={{ mb: isAuth ? "70px" : "0px" }}>

                        {/* 🔴 VISTA PARA INVITADOS (NO LOGUEADOS) */}
                        {!isAuth && (
                            <Item
                                title="Log in"
                                to="/login"
                                icon={<PersonOutlinedIcon />} // Restaurado al icono original
                                selected={selected}
                                setSelected={setSelected}
                            />
                        )}

                        {/* 🟢 VISTA PARA ADMINISTRADORES (Nivel 2) */}
                        {isAdmin && (
                            <>
                                <Item title="Home" to="/main" icon={<HomeOutlinedIcon />} selected={selected} setSelected={setSelected} />

                                <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0 5px 20px" }}>
                                    Gestión del Sistema
                                </Typography>
                                <Item title="Administrar usuarios" to="/users" icon={<PeopleOutlinedIcon />} selected={selected} setSelected={setSelected} />
                                <Item title="Log usuarios" to="/userslog" icon={<ReceiptOutlinedIcon />} selected={selected} setSelected={setSelected} />
                                <Item title="Registrar nuevo usuario" to="/signup" icon={<PersonAddOutlinedIcon />} selected={selected} setSelected={setSelected} />

                                <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0 5px 20px" }}>
                                    Cuenta
                                </Typography>
                                <Item title="Mi Perfil" to="/profile" icon={<PersonOutlinedIcon />} selected={selected} setSelected={setSelected} />
                            </>
                        )}

                        {/* 🔵 VISTA PARA OPERADORES/GUARDIAS (Nivel 1) */}
                        {isGuard && (
                            <>
                                <Item title="Home" to="/main" icon={<HomeOutlinedIcon />} selected={selected} setSelected={setSelected} />
                                <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0 5px 20px" }}>
                                    Gráficos
                                </Typography>
                                <Item title="Line Chart" to="/line" icon={<TimelineOutlinedIcon />} selected={selected} setSelected={setSelected} />

                                <Typography variant="h6" color={colors.grey[300]} sx={{ m: "15px 0 5px 20px" }}>
                                    Cuenta
                                </Typography>
                                <Item title="Mi Perfil" to="/profile" icon={<PersonOutlinedIcon />} selected={selected} setSelected={setSelected} />
                            </>
                        )}
                    </Box>

                    {/* 🟠 BOTÓN DE CERRAR SESIÓN (Anclado al fondo absoluto de la barra de navegación) */}
                    {isAuth && (
                        <Box
                            sx={{
                                position: "absolute",
                                bottom: "20px",
                                left: 0,
                                width: "100%",
                                paddingLeft: isCollapsed ? "0px" : "10%",
                                boxSizing: "border-box"
                            }}
                        >
                            <MenuItem
                                onClick={signout}
                                icon={<LogoutOutlined />}
                                style={{
                                    color: "#ff4c4c"
                                }}
                            >
                                {!isCollapsed && <Typography>Cerrar Sesión</Typography>}
                            </MenuItem>
                        </Box>
                    )}

                </Menu>
            </ProSidebar>
        </Box>
    );
};

export default Sidebar;