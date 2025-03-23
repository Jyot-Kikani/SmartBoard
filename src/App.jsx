import React, { useState } from 'react';
import RoomJoin from './components/RoomJoin';
import Whiteboard from './components/Whiteboard';

function App() {
  const [roomId, setRoomId] = useState(null);

  const handleJoinRoom = (id) => {
    setRoomId(id);
  };

  return (
    <div className="h-screen w-screen bg-gray-100">
      {roomId ? (
        <Whiteboard roomId={roomId} />
      ) : (
        <RoomJoin onJoin={handleJoinRoom} />
      )}
    </div>
  );
}

export default App;