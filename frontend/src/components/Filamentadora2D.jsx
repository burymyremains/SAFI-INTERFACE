// src/components/WindingPreview2D.jsx
import React, { useRef, useEffect, useState } from 'react';

export default function WindingPreview2D({ path, tubeDiameter, tubeLength, zoom=1 }) {
  const containerRef = useRef();
  const canvasRef = useRef();
  const [size, setSize] = useState({ width:0, height:200 });

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const w = Math.floor(entries[0].contentRect.width);
      setSize({ width:w, height:200 });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const { width, height } = size;
    const canvas = canvasRef.current;
    if (!canvas || width===0) return;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,width,height);

    // dibujar contorno
    ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
    ctx.strokeRect(0,0,width,height);

    if (!path.length) return;
    // normalización
    const maxZ = tubeLength;
    const minX = -tubeDiameter/2;
    const maxX = tubeDiameter/2;

    ctx.strokeStyle = '#61DAFB'; ctx.lineWidth = 1;
    ctx.beginPath();
    path.forEach((p,i) => {
      const rawX = (p.z + tubeLength/2)/maxZ * width;
      const rawY = height - ((p.x - minX)/(maxX-minX))*height;
      const nx = (rawX - width/2)*zoom + width/2;
      const ny = (rawY - height/2)*zoom + height/2;
      if (i===0) ctx.moveTo(nx,ny);
      else ctx.lineTo(nx,ny);
    });
    ctx.stroke();
  }, [path, size, tubeDiameter, tubeLength, zoom]);

  return (
    <div ref={containerRef} style={{ width:'100%', height:size.height }}>
      <canvas
        ref={canvasRef}
        style={{ width:'100%', height:`${size.height}px`, display:'block' }}
      />
    </div>
  );
}
