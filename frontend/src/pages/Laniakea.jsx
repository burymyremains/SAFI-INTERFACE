import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  LinearProgress,
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
import throttle from 'lodash.throttle';
import { SOCKET_URL } from '../api/socketConfig';
import useWebsocket from '../api/useWebsocket';
import { baseURL } from '../api/axios';
import { styled } from '@mui/system';

// Styled components for SpaceX-like theme
const SpaceXContainer = styled(Box)({
  backgroundColor: '#0A192F',
  color: '#CBD6E3',
  minHeight: '100vh',
  padding: '20px',
});

const SpaceXCard = styled(Card)({
  backgroundColor: '#112240',
  color: '#CBD6E3',
  borderRadius: '8px',
  border: '1px solid #61DAFB',
  boxShadow: '0 4px 8px rgba(97, 218, 251, 0.1)',
});

const SpaceXTitle = styled(Typography)({
  color: '#61DAFB',
  textTransform: 'uppercase',
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: '1rem',
  paddingBottom: '0.5rem',
  borderBottom: '2px solid #61DAFB'
});

const SpaceXButton = styled(Button)({
  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
  color: 'white',
  padding: '10px 20px',
  width: '100%',
  '&:hover': {
    background: 'linear-gradient(45deg, #d84315 30%, #e65100 90%)',
  }
});

export default function Dashboard() {
  // Ahora los campos se alinean con datos_laniakea
  const [data, setData] = useState({
    date: [],
    time: [],
    latitud: [],
    longitud: [],
    altitud: [],
    aceleracion: [],
    accel_x: [],
    accel_y: [],
    accel_z: [],
    conops: [],
    voltaje: [],
    corriente: []
  });

  const [coordinates, setCoordinates] = useState([0, 0]);
  const [batteryData, setBatteryData] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  // Refs para D3
  const altitudeRef = useRef();
  const accelerationRef = useRef();
  const voltageRef = useRef();
  const currentRef = useRef();

  // WebSocket para datos de LANIAKEA (asegúrate que el backend emita este evento)
  const rawData = useWebsocket('laniakea', SOCKET_URL);

  useEffect(() => {
    if (!rawData || !rawData.length) return;

    const date = rawData.map(d => d.date);
    const time = rawData.map(d => d.time);

    const latitud = rawData.map(d => parseFloat(d.latitud) || 0);
    const longitud = rawData.map(d => parseFloat(d.longitud) || 0);
    const altitud = rawData.map(d => parseFloat(d.altitud) || 0);

    const aceleracion = rawData.map(d => parseFloat(d.aceleracion) || 0);
    const accel_x = rawData.map(d => parseFloat(d.accel_x) || 0);
    const accel_y = rawData.map(d => parseFloat(d.accel_y) || 0);
    const accel_z = rawData.map(d => parseFloat(d.accel_z) || 0);

    const conops = rawData.map(d => d.conops || '');
    const voltaje = rawData.map(d => parseFloat(d.voltaje) || 0);
    const corriente = rawData.map(d => parseFloat(d.corriente) || 0);

    setData({
      date,
      time,
      latitud,
      longitud,
      altitud,
      aceleracion,
      accel_x,
      accel_y,
      accel_z,
      conops,
      voltaje,
      corriente
    });

    const lastIndex = latitud.length - 1;
    const latestLat = lastIndex >= 0 ? latitud[lastIndex] : 0;
    const latestLon = lastIndex >= 0 ? longitud[lastIndex] : 0;

    setCoordinates([latestLat, latestLon]);
  }, [rawData]);

  // WebSocket para baterías (tal como lo tenías)
  const rawBattery = useWebsocket('baterias', SOCKET_URL);

  useEffect(() => {
    if (!rawBattery || rawBattery.length === 0) return;

    setBatteryData(prevBatteryData => {
      const updatedBatteryData = [...prevBatteryData];

      rawBattery.forEach(newBattery => {
        const existingBatteryIndex = updatedBatteryData.findIndex(
          battery => battery.battery_id === newBattery.battery_id
        );
        if (existingBatteryIndex !== -1) {
          updatedBatteryData[existingBatteryIndex] = newBattery;
        } else {
          updatedBatteryData.push(newBattery);
        }
      });

      return updatedBatteryData;
    });
  }, [rawBattery]);

  // Actualizar gráficas cuando cambien los datos
  useEffect(() => {
    createLineChart(altitudeRef.current, data.time, data.altitud, 'Altitude (m)');
    createLineChart(accelerationRef.current, data.time, data.aceleracion, 'Acceleration (m/s²)');
    createLineChart(voltageRef.current, data.time, data.voltaje, 'Voltage (V)');
    createLineChart(currentRef.current, data.time, data.corriente, 'Current (A)');
  }, [data]);

  const createLineChart = (container, xData, yData, label) => {
    if (!container || !yData || yData.length === 0) {
      d3.select(container).selectAll('*').remove();
      return;
    }

    d3.select(container).selectAll('*').remove();

    const margin = { top: 35, right: 5, bottom: 18, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, yData.length - 1])
      .range([0, width]);

    const maxY = d3.max(yData) || 0;

    const y = d3.scaleLinear()
      .domain([0, maxY === 0 ? 1 : maxY])
      .range([height, 0]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(4));

    svg.append('g')
      .call(d3.axisLeft(y));

    svg.append('path')
      .datum(yData)
      .attr('fill', 'none')
      .attr('stroke', '#61DAFB')
      .attr('stroke-width', 3)
      .attr('d', d3.line()
        .x((d, i) => x(i))
        .y(d => y(d))
      );

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .text(label);
  };

  const MapUpdater = ({ coordinates }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(coordinates, map.getZoom());
    }, [coordinates, map]);
    return null;
  };

  const lastIndex = data.time.length - 1;

  const lastDate = lastIndex >= 0 ? data.date[lastIndex] : '';
  const lastTime = lastIndex >= 0 ? data.time[lastIndex] : '';
  const lastLat = lastIndex >= 0 ? data.latitud[lastIndex] : '';
  const lastLon = lastIndex >= 0 ? data.longitud[lastIndex] : '';
  const lastAlt = lastIndex >= 0 ? data.altitud[lastIndex] : '';
  const lastAcc = lastIndex >= 0 ? data.aceleracion[lastIndex] : '';
  const lastVolt = lastIndex >= 0 ? data.voltaje[lastIndex] : '';
  const lastCurr = lastIndex >= 0 ? data.corriente[lastIndex] : '';
  const lastConops = lastIndex >= 0 ? data.conops[lastIndex] : '';
  const lastAx = lastIndex >= 0 ? data.accel_x[lastIndex] : '';
  const lastAy = lastIndex >= 0 ? data.accel_y[lastIndex] : '';
  const lastAz = lastIndex >= 0 ? data.accel_z[lastIndex] : '';

  return (
    <SpaceXContainer>
      <Header
        title="LANIAKEA LIVE TELEMETRY / POTROROCKETS SAFI-UAEMéx"
        style={{
          backgroundColor: '#0A192F',
          color: '#61DAFB',
          padding: '15px',
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: 'bold'
        }}
      />
      <Grid container spacing={2} alignItems="stretch">
        {/* Columna Izquierda */}
        <Grid item xs={12} sm={6} md={3}>
          <SpaceXCard style={{ marginTop: '0px' }}>
            <SpaceXTitle variant="h6">Current Location</SpaceXTitle>
            <Box style={{ height: '250px', width: '100%' }}>
              <MapContainer center={coordinates} zoom={22} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={coordinates}>
                  <Popup>
                    Current Coordinates: {coordinates[0]}, {coordinates[1]}
                  </Popup>
                </Marker>
                <MapUpdater coordinates={coordinates} />
              </MapContainer>
            </Box>
          </SpaceXCard>
          <Box mt={2}>
            <SpaceXCard>
              <SpaceXTitle variant="h6">Battery Status</SpaceXTitle>
              <CardContent>
                <Grid item xs={12}>
                  {batteryData.slice(0, 5).map((battery) => (
                    <SpaceXCard key={battery.battery_id} style={{ marginBottom: '10px' }}>
                      <CardContent>
                        <Typography
                          variant="h6"
                          sx={{ fontSize: '16px', color: '#61DAFB' }}
                        >
                          Battery ID: {battery.battery_id}
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: '14px' }}>
                          Battery Level:
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={battery.battery_level}
                          sx={{
                            height: 20,
                            backgroundColor: '#1E3A8A',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: battery.battery_level < 50 ? '#FF6B8B' : '#61DAFB'
                            }
                          }}
                        />
                        <Typography variant="h6" sx={{ fontSize: '14px' }}>
                          Voltage: {battery.voltage} V
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: '14px' }}>
                          Temperature: {battery.temperature} °C
                        </Typography>
                      </CardContent>
                    </SpaceXCard>
                  ))}
                </Grid>
              </CardContent>
            </SpaceXCard>
          </Box>
        </Grid>

        {/* Columna Derecha */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            {/* Gráficas */}
            <Grid item xs={12} sm={6} md={4}>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Altitude Chart</SpaceXTitle>
                <CardContent>
                  <div ref={altitudeRef} style={{ width: '100%', height: '310px' }} />
                </CardContent>
              </SpaceXCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Acceleration Chart</SpaceXTitle>
                <CardContent>
                  <div ref={accelerationRef} style={{ width: '100%', height: '310px' }} />
                </CardContent>
              </SpaceXCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Voltage Chart</SpaceXTitle>
                <CardContent>
                  <div ref={voltageRef} style={{ width: '100%', height: '310px' }} />
                </CardContent>
              </SpaceXCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Current Chart</SpaceXTitle>
                <CardContent>
                  <div ref={currentRef} style={{ width: '100%', height: '310px' }} />
                </CardContent>
              </SpaceXCard>
            </Grid>

            {/* Datos en tiempo real */}
            <Grid item xs={12} sm={6} md={4}>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Real-Time Data</SpaceXTitle>
                <CardContent>
                  {[
                    { label: 'Timestamp', value: `${lastDate || ''} ${lastTime || ''}` },
                    { label: 'Latitude', value: lastLat },
                    { label: 'Longitude', value: lastLon },
                    { label: 'Altitude (m)', value: lastAlt },
                    { label: 'Acceleration (m/s²)', value: lastAcc },
                    { label: 'Voltage (V)', value: lastVolt },
                    { label: 'Current (A)', value: lastCurr },
                    { label: 'CONOPS', value: lastConops || 'N/A' },
                  ].map((item, index) => (
                    <Grid container key={index} spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="h6" sx={{ fontSize: '18px' }}>
                          {item.label}:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h5" sx={{ fontSize: '18px' }} align="right">
                          {item.value !== undefined && item.value !== '' ? item.value : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  ))}
                </CardContent>
              </SpaceXCard>
            </Grid>

            {/* Vector de aceleración */}
            <Grid item xs={12} sm={6} md={4}>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Acceleration Vector</SpaceXTitle>
                <TableContainer component={Paper} style={{ maxHeight: '555px', overflow: 'auto' }}>
                  <Table aria-label="acceleration vector table" size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '14px' }}>Component</TableCell>
                        <TableCell align="right" sx={{ fontSize: '14px' }}>Value (m/s²)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { label: 'Accel X', value: lastAx },
                        { label: 'Accel Y', value: lastAy },
                        { label: 'Accel Z', value: lastAz },
                      ].map((row) => (
                        <TableRow key={row.label} style={{ backgroundColor: '#112240' }}>
                          <TableCell
                            sx={{ fontSize: '18px', color: '#61DAFB', padding: '8px' }}
                          >
                            {row.label}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontSize: '18px', color: '#CBD6E3' }}
                          >
                            {row.value !== undefined && row.value !== '' ? row.value : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </SpaceXCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </SpaceXContainer>
  );
}
