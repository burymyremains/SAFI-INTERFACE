// Dashboard.jsx con SpaceX components

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Grid, Typography, Card, Button, useMediaQuery } from '@mui/material';
import { styled } from '@mui/system';
import * as d3 from 'd3';
import axios from 'axios';
import Header from '../components/Header';
import { baseURL } from '../api/axios';
import { SOCKET_URL } from '../api/socketConfig';
import useWebsocket from '../api/useWebsocket';

const SpaceXContainer = styled(Box)({ backgroundColor: '#0A192F', color: '#CBD6E3', minHeight: '100vh', padding: '20px' });
const SpaceXCard = styled(Card)({ backgroundColor: '#112240', color: '#CBD6E3', borderRadius: '8px', border: '1px solid #61DAFB', boxShadow: '0 4px 8px rgba(97, 218, 251, 0.1)', padding: '10px' });
const SpaceXTitle = styled(Typography)({ color: '#61DAFB', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #61DAFB' });
const SpaceXButton = styled(Button)({ background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)', color: 'white', padding: '10px 20px', width: '100%', '&:hover': { background: 'linear-gradient(45deg, #d84315 30%, #e65100 90%)' }});

const ChartComponent = React.forwardRef(({ data, label, color, createLineChart }, ref) => {
  useEffect(() => {
    if (ref.current && data.values?.length) {
      createLineChart(ref.current, data.time, data.values, label, color);
    }
  }, [data, label, color, ref, createLineChart]);
  return <div ref={ref}></div>;
});

export default function Dashboard() {
  const [data, setData] = useState({ date: [], time: [], fuerza: [], temperatura: [], presion: [] });
  const isMobile = useMediaQuery('(max-width:600px)');
  const forceRef = useRef();
  const temperatureRef = useRef();
  const pressureRef = useRef();

  const metricolors = { fuerza: '#61DAFB', temperatura: '#50C878', presion: '#FFB74D' };

  const handleIgnition = async () => {
    try {
      await axios.post(`${baseURL}/ignicion`, { command: "IGNICION" });
      console.log("Ignition command sent");
    } catch (error) {
      console.error("Error sending ignition command:", error);
    }
  };

  const rawData = useWebsocket('banco-datos', SOCKET_URL);
  useEffect(() => {
    if (!rawData.length) return;
    setData({
      date: rawData.map(d => d.date),
      time: rawData.map(d => d.time),
      fuerza: rawData.map(d => parseFloat(d.fuerza) || 0),
      temperatura: rawData.map(d => parseFloat(d.temperatura) || 0),
      presion: rawData.map(d => parseFloat(d.presion) || 0)
    });
  }, [rawData]);

  const createLineChart = useCallback((container, xData, yData, label, color) => {
    d3.select(container).selectAll('svg').remove();
    const margin = { top: 40, right: 10, bottom: 15, left: 40 };
    const width = isMobile ? 300 : 670 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    const svg = d3.select(container).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([yData.length - 1, 0]).range([0, width]);
    const y = d3.scaleLinear().domain([d3.max(yData), 0]).range([0, height]);
    svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).tickSize(3));
    svg.append('g').call(d3.axisLeft(y));
    svg.append('path')
      .datum(yData)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('d', d3.line().x((d, i) => x(i)).y(d => y(d)));
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .text(label);
  }, [isMobile]);

  return (
    <SpaceXContainer>
      <Header title="BANCO DE PRUEBAS / POTROROCKETS SAFI-UAEMéx" style={{ backgroundColor: '#0A192F', color: '#61DAFB', padding: '15px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <SpaceXCard>
            <SpaceXTitle variant="h4">Monitor de Parámetros</SpaceXTitle>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <SpaceXCard>
                  <ChartComponent data={{ time: data.time, values: data.fuerza }} label="Fuerza (Ns)" color={metricolors.fuerza} createLineChart={createLineChart} ref={forceRef} />
                </SpaceXCard>
              </Grid>
              <Grid item xs={12} sm={6}>
                <SpaceXCard>
                  <ChartComponent data={{ time: data.time, values: data.temperatura }} label="Temperatura (°C)" color={metricolors.temperatura} createLineChart={createLineChart} ref={temperatureRef} />
                </SpaceXCard>
              </Grid>
              <Grid item xs={12}>
                <SpaceXCard>
                  <ChartComponent data={{ time: data.time, values: data.presion }} label="Presión (Psi)" color={metricolors.presion} createLineChart={createLineChart} ref={pressureRef} />
                </SpaceXCard>
              </Grid>
            </Grid>
          </SpaceXCard>
        </Grid>
        <Grid item xs={12} md={3}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Datos en Tiempo Real</SpaceXTitle>
                {['fuerza', 'presion', 'temperatura'].map((metric, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ color: metricolors[metric] }}>{metric.toUpperCase()}:</Typography>
                    <Typography variant="h5">{data[metric]?.[0]?.toFixed(2) || 'N/A'}</Typography>
                  </Box>
                ))}
              </SpaceXCard>
            </Grid>
            <Grid item>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Máximos Registrados</SpaceXTitle>
                {['fuerza', 'presion', 'temperatura'].map((metric, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ color: metricolors[metric] }}>Máx {metric.toUpperCase()}:</Typography>
                    <Typography variant="h5">{Math.max(...data[metric]) || 'N/A'}</Typography>
                  </Box>
                ))}
              </SpaceXCard>
            </Grid>
            <Grid item>
              <SpaceXButton onClick={handleIgnition}>Ignición</SpaceXButton>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </SpaceXContainer>
  );
}
