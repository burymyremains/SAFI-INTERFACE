import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Box, Grid, Typography, Card, CardContent, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as d3 from 'd3';
import Header from '../components/Header';
import throttle from 'lodash.throttle';
import { SOCKET_URL } from '../api/socketConfig';
import useWebsocket from '../api/useWebsocket';
import { baseURL } from '../api/axios';
import { styled } from '@mui/system';

// Styled components for SpaceX theme (copiados de LaunchDashboard)
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

  const missionStates = ['Preflight', 'Lift-off', 'Apogee', 'Drogue', 'Main', 'Land'];

  // Refs to hold the SVG containers for D3.js
  const altitudeRef = useRef();
  const velocityRef = useRef();
  const pressureRef = useRef();
  const temperatureRef = useRef();

  const rawData = useWebsocket('nuevos-datos', SOCKET_URL);

  useEffect(() => {
    if (!rawData.length) return;

    const date = rawData.map(d => d.date);
    const time = rawData.map(d => d.time);
    const altitude = rawData.map(d => parseFloat(d.altitude) || 0);
    const temperature = rawData.map(d => parseFloat(d.temperature) || 0);
    const pressure = rawData.map(d => parseFloat(d.pressure) || 0);
    const velocity = rawData.map(d => parseFloat(d.velocity) || 0);
    const latitude = rawData.map(d => parseFloat(d.latitude) || 0);
    const longitude = rawData.map(d => parseFloat(d.longitude) || 0);
    const accel_x = rawData.map(d => parseFloat(d.accel_x) || 0);
    const accel_y = rawData.map(d => parseFloat(d.accel_y) || 0);
    const accel_z = rawData.map(d => parseFloat(d.accel_z) || 0);
    const mission_state = rawData.map(d => parseInt(d.mission_state, 10) || 0);
    const air_brake_angle = rawData.map(d => parseFloat(d.air_brake_angle) || 0);

    setData({
      date, time, altitude, temperature,
      pressure, velocity, latitude, longitude,
      accel_x, accel_y, accel_z, mission_state,
      air_brake_angle,
    });

    const latestLat = latitude[0] || 0;
    const latestLon = longitude[0] || 0;

    setCoordinates([
      latestLat,
      latestLon
    ]);
  }, [rawData]);


  const rawBattery = useWebsocket('baterias', SOCKET_URL);

  useEffect(() => {
    if (!rawBattery || rawBattery.length === 0) return;

    setBatteryData(prevBatteryData => {
      const updatedBatteryData = [...prevBatteryData];

      rawBattery.forEach(newBattery => {
        const existingBatteryIndex = updatedBatteryData.findIndex(battery => battery.battery_id === newBattery.battery_id);
        if (existingBatteryIndex !== -1) {
          updatedBatteryData[existingBatteryIndex] = newBattery;
        } else {
          updatedBatteryData.push(newBattery);
        }
      });

      return updatedBatteryData;
    });
  }, [rawBattery]);

  useEffect(() => {
    createLineChart(altitudeRef.current, data.time, data.altitude, 'Altitude (m)');
    createLineChart(velocityRef.current, data.time, data.velocity, 'Velocity (km/h)');
    createLineChart(pressureRef.current, data.time, data.pressure, 'Pressure (Pa)');
    createLineChart(temperatureRef.current, data.time, data.temperature, 'Temperature (°C)');
  }, [data]);

  const createLineChart = (container, xData, yData, label) => {
    d3.select(container).selectAll('*').remove();

    const margin = { top: 35, right: 5, bottom: 18, left: 40 };
    const width = 400 - margin.left - margin.right; // Ajustado para que las gráficas encajen mejor
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

    const y = d3.scaleLinear()
      .domain([0, d3.max(yData)])
      .range([height, 0]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(4));

    svg.append('g')
      .call(d3.axisLeft(y));

    svg.append('path')
      .datum(yData)
      .attr('fill', 'none')
      .attr('stroke', '#61DAFB') // Color consistente con el tema SpaceX
      .attr('stroke-width', 3)
      .attr('d', d3.line()
        .x((d, i) => x(i))
        .y(d => y(d))
      );

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '26px')
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

  return (
    <SpaceXContainer>
      <Header
        title="XITZIN-II LIVE TELEMETRY / POTROROCKETS SAFI-UAEMéx"
        style={{ backgroundColor: '#0A192F', color: '#61DAFB', padding: '15px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}
      />
      <Grid container spacing={2} alignItems="stretch">
        {/* Columna Izquierda */}
        <Grid item xs={12} sm={6} md={3}>
          <SpaceXCard style={{ marginTop: '0px' }}>
            <SpaceXTitle variant="h6">Current Location</SpaceXTitle>
            <Box style={{ height: "250px", width: "100%" }}>
              <MapContainer center={coordinates} zoom={22} style={{ height: "100%", width: "100%" }}>
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
                        <Typography variant="h6" sx={{ fontSize: '16px', color: '#61DAFB' }}>Battery ID: {battery.battery_id}</Typography>
                        <Typography variant="h6" sx={{ fontSize: '14px' }}>Battery Level:</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={battery.battery_level}
                          sx={{ height: 20, backgroundColor: '#1E3A8A', '& .MuiLinearProgress-bar': { backgroundColor: battery.battery_level < 50 ? '#FF6B8B' : '#61DAFB' } }}
                        />
                        <Typography variant="h6" sx={{ fontSize: '14px' }}>Voltage: {battery.voltage} V</Typography>
                        <Typography variant="h6" sx={{ fontSize: '14px' }}>Temperature: {battery.temperature} °C</Typography>
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
                <SpaceXTitle variant="h6">Velocity Chart</SpaceXTitle>
                <CardContent>
                  <div ref={velocityRef} style={{ width: '100%', height: '310px' }} />
                </CardContent>
              </SpaceXCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Pressure Chart</SpaceXTitle>
                <CardContent>
                  <div ref={pressureRef} style={{ width: '100%', height: '310px' }} />
                </CardContent>
              </SpaceXCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Temperature Chart</SpaceXTitle>
                <CardContent>
                  <div ref={temperatureRef} style={{ width: '100%', height: '310px' }} />
                </CardContent>
              </SpaceXCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Real-Time Data</SpaceXTitle>
                <CardContent>
                  {[
                    { label: 'Timestamp', value: `${data.date[data.date.length - 1]} ${data.time[data.time.length - 1]}` },
                    { label: 'Latitude', value: data.latitude[data.latitude.length - 1] },
                    { label: 'Longitude', value: data.longitude[data.longitude.length - 1] },
                    { label: 'Velocity (km/h)', value: data.velocity[data.velocity.length - 1] },
                    { label: 'Altitude (m)', value: data.altitude[data.altitude.length - 1] },
                    { label: 'Temperature(°C)', value: data.temperature[data.temperature.length - 1] },
                    { label: 'Pressure', value: data.pressure[data.pressure.length - 1] },
                    //{ label: 'Air brakes angle', value: data.air_brake_angle[data.air_brake_angle.length - 1] },
                    { label: 'CONOPS', value: data.mission_state[data.mission_state.length - 1] },
                  ].map((item, index) => (
                    <Grid container key={index} spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="h6" sx={{ fontSize: '24px' }}>{item.label}:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h5" sx={{ fontSize: '24px' }} align="right">{item.value || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  ))}
                </CardContent>
              </SpaceXCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Flight Phases</SpaceXTitle>
                <TableContainer component={Paper} style={{ maxHeight: '555px', overflow: 'auto' }}>
                  <Table aria-label="mission state table" size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '14px' }}>Phase</TableCell>
                        <TableCell align="right" sx={{ fontSize: '14px' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {missionStates.map((state, index) => (
                        <TableRow key={state} style={{ backgroundColor: data.mission_state[data.mission_state.length - 1] === index ? '#1E3A8A' : '#112240' }}>
                          <TableCell sx={{ fontSize: '24px', color: '#61DAFB', padding: '8px' }}>{state}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '24px', color: data.mission_state[data.mission_state.length - 1] === index ? '#61DAFB' : '#CBD6E3' }}>
                            {data.mission_state[data.mission_state.length - 1] === index ? 'Active' : 'Inactive'}
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