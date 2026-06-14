import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
        auth: { token: localStorage.getItem('splitree_token') },
        transports: ['websocket'],
      });
    }
    socketRef.current = socketInstance;
    return () => {}; // singleton — don't disconnect on unmount
  }, []);

  return socketRef.current;
}
