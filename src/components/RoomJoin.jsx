// client/src/components/RoomJoin.jsx
import React, { useState } from 'react';
import socket from '../socket';

function RoomJoin({ setRoomId }) {
  const [inputRoomId, setInputRoomId] = useState('');

  const handleJoinRoom = () => {
    if (inputRoomId.trim()) {
      socket.connect(); // Connect to the server
      socket.emit('join-room', inputRoomId);
      setRoomId(inputRoomId);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9); // Generate a random room ID
    socket.connect();
    socket.emit('join-room', newRoomId);
    setRoomId(newRoomId);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl mb-4">Join or Create a Whiteboard Room</h1>
      <div className="flex space-x-4">
        <input
          type="text"
          value={inputRoomId}
          onChange={(e) => setInputRoomId(e.target.value)}
          placeholder="Enter Room ID"
          className="p-2 border rounded"
        />
        <button
          onClick={handleJoinRoom}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Join Room
        </button>
        <button
          onClick={handleCreateRoom}
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Create Room
        </button>
      </div>
    </div>
  );
}

export default RoomJoin;