import { io } from 'socket.io-client';

// Connect to the backend server (adjust URL if needed)
const socket = io('http://localhost:3001', {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: false, // We'll connect manually in components
});

export default socket;