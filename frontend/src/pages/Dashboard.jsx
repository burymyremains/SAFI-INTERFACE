import React, { useState, useEffect, useRef } from 'react';
import { baseURL } from '../api/axios';
import useWebsocket from '../api/useWebsocket';
import { SOCKET_URL } from '../api/socketConfig';
import Header from '../components/Header';
import {
    Box,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Card,
    CardContent,
    Button
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as d3 from 'd3';
import VideoPlayer from '../pages/VideoPlayer';
import { styled } from '@mui/system';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

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
    borderBottom: '2px solid #61DAFB',
});

const SpaceXButton = styled(Button)({
    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    color: 'white',
    padding: '10px 20px',
    width: '100%',
    '&:hover': {
        background: 'linear-gradient(45deg, #d84315 30%, #e65100 90%)',
    },
});

const RocketModel = () => {
    const mountRef = useRef(null);
    const modelRef = useRef();
    const timeRef = useRef(0);

    useEffect(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true });

        renderer.setSize(300, 455);
        if (mountRef.current) {
            mountRef.current.appendChild(renderer.domElement);
        }

        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://unpkg.com/three@0.174.0/examples/jsm/libs/draco/');
        loader.setDRACOLoader(dracoLoader);

        loader.load(
            'src/assets/akbal/modeloansys.gltf',
            (gltf) => {
                modelRef.current = gltf.scene;
                scene.add(modelRef.current);
                modelRef.current.scale.set(7, 7, 7);
                const centerY = (-2.54034 + 0.6) / 2;
                modelRef.current.position.set(-4, -centerY * 8, -6);
            },
            undefined,
            (error) => console.error('Error loading 3D model:', error)
        );

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(10, 10, 10);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0x404040));

        camera.position.set(0, 0, 15);
        camera.lookAt(0, 0, 0);

        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            if (modelRef.current) {
                timeRef.current += 0.05;
                modelRef.current.rotation.x = Math.sin(timeRef.current * 0.06) * 0.2;
                modelRef.current.rotation.z = Math.cos(timeRef.current * 0.06) * 0.2;
            }
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={mountRef} style={{ width: '100%', height: '455px' }} />;
};

export default function LaunchDashboard() {
    const [data, setData] = useState({
        date: [], time: [], altitude: [], temperature: [],
        pressure: [], velocity: [], latitude: [], longitude: [],
        accel_x: [], accel_y: [], accel_z: [], mission_state: [],
        air_brake_angle: [],
    });
    const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=-LKTt2XGn3o');
    const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
    const [coordinates, setCoordinates] = useState([0, 0]);
    const [simulatedAltitude, setSimulatedAltitude] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const altitudeRef = useRef();

    const feedOptions = [
        { url: 'https://www.youtube.com/watch?v=-LKTt2XGn3o', type: 'video' },
        { url: 'https://www.youtube.com/watch?v=-LKTt2XGn3o', type: 'video' },
        { url: 'src/assets/standby.jpg', type: 'image' },
    ];

    const missionStates = ['Preflight', 'Lift-off', 'Apogee', 'Drogue', 'Main', 'Land'];

    const rawData = useWebsocket('nuevos-datos', SOCKET_URL);

    useEffect(() => {
        if (!rawData || !rawData.length) return;

        const date            = rawData.map(d => d.date);
        const time            = rawData.map(d => d.time);
        const altitude        = rawData.map(d => parseFloat(d.altitude) || 0);
        const temperature     = rawData.map(d => parseFloat(d.temperature) || 0);
        const pressure        = rawData.map(d => parseFloat(d.pressure) || 0);
        const velocity        = rawData.map(d => parseFloat(d.velocity) || 0);
        const latitude        = rawData.map(d => parseFloat(d.latitude) || 0);
        const longitude       = rawData.map(d => parseFloat(d.longitude) || 0);
        const accel_x         = rawData.map(d => parseFloat(d.accel_x) || 0);
        const accel_y         = rawData.map(d => parseFloat(d.accel_y) || 0);
        const accel_z         = rawData.map(d => parseFloat(d.accel_z) || 0);
        const mission_state   = rawData.map(d => parseInt(d.mission_state, 10) || 0);
        const air_brake_angle = rawData.map(d => parseFloat(d.air_brake_angle) || 0);

        setData({
            date, time, altitude, temperature,
            pressure, velocity, latitude, longitude,
            accel_x, accel_y, accel_z, mission_state,
            air_brake_angle,
        });

        const latestLat = latitude[latitude.length - 1] || 0;
        const latestLon = longitude[longitude.length - 1] || 0;

        if (latestLat !== 0 && latestLon !== 0) {
            setCoordinates([latestLat, latestLon]);
        }
    }, [rawData]);

    useEffect(() => {
        if (!isAnimating) return;

        const durationUp   = 20000;
        const pause        = 2000;
        const durationDown = 20000;
        const start        = Date.now();

        const iv = setInterval(() => {
            const elapsed = Date.now() - start;
            if (elapsed < durationUp) {
                setSimulatedAltitude(Math.floor((elapsed / durationUp) * 3000));
            } else if (elapsed < durationUp + pause) {
                setSimulatedAltitude(3000);
            } else if (elapsed < durationUp + pause + durationDown) {
                const prog = (elapsed - durationUp - pause) / durationDown;
                setSimulatedAltitude(Math.floor(3000 - prog * 3000));
            } else {
                setSimulatedAltitude(0);
                setIsAnimating(false);
                clearInterval(iv);
            }
        }, 100);

        return () => clearInterval(iv);
    }, [isAnimating]);

    useEffect(() => {
        const container = altitudeRef.current;
        if (!container) return;
        d3.select(container).selectAll('*').remove();

        const current = isAnimating ? simulatedAltitude : (data.altitude?.length ? data.altitude[data.altitude.length - 1] : 0);
        const range   = 100;
        const minA    = Math.max(0, current - range);
        const maxA    = current + range;
        const margin  = { top: 35, right: 60, bottom: 18, left: 10 };
        const width   = 200 - margin.left - margin.right;
        const height  = 400 - margin.top - margin.bottom;
        const y       = d3.scaleLinear().domain([minA, maxA]).range([height, 0]);

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const majorTicks = d3.range(Math.floor(minA / 10) * 10, maxA + 10, 10);
        svg.selectAll('.major-tick')
            .data(majorTicks)
            .enter()
            .append('line')
            .attr('x1', width - 20)
            .attr('x2', width)
            .attr('y1', d => y(d))
            .attr('y2', d => y(d))
            .attr('stroke', 'white')
            .attr('stroke-width', 2);

        svg.selectAll('.major-tick-label')
            .data(majorTicks)
            .enter()
            .append('text')
            .attr('x', width + 10)
            .attr('y', d => y(d) + 5)
            .text(d => d)
            .attr('fill', 'white')
            .attr('font-size', '14px')
            .attr('text-anchor', 'start');

        const minorTicks = d3.range(Math.ceil(minA / 2) * 2, maxA + 2, 2).filter(d => !majorTicks.includes(d));
        svg.selectAll('.minor-tick')
            .data(minorTicks)
            .enter()
            .append('line')
            .attr('x1', width - 10)
            .attr('x2', width)
            .attr('y1', d => y(d))
            .attr('y2', d => y(d))
            .attr('stroke', 'white')
            .attr('stroke-width', 1);

        const pointerY = y(current);
        svg.append('polygon')
            .attr('points', `${width - 30},${pointerY - 10} ${width},${pointerY} ${width - 30},${pointerY + 10}`)
            .attr('fill', '#61DAFB');

        svg.append('rect')
            .attr('x', 0)
            .attr('y', pointerY - 15)
            .attr('width', 60)
            .attr('height', 30)
            .attr('fill', '#112240')
            .attr('stroke', '#61DAFB')
            .attr('stroke-width', 1);

        svg.append('text')
            .attr('x', 30)
            .attr('y', pointerY + 5)
            .text(Math.round(current))
            .attr('fill', 'white')
            .attr('font-size', '16px')
            .attr('text-anchor', 'middle');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '26px')
            .attr('font-weight', 'bold')
            .attr('fill', 'white')
            .text('Altitude (m)');
    }, [simulatedAltitude, isAnimating, data.altitude]);

    const handleFeedChange = () => {
        const next = (currentFeedIndex + 1) % feedOptions.length;
        setCurrentFeedIndex(next);
    };

    useEffect(() => {
        setVideoUrl(feedOptions[currentFeedIndex].url);
    }, [currentFeedIndex]);

    const toggleAnimation = () => {
        setIsAnimating(prev => !prev);
        if (!isAnimating) setSimulatedAltitude(0);
    };

    const MapUpdater = ({ coordinates }) => {
        const map = useMap();
        useEffect(() => {
            if (coordinates && coordinates[0] !== 0) {
                map.setView(coordinates, map.getZoom());
            }
        }, [coordinates, map]);
        return null;
    };

    const currentStatusIndex = data.mission_state?.length ? data.mission_state[data.mission_state.length - 1] : 0;

    return (
        <SpaceXContainer>
            <Header
                title="XITZIN-II LIVE VIEW / POTROROCKETS SAFI-UAEMéx"
                style={{
                    backgroundColor: '#0A192F',
                    color: '#61DAFB',
                    padding: '15px',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold'
                }}
            />

            <Grid container spacing={2}>
                {/* LEFT COLUMN: Phases & Data */}
                <Grid item xs={12} md={2.2}>
                    <SpaceXCard>
                        <SpaceXTitle variant="h6">Flight Phases</SpaceXTitle>
                        <TableContainer component={Paper} style={{ maxHeight: 555, overflow: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Phase</TableCell>
                                        <TableCell align="right">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {missionStates.map((phase, i) => (
                                        <TableRow
                                            key={phase}
                                            sx={{
                                                backgroundColor: currentStatusIndex === i ? '#1E3A8A' : '#112240'
                                            }}
                                        >
                                            <TableCell>{phase}</TableCell>
                                            <TableCell align="right">
                                                {currentStatusIndex === i ? 'Active' : 'Inactive'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </SpaceXCard>

                    <SpaceXCard sx={{ mt: 2 }}>
                        <SpaceXTitle variant="h6">Real-Time Data</SpaceXTitle>
                        <CardContent>
                            {[
                                { label: 'Latitude', value: data.latitude?.length ? data.latitude[data.latitude.length - 1] : '0.0' },
                                { label: 'Longitude', value: data.longitude?.length ? data.longitude[data.longitude.length - 1] : '0.0' },
                                { label: 'Velocity (km/h)', value: data.velocity?.length ? data.velocity[data.velocity.length - 1] : '0.0' },
                                { label: 'Altitude (m)', value: data.altitude?.length ? data.altitude[data.altitude.length - 1] : '0.0' },
                                { label: 'Temperature(°C)', value: data.temperature?.length ? data.temperature[data.temperature.length - 1] : '0.0' },
                                { label: 'Pressure', value: data.pressure?.length ? data.pressure[data.pressure.length - 1] : '0.0' },
                                { label: 'CONOPS', value: data.mission_state?.length ? missionStates[currentStatusIndex] : 'Preflight' },
                            ].map((item, index) => (
                                <Grid container key={index} spacing={1}>
                                    <Grid item xs={6}>
                                        <Typography variant="h6" sx={{ fontSize: '24px' }}>{item.label}:</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="h5" sx={{ fontSize: '24px' }} align="right">{item.value ?? 'N/A'}</Typography>
                                    </Grid>
                                </Grid>
                            ))}
                        </CardContent>
                    </SpaceXCard>
                </Grid>

                {/* CENTER COLUMN: Live Feed */}
                <Grid item xs={12} md={6.8}>
                    <SpaceXCard>
                        <SpaceXTitle variant="h6">Live Feed</SpaceXTitle>
                        {feedOptions[currentFeedIndex].type === 'video' ? (
                            <VideoPlayer url={videoUrl} isPlaying />
                        ) : (
                            <img src={videoUrl} alt="Standby" style={{ width: '100%' }} />
                        )}
                        <Box mt={2}>
                            <SpaceXButton onClick={handleFeedChange}>Cambiar Feed</SpaceXButton>
                        </Box>
                    </SpaceXCard>
                </Grid>

                {/* RIGHT COLUMN: Chart, 3D, Map */}
                <Grid item xs={12} md={3}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <SpaceXCard>
                                <SpaceXTitle variant="h6">Altitude Chart</SpaceXTitle>
                                <CardContent>
                                    <div ref={altitudeRef} style={{ width: '100%', height: 400 }} />
                                    <Box mt={2}>
                                        <SpaceXButton onClick={toggleAnimation}>
                                            {isAnimating ? 'Detener Simulación' : 'Iniciar Simulación'}
                                        </SpaceXButton>
                                    </Box>
                                </CardContent>
                            </SpaceXCard>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <SpaceXCard>
                                <SpaceXTitle variant="h6">Rocket Orientation</SpaceXTitle>
                                <CardContent>
                                    <RocketModel />
                                </CardContent>
                            </SpaceXCard>
                        </Grid>
                        <Grid item xs={12}>
                            <SpaceXCard>
                                <SpaceXTitle variant="h6">Current Location</SpaceXTitle>
                                <Box sx={{ height: 300, width: '100%' }}>
                                    {coordinates && coordinates[0] !== 0 && !isNaN(coordinates[0]) ? (
                                        <MapContainer center={coordinates} zoom={16} style={{ height: '100%', width: '100%' }}>
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution="© OpenStreetMap"
                                            />
                                            <Marker position={coordinates}>
                                                <Popup>
                                                    {coordinates[0]}, {coordinates[1]}
                                                </Popup>
                                            </Marker>
                                            <MapUpdater coordinates={coordinates} />
                                        </MapContainer>
                                    ) : (
                                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#112240', border: '1px dashed #61DAFB', borderRadius: '4px' }}>
                                            <Typography variant="h5" color="#61DAFB">Esperando coordenadas de telemetría...</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </SpaceXCard>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </SpaceXContainer>
    );
}