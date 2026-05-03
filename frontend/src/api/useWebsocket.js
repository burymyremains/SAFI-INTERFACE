import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function useWebsocket(eventName, serverUrl) {
  const [payload, setPayload] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(serverUrl);

    socketRef.current.on('connect', () => {
      console.log('Socket.IO conectado con id:', socketRef.current.id);
    });
    socketRef.current.on('connect_error', err => {
      console.error('Error al conectar Socket.IO:', err);
    });
    socketRef.current.on(eventName, data => {
      console.log(`useWebsocket recibió ${eventName}:`, data.length);
      setPayload(data);
    });

    return () => {
      socketRef.current.off(eventName);
      socketRef.current.disconnect();
    };
  }, [eventName, serverUrl]);

  return payload;
}
