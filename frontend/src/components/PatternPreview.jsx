// src/components/PatternPreview3D.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function PatternPreview3D({ trajectory, D, L }) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Escena y cámara
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width/height, 1, L*2);
    camera.position.set(0, 0, L);
    camera.up.set(0,0,1);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
    renderer.setSize(width, height);

    // Cilindro base
    const geoC = new THREE.CylinderGeometry(D/2, D/2, L, 64, 1, true);
    const matC = new THREE.MeshBasicMaterial({ color:0x222222, wireframe:true });
    const cyl = new THREE.Mesh(geoC, matC);
    cyl.rotation.x = Math.PI/2;
    scene.add(cyl);

    // Trayectoria
    const pts = trajectory.map(p => new THREE.Vector3(p.x, p.y, p.z));
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineBasicMaterial({ color:0x61dafb });
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0,0,0);
    controls.update();

    // Render loop
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Ajuste en resize
    const onResize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [trajectory, D, L]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width:'100%', height:'100%', display:'block' }}
    />
  );
}
