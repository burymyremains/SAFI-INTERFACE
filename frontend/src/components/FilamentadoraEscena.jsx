// src/components/WindingScene.jsx
import React from 'react';
//import { Canvas } from '@react-three/fiber';
//import { Line, OrbitControls } from '@react-three/drei';

export default function WindingScene({ path, diameter = 25, length = 200 }) {
  const radius = diameter / 2;
  // Convertir puntos a array de vectores [x,y,z]
  const points = path.map((p) => [p.x, p.z - length / 2, p.y]);

  return (
    <Canvas style={{ height: 300, marginTop: 16 }} camera={{ position: [0, length, diameter], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} />
      {/* Cilindro base */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderBufferGeometry args={[radius, radius, length, 32]} />
        <meshStandardMaterial color="#444" wireframe />
      </mesh>
      {/* Línea del patrón */}
      {points.length > 0 && <Line points={points} color="cyan" lineWidth={2} />}
      <OrbitControls />
    </Canvas>
  );
}  