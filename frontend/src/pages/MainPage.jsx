import React from "react";
import { Monitor, RocketLaunch, Speed } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Grid } from "@mui/material";

export default function MainPage() {
    const navigate = useNavigate();

    const buttons = [
        { label: "Banco de Pruebas", route: "/bancodepruebas", icon: <Speed /> },
        { label: "Live Telemetry (XITZIN-II)", route: "/line", icon: <RocketLaunch /> },
        { label: "Live View (XITZIN-II)", route: "/dashboard", icon: <RocketLaunch /> },
        { label: "Live Telemetry (XITZIN-II)", route: "/xitzin2data", icon: <RocketLaunch /> },
        { label: "Filamentadora", route: "/filamentadora", icon: <RocketLaunch /> },
        { label: "Filamentadora 2", route: "/filamentadora2", icon: <RocketLaunch /> },
        { label: "Filamentadora 3", route: "/filamentadora3", icon: <RocketLaunch /> },
        { label: "Laniakea", route: "/laniakea", icon: <RocketLaunch /> },
        { label: "Operaciones Híbridas", route: "/hybridoperations", icon: <Monitor /> },
    ];

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="center" alignItems="center" gap={2} mb={4}>
                <img src="src/assets/safi.png" alt="SAFILogo" style={{ width: "80px", height: "60px" }} />
                <Typography
                    variant="h2"
                    textAlign="center"
                    sx={{
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: "#ffffff",
                        textShadow: "3px 3px 6px rgba(0, 0, 0, 0.4)",
                    }}
                >
                    Dispositivos SAFI
                </Typography>
                <img src="src/assets/PotroRockets_PNG.png" alt="PotroRocketsLogo" style={{ width: "80px", height: "60px" }} />
            </Box>
            <Grid container spacing={4} justifyContent="center">
                {buttons.map((item, index) => ( // Cambié "items" por "buttons"
                    <Grid item key={index}>
                        <Button
                            startIcon={item.icon}
                            onClick={() => navigate(item.route)}
                            sx={{
                                mb: 2,
                                width: "300px",
                                height: "60px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontSize: "20px", // Increased font size
                                fontWeight: "bold",
                                borderRadius: "15px",
                                background: "linear-gradient(to right, #ff7e5f, #feb47b)", // Vibrant gradient
                                color: "white",
                                boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.3)", // Enhanced box shadow
                                transition: "transform 0.2s, background 0.2s", // Smooth transition
                                "&:hover": {
                                    background: "linear-gradient(to right, #feb47b, #ff7e5f)", // Hover gradient
                                    transform: "scale(1.05)", // Slightly enlarge on hover
                                },
                                "&:active": {
                                    transform: "scale(0.95)", // Slightly shrink on click
                                },
                            }}
                        >
                            {item.label}
                        </Button>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
