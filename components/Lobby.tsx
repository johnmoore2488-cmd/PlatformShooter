import React, { useState } from 'react';

interface LobbyProps {
  onJoin: (roomId: string) => void;
  onBack: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoin, onBack }) => {
  const [roomName, setRoomName] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">PvP Lobby</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. battle-arena-1"
            />
            <p className="text-xs text-slate-500 mt-2">
              Share this exact room name with a friend. Open this app in another tab or browser window to simulate a second player.
            </p>
          </div>

          <button
            onClick={() => { if(roomName) onJoin(roomName); }}
            disabled={!roomName}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition transform active:scale-95"
          >
            ENTER ARENA
          </button>

          <button
            onClick={onBack}
            className="w-full text-slate-400 hover:text-white py-2 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
