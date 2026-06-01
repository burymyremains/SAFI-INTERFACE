import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Grid,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as d3 from 'd3';
import Header from '../components/Header';
import { SOCKET_URL } from '../api/socketConfig';
import useWebsocket from '../api/useWebsocket';
import { styled } from '@mui/system';

// Estilos unificados basados en Misión SpaceX / Potrorockets
const MissionContainer = styled(Box)({
    backgroundColor: '#060B13',
    color: '#CBD6E3',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: 'monospace'
});

const MissionCard = styled(Card)({
    backgroundColor: '#0D1527',
    color: '#CBD6E3',
    borderRadius: '10px',
    border: '1px solid #1E293B',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
});

const MissionTitle = styled(Typography)({
    color: '#61DAFB',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    fontSize: '14px',
    letterSpacing: '1px',
    padding: '12px',
    borderBottom: '1px solid #1E293B',
});

const StatusBadge = styled(Box)(({ state }) => ({
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    backgroundColor: state === 'active' ? 'rgba(234, 179, 8, 0.15)' : state === 'done' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.1)',
    color: state === 'active' ? '#EAB308' : state === 'done' ? '#22C55E' : '#94A6B8',
    border: `1px solid ${state === 'active' ? '#EAB308' : state === 'done' ? '#22C55E' : '#334155'}`
}));

export default function AkbalDashboard() {
    const [data, setData] = useState({
        time: [], altitude: [], temperature: [], pressure: [],
        velocity: [], latitude: [], longitude: [], conops: []
    });
    const [coordinates, setCoordinates] = useState([19.95, -103.5]); // Coordenadas Sayula por defecto

    const missionStates = ['Preflight', 'Lift-off', 'Air brakes', 'Apogee', 'Drogue', 'Main', 'Land'];

    // Refs para las 4 gráficas en D3
    const altChartRef = useRef();
    const velChartRef = useRef();
    const presChartRef = useRef();
    const tempChartRef = useRef();

    // Escucha el canal de WS específico para la telemetría de Akbal-II
    const rawData = useWebsocket('akbal2-data', SOCKET_URL);

    useEffect(() => {
        if (!rawData || !rawData.length) return;

        const time = rawData.map(d => d.time || '00:00:00');
        const altitude = rawData.map(d => parseFloat(d.altitude) || 0);
        const temperature = rawData.map(d => parseFloat(d.temperature) || 0);
        const pressure = rawData.map(d => parseFloat(d.pressure) || 0);
        const velocity = rawData.map(d => parseFloat(d.velocity) || 0);
        const latitude = rawData.map(d => parseFloat(d.latitude) || 0);
        const longitude = rawData.map(d => parseFloat(d.longitude) || 0);
        const conops = rawData.map(d => d.conops || 'Preflight');

        setData({ time, altitude, temperature, pressure, velocity, latitude, longitude, conops });

        const lastIdx = latitude.length - 1;
        if (latitude[lastIdx] && longitude[lastIdx]) {
            setCoordinates([latitude[lastIdx], longitude[lastIdx]]);
        }
    }, [rawData]);

    // Renderizador de Gráficas en D3
    useEffect(() => {
        const safeTime = data.time?.length ? data.time : ['00:00', '00:01'];

        drawD3Chart(altChartRef.current, safeTime, data.altitude?.length ? data.altitude : [0, 0], '#F59E0B');
        drawD3Chart(velChartRef.current, safeTime, data.velocity?.length ? data.velocity : [0, 0], '#EF4444');
        drawD3Chart(presChartRef.current, safeTime, data.pressure?.length ? data.pressure : [0, 0], '#3B82F6');
        drawD3Chart(tempChartRef.current, safeTime, data.temperature?.length ? data.temperature : [0, 0], '#10B981');
    }, [data]);

    const drawD3Chart = (container, xData, yData, color) => {
        if (!container) return;
        d3.select(container).selectAll('*').remove();

        const margin = { top: 15, right: 15, bottom: 25, left: 45 };
        const width = container.clientWidth - margin.left - margin.right;
        const height = 220 - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().domain([0, yData.length - 1]).range([0, width]);
        const y = d3.scaleLinear().domain([d3.min(yData) * 0.9, d3.max(yData) * 1.1 || 1]).range([height, 0]);

        // Ejes con rejilla punteada sutil
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5).tickSize(4))
            .attr('color', '#334155');

        svg.append('g')
            .call(d3.axisLeft(y).ticks(5))
            .attr('color', '#334155');

        svg.append('path')
            .datum(yData)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('d', d3.line().x((d, i) => x(i)).y(d => y(d)));
    };

    const MapUpdater = ({ coordinates }) => {
        const map = useMap();
        useEffect(() => {
            if (coordinates[0] !== 0) map.setView(coordinates, map.getZoom());
        }, [coordinates, map]);
        return null;
    };

    const last = data.time.length - 1;
    const currentCONOPS = last >= 0 ? data.conops[last] : 'Preflight';
    const currentCONOPSIdx = missionStates.indexOf(currentCONOPS);

    return (
        <MissionContainer>
            <Header title="AKBAL-II AVIONICS & TELEMETRY HUB / SAFI-UAEMéx" />

            <Grid container spacing={2} alignItems="stretch">

                {/* COLUMNA IZQUIERDA: CONOPS y Datos Numéricos */}
                <Grid item xs={12} md={2.5}>
                    <MissionCard>
                        <MissionTitle>Flight Phases</MissionTitle>
                        <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                            <Table size="small">
                                <TableBody>
                                    {missionStates.map((phase, i) => {
                                        let state = 'waiting';
                                        if (i === currentCONOPSIdx) state = 'active';
                                        else if (i < currentCONOPSIdx) state = 'done';

                                        return (
                                            <TableRow key={phase} sx={{ borderBottom: '1px solid #1E293B' }}>
                                                <TableCell sx={{ color: '#CBD6E3', fontSize: '14px', border: 'none' }}>{phase}</TableCell>
                                                <TableCell align="right" sx={{ border: 'none' }}>
                                                    <StatusBadge state={state}>{state}</StatusBadge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </MissionCard>

                    <MissionCard sx={{ mt: 2 }}>
                        <MissionTitle>Real-Time Data</MissionTitle>
                        <CardContent sx={{ p: 2 }}>
                            {[
                                { label: 'Latitude', value: last >= 0 ? data.latitude[last].toFixed(6) : '0.000000', unit: '°N' },
                                { label: 'Longitude', value: last >= 0 ? data.longitude[last].toFixed(6) : '0.000000', unit: '°W' },
                                { label: 'Velocity', value: last >= 0 ? data.velocity[last].toFixed(1) : '0.0', unit: 'km/h' },
                                { label: 'Altitude', value: last >= 0 ? data.altitude[last].toFixed(1) : '0.0', unit: 'm' },
                                { label: 'Temperature', value: last >= 0 ? data.temperature[last].toFixed(1) : '0.0', unit: '°C' },
                                { label: 'Pressure', value: last >= 0 ? data.pressure[last].toFixed(0) : '0', unit: 'Pa' },
                            ].map((item, idx) => (
                                <Grid container key={idx} sx={{ mb: 1.5, borderBottom: '1px dashed #1E293B', pb: 0.5 }}>
                                    <Grid item xs={6}>
                                        <Typography sx={{ color: '#94A6B8', fontSize: '13px' }}>{item.label}:</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography sx={{ color: '#61DAFB', fontSize: '15px', fontWeight: 'bold' }} align="right">
                                            {item.value} <span style={{ fontSize: '11px', color: '#CBD6E3' }}>{item.unit}</span>
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ))}
                        </CardContent>
                    </MissionCard>
                </Grid>

                {/* COLUMNA CENTRAL: Matriz de 4 Gráficas Simétricas */}
                <Grid item xs={12} md={6.5}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <MissionCard>
                                <MissionTitle>Altitude Chart (m)</MissionTitle>
                                <div ref={altChartRef} style={{ width: '100%', padding: '10px' }} />
                            </MissionCard>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MissionCard>
                                <MissionTitle>Velocity Chart (km/h)</MissionTitle>
                                <div ref={velChartRef} style={{ width: '100%', padding: '10px' }} />
                            </MissionCard>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MissionCard>
                                <MissionTitle>Barometric Pressure (Pa)</MissionTitle>
                                <div ref={presChartRef} style={{ width: '100%', padding: '10px' }} />
                            </MissionCard>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <MissionCard>
                                <MissionTitle>External Temperature (°C)</MissionTitle>
                                <div ref={tempChartRef} style={{ width: '100%', padding: '10px' }} />
                            </MissionCard>
                        </Grid>
                    </Grid>
                </Grid>

                {/* COLUMNA DERECHA: Mapa y Estado GPS */}
                <Grid item xs={12} md={3}>
                    <MissionCard style={{ height: '100%' }}>
                        <MissionTitle>Recovery Location</MissionTitle>
                        <Box sx={{ p: 2, height: '300px' }}>
                            <MapContainer center={coordinates} zoom={15} style={{ height: '100%', width: '100%', borderRadius: '6px' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={coordinates}>
                                    <Popup>Akbal-II Tracker</Popup>
                                </Marker>
                                <MapUpdater coordinates={coordinates} />
                            </MapContainer>
                        </Box>
                        <CardContent>
                            <Box sx={{ p: 2, backgroundColor: 'rgba(97, 218, 251, 0.05)', borderRadius: '6px', border: '1px solid #1E293B', textAlign: 'center' }}>
                                <Typography sx={{ color: '#61DAFB', fontSize: '13px', mb: 0.5, fontWeight: 'bold' }}>
                                    GPS COORDINATES
                                </Typography>
                                <Typography sx={{ fontSize: '16px', letterSpacing: '0.5px' }}>
                                    {coordinates[0].toFixed(6)}° N<br />
                                    {coordinates[1].toFixed(6)}° W
                                </Typography>
                                <Typography sx={{ color: '#22C55E', fontSize: '12px', mt: 1, fontWeight: 'bold' }}>
                                    ● SEÑAL TELEMETRÍA ACTIVA
                                </Typography>
                            </Box>
                        </CardContent>
                    </MissionCard>
                </Grid>

            </Grid>
        </MissionContainer>
    );
}