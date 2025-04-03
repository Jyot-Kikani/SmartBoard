import React, { useState } from 'react';
import RoomJoin from './components/RoomJoin';
import Whiteboard from './components/Whiteboard';

function App() {
  const [roomId, setRoomId] = useState(null);

  return (
    <div className="App">
      {roomId ? (
        <Whiteboard roomId={roomId} />
      ) : (
        <RoomJoin setRoomId={setRoomId} />
      )}
    </div>
  );
}

export default App;