import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Grid, Typography, Card, CardContent, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import ReactPlayer from 'react-player';
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
        setBatteryData(prevBatteryData => {
          const updatedBatteryData = [...prevBatteryData]; // Copia de los datos anteriores
  
          batteryResponse.data.forEach(newBattery => {
            const existingBatteryIndex = updatedBatteryData.findIndex(battery => battery.battery_id === newBattery.battery_id);
            if (existingBatteryIndex !== -1) {
              // Actualiza el registro existente
              updatedBatteryData[existingBatteryIndex] = newBattery;
            } else {
              // Agrega el nuevo registro
              updatedBatteryData.push(newBattery);
            }
          });
  
          return updatedBatteryData;
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }

      setIsFetching(false);
    };

      // Usar throttle para limitar las solicitudes a cada 5 segundos
      const throttledFetchData = throttle(fetchData, 100);
    
      useEffect(() => {
        // Llamada inicial
        throttledFetchData();
    
        // Elimina el uso de setInterval, solo llamamos throttledFetchData
        // en un intervalo controlado por throttle cada 5 segundos
    
        const interval = setInterval(() => {
          throttledFetchData();
        }, 150);
    
        // Limpia el intervalo cuando el componente se desmonta
        return () => {
          clearInterval(interval); // Elimina el intervalo al desmontar el componente
        };
      }, []);

  const MapUpdater = ({ coordinates }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(coordinates, map.getZoom());
    }, [coordinates, map]);
    return null;
  };

  const getMaxValue = (array) => array.length > 0 ? Math.max(...array) : 0;

  return (
    <Box m="0px">
      <Header title="XITZIN-II LIVE TELEMETRY / POTROROCKETS SAFI-UAEMéx" />
      <Grid container spacing={2} alignItems="stretch">
        <Grid item xs={1.9}>
          <Card>
            <CardContent>
              {[
                { label: 'Latitude', value: data.latitude[data.latitude.length - 1] },
                { label: 'Longitude', value: data.longitude[data.longitude.length - 1] },
                { label: 'Velocity (km/h)', value: data.velocity[data.velocity.length - 1] },
                { label: 'Altitude (m)', value: data.altitude[data.altitude.length - 1] },
                { label: 'Temperature(°C)', value: data.temperature[data.temperature.length - 1] },
                { label: 'Pressure', value: data.pressure[data.pressure.length - 1] },
                { label: 'CONOPS', value: data.mission_state[data.mission_state.length - 1] },
              ].map((item, index) => (
                <Grid container key={index} spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="h5" align="left">{item.label}:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4" align="right">{item.value}</Typography>
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
                  {missionStates.map((state, index) => (
                    <TableRow key={state} style={{
                      backgroundColor: data.mission_state[data.mission_state.length - 1] === index ? '#f0f0f0' : 'white'
                    }}>
                      <TableCell component="th" scope="row" style={{ fontSize: '20px', color: '#333', padding: '8px' }}>
                        {state}
                      </TableCell>
                      <TableCell align="right" style={{ fontSize: '20px', color: data.mission_state[data.mission_state.length - 1] === index ? '#ff0000' : '#333', padding: '8px' }}>
                        {data.mission_state[data.mission_state.length - 1] === index ? 'Active' : 'Inactive'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Grid>
        <Grid item xs={2.5}>
          <LineChart
            title='ALT'
            width={360}
            height={480}
            series={[
              { data: data.altitude, label: `Max Altitude: ${getMaxValue(data.altitude)} m`, style: { fontSize: '18px', fontWeight: 'bold' } },
            ]}
            xAxis={[{ scaleType: 'point', data: data.time, axisLabelStyles: { fontSize: 12 } }]}
            yAxis={[{ axisLabelStyles: { fontSize: 12 } }]}
            grid={{ vertical: false, horizontal: true }}
          />
          <Box mt={2}>
            <MapContainer center={coordinates} zoom={22} style={{ height: "300px", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={coordinates}>
                <Popup>
                  Coordenadas actuales: {coordinates[0]}, {coordinates[1]}
                </Popup>
              </Marker>
              <MapUpdater coordinates={coordinates} />
            </MapContainer>
          </Box>
        </Grid>
        <Grid item xs={2.5}>
          <LineChart
            title='VEL'
            width={360}
            height={420}
            series={[
              { data: data.velocity, label: `Max Velocity: ${getMaxValue(data.velocity)} km/h`, style: { fontSize: '18px', fontWeight: 'bold' } },
            ]}
            xAxis={[{ scaleType: 'point', data: data.time, axisLabelStyles: { fontSize: 12 } }]}
            yAxis={[{ axisLabelStyles: { fontSize: 12 } }]}
            grid={{ vertical: false, horizontal: true }}
          />
          <LineChart
            title='PRES'
            width={360}
            height={420}
            series={[
              { data: data.pressure, label: `Max Pressure: ${getMaxValue(data.pressure)} m`, style: { fontSize: '18px', fontWeight: 'bold' } },
            ]}
            xAxis={[{ scaleType: 'point', data: data.time, axisLabelStyles: { fontSize: 12 } }]}
            yAxis={[{ axisLabelStyles: { fontSize: 12 } }]}
            grid={{ vertical: false, horizontal: true }}
          />
        </Grid>
        <Grid item xs={2.5}>
          <LineChart
            title='TEMP'
            width={360}
            height={420}
            series={[
              { data: data.temperature, label: `Max Temperature: ${getMaxValue(data.temperature)} °C`, style: { fontSize: '18px', fontWeight: 'bold' } },
            ]}
            xAxis={[{ scaleType: 'point', data: data.time, axisLabelStyles: { fontSize: 12 } }]}
            yAxis={[{ axisLabelStyles: { fontSize: 12 } }]}
            grid={{ vertical: false, horizontal: true }}
          />
        </Grid>
        <Grid item xs={2.5}>
          {batteryData.slice(0, 5).map((battery) => (
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
          ))}
        </Grid>
      </Grid>
    </Box>
  );
}
