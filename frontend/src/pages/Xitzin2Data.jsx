import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Grid, Typography, Card, CardContent, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Header from '../components/Header';
import throttle from 'lodash.throttle';
import { baseURL } from '../api/axios';

export default function Dashboard() {
    const [data, setData] = useState({
        date: [],
        time: [],
        altitude: [],
        temperature: [],
        pressure: [],
        velocity: [],
        latitude: [],
        longitude: [],
        accel_x: [],
        accel_y: [],
        accel_z: [],
        mission_state: [],
        air_brake_angle: []
    });
    const [coordinates, setCoordinates] = useState([0, 0]);
    const [batteryData, setBatteryData] = useState([]);
    const [isFetching, setIsFetching] = useState(false);

    const missionStates = ['Preflight', 'Lift-off', 'Air brakes', 'Apogee', 'Drogue', 'Main', 'Land'];

    const fetchData = async () => {
        if (isFetching) return;
        setIsFetching(true);

        try {
            const response = await axios.get(`${baseURL}/xitzin2data`);
            const batteryResponse = await axios.get(`${baseURL}/xitzin2batteries`);

            if (response.data && response.data.length > 0) {
                const newData = response.data.slice(-30);
                const date = newData.map(dataObj => dataObj.date);
                const time = newData.map(dataObj => dataObj.time);
                const altitude = newData.map(dataObj => dataObj.altitude);
                const temperature = newData.map(dataObj => dataObj.temperature);
                const pressure = newData.map(dataObj => dataObj.pressure);
                const velocity = newData.map(dataObj => dataObj.velocity);
                const latitude = newData.map(dataObj => dataObj.latitude);
                const longitude = newData.map(dataObj => dataObj.longitude);
                const accel_x = newData.map(dataObj => dataObj.accel_x);
                const accel_y = newData.map(dataObj => dataObj.accel_y);
                const accel_z = newData.map(dataObj => dataObj.accel_z);
                const mission_state = newData.map(dataObj => dataObj.mission_state);
                const air_brake_angle = newData.map(dataObj => dataObj.air_brake_angle);

                setData({
                    date, time, altitude, temperature, pressure, velocity,
                    latitude, longitude, accel_x, accel_y, accel_z, mission_state, air_brake_angle
                });

                setCoordinates([latitude[latitude.length - 1], longitude[longitude.length - 1]]);
            }

            if (batteryResponse.data && batteryResponse.data.length > 0) {
                setBatteryData(prevBatteryData => {
                    const updatedBatteryData = [...prevBatteryData];
                    batteryResponse.data.forEach(newBattery => {
                        const existingBatteryIndex = updatedBatteryData.findIndex(battery => battery.battery_id === newBattery.battery_id);
                        if (existingBatteryIndex !== -1) {
                            updatedBatteryData[existingBatteryIndex] = newBattery;
                        } else {
                            updatedBatteryData.push(newBattery);
                        }
                    });
                    return updatedBatteryData;
                });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }

        setIsFetching(false);
    };

    const throttledFetchData = throttle(fetchData, 100);

    useEffect(() => {
        throttledFetchData();
        const interval = setInterval(() => {
            throttledFetchData();
        }, 150);

        return () => clearInterval(interval);
    }, []);

    const MapUpdater = ({ coordinates }) => {
        const map = useMap();
        useEffect(() => {
            if (coordinates && coordinates[0] !== 0) {
                map.setView(coordinates, map.getZoom());
            }
        }, [coordinates, map]);
        return null;
    };

    const getMaxValue = (array) => array && array.length > 0 ? Math.max(...array) : 0;

    // === CONTEXTO SEGURO PARA GRÁFICAS (Sincronización de longitudes) ===
    const chartTime = data.time?.length ? data.time : ['00:00:00'];
    const chartAltitude = data.altitude?.length ? data.altitude : [0];
    const chartVelocity = data.velocity?.length ? data.velocity : [0];
    const chartPressure = data.pressure?.length ? data.pressure : [0];
    const chartTemperature = data.temperature?.length ? data.temperature : [0];

    return (
        <Box m="0px">
            <Header title="XITZIN-II LIVE TELEMETRY / POTROROCKETS SAFI-UAEMéx" />
            <Grid container spacing={2} alignItems="stretch">

                {/* COLUMNA 1: Datos numéricos y fases (xs = 2) */}
                <Grid item xs={2}>
                    <Card>
                        <CardContent>
                            {[
                                { label: 'Latitude', value: data.latitude?.length ? data.latitude[data.latitude.length - 1] : '0.0' },
                                { label: 'Longitude', value: data.longitude?.length ? data.longitude[data.longitude.length - 1] : '0.0' },
                                { label: 'Velocity (km/h)', value: data.velocity?.length ? data.velocity[data.velocity.length - 1] : '0.0' },
                                { label: 'Altitude (m)', value: data.altitude?.length ? data.altitude[data.altitude.length - 1] : '0.0' },
                                { label: 'Temperature(°C)', value: data.temperature?.length ? data.temperature[data.temperature.length - 1] : '0.0' },
                                { label: 'Pressure', value: data.pressure?.length ? data.pressure[data.pressure.length - 1] : '0.0' },
                                { label: 'CONOPS', value: data.mission_state?.length ? missionStates[data.mission_state[data.mission_state.length - 1]] : 'Preflight' },
                            ].map((item, index) => (
                                <Grid container key={index} spacing={1}>
                                    <Grid item xs={6}>
                                        <Typography variant="h5" align="left">{item.label}:</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="h4" align="right">{item.value ?? 'N/A'}</Typography>
                                    </Grid>
                                </Grid>
                            ))}
                        </CardContent>
                    </Card>
                    <Box mt={3}>
                        <TableContainer component={Paper} style={{ maxHeight: '500px', overflow: 'auto' }}>
                            <Table aria-label="mission state table" size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell style={{ width: '50%' }}>Phase</TableCell>
                                        <TableCell align="right" style={{ width: '50%' }}>State</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {missionStates.map((state, index) => {
                                        const currentStatus = data.mission_state?.length ? data.mission_state[data.mission_state.length - 1] : 0;
                                        const isActive = currentStatus === index;
                                        return (
                                            <TableRow key={state} style={{ backgroundColor: isActive ? '#e0f7fa' : 'white' }}>
                                                <TableCell component="th" scope="row" style={{ fontSize: '20px', color: '#333', padding: '8px' }}>
                                                    {state}
                                                </TableCell>
                                                <TableCell align="right" style={{ fontSize: '20px', color: isActive ? '#ff0000' : '#333', padding: '8px' }}>
                                                    {isActive ? 'Active' : 'Inactive'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Grid>

                {/* COLUMNA 2: Gráfica Altitud y Mapa */}
                <Grid item xs={2.5}>
                    <Box sx={{ backgroundColor: '#112240', p: 1, borderRadius: '8px', border: '1px solid #61DAFB' }}>
                        <LineChart
                            title='ALT'
                            width={340}
                            height={400}
                            series={[
                                { data: data.altitude?.length ? data.altitude : [0, 0], label: `Max Altitude: ${getMaxValue(data.altitude)} m`, color: '#61DAFB' },
                            ]}
                            xAxis={[{ scaleType: 'point', data: data.time?.length ? data.time : ['00:00', '00:01'] }]}
                            grid={{ vertical: false, horizontal: true }}
                        />
                    </Box>
                    <Box mt={2}>
                        {coordinates && !isNaN(coordinates[0]) && coordinates[0] !== 0 ? (
                            <MapContainer center={coordinates} zoom={16} style={{ height: "300px", width: "100%" }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={coordinates}><Popup>Coordenadas actuales</Popup></Marker>
                                <MapUpdater coordinates={coordinates} />
                            </MapContainer>
                        ) : (
                            <Box sx={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #61DAFB", borderRadius: "4px", backgroundColor: '#112240' }}>
                                <Typography variant="h5" color="#61DAFB">Esperando telemetría de Xitzin-II...</Typography>
                            </Box>
                        )}
                    </Box>
                </Grid>

                {/* COLUMNA 3: Gráficas Velocidad y Presión */}
                <Grid item xs={2.5}>
                    <Box sx={{ backgroundColor: '#112240', p: 1, borderRadius: '8px', border: '1px solid #61DAFB', mb: 2 }}>
                        <LineChart
                            title='VEL'
                            width={340}
                            height={350}
                            series={[
                                { data: data.velocity?.length ? data.velocity : [0, 0], label: `Max Velocity: ${getMaxValue(data.velocity)} km/h`, color: '#FE6B8B' },
                            ]}
                            xAxis={[{ scaleType: 'point', data: data.time?.length ? data.time : ['00:00', '00:01'] }]}
                            grid={{ vertical: false, horizontal: true }}
                        />
                    </Box>
                    <Box sx={{ backgroundColor: '#112240', p: 1, borderRadius: '8px', border: '1px solid #61DAFB' }}>
                        <LineChart
                            title='PRES'
                            width={340}
                            height={350}
                            series={[
                                { data: data.pressure?.length ? data.pressure : [0, 0], label: `Max Pressure: ${getMaxValue(data.pressure)} m`, color: '#FF8E53' },
                            ]}
                            xAxis={[{ scaleType: 'point', data: data.time?.length ? data.time : ['00:00', '00:01'] }]}
                            grid={{ vertical: false, horizontal: true }}
                        />
                    </Box>
                </Grid>

                {/* COLUMNA 4: Gráfica Temperatura */}
                <Grid item xs={2.5}>
                    <Box sx={{ backgroundColor: '#112240', p: 1, borderRadius: '8px', border: '1px solid #61DAFB' }}>
                        <LineChart
                            title='TEMP'
                            width={340}
                            height={400}
                            series={[
                                { data: data.temperature?.length ? data.temperature : [0, 0], label: `Max Temperature: ${getMaxValue(data.temperature)} °C`, color: '#4CAF50' },
                            ]}
                            xAxis={[{ scaleType: 'point', data: data.time?.length ? data.time : ['00:00', '00:01'] }]}
                            grid={{ vertical: false, horizontal: true }}
                        />
                    </Box>
                </Grid>

                {/* COLUMNA 5: Estado de Baterías (xs = 2.5) */}
                <Grid item xs={2.5}>
                    {batteryData.length > 0 ? (
                        batteryData.slice(0, 5).map((battery) => (
                            <Card key={battery.battery_id} style={{ marginBottom: '10px' }}>
                                <CardContent>
                                    <Typography variant="h4">Battery ID: {battery.battery_id}</Typography>
                                    <Typography variant="h4">Battery Level:</Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={battery.battery_level}
                                        sx={{ height: 30 }}
                                        color={battery.battery_level < 30 ? 'error' : 'success'}
                                    />
                                    <Typography variant="h5">Voltage: {battery.voltage} V</Typography>
                                    <Typography variant="h5">Temperature: {battery.temperature} °C</Typography>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Box sx={{ p: 2, border: "1px dashed #ccc", borderRadius: "4px", textAlign: "center" }}>
                            <Typography variant="h5" color="textSecondary">Sin datos de batería</Typography>
                        </Box>
                    )}
                </Grid>

            </Grid>
        </Box>
    );
}