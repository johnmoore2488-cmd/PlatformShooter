import React, { useState, useEffect } from 'react';
import { NetworkService } from '../services/networkService';

interface LobbyProps {
  onJoin: (roomId: string) => void;
  onBack: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoin, onBack }) => {
  const [roomName, setRoomName] = useState('');
  const [availableRooms, setAvailableRooms] = useState<Set<string>>(new Set());

  // Scan for rooms on mount
  useEffect(() => {
    const cleanup = NetworkService.scan((foundRoomId) => {
      setAvailableRooms((prev) => {
        const newSet = new Set(prev);
        newSet.add(foundRoomId);
        return newSet;
      });
    });
    return cleanup;
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-2xl w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create Room Section */}
        <div className="flex flex-col space-y-6">
          <h2 className="text-2xl font-bold text-blue-400">Create / Join</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. battle-arena-1"
            />
          </div>

          <button
            onClick={() => { if(roomName) onJoin(roomName); }}
            disabled={!roomName}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition transform active:scale-95 shadow-lg shadow-blue-500/20"
          >
            START GAME
          </button>

          <p className="text-xs text-slate-500">
            Enter a unique name to start a new game or join a hidden one.
          </p>

          <button
            onClick={onBack}
            className="w-full text-slate-400 hover:text-white py-2 transition mt-auto"
          >
            Back to Menu
          </button>
        </div>

        {/* Room List Section */}
        <div className="flex flex-col border-l border-slate-700 pl-8 md:pl-8 space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-purple-400">Available Rooms</h2>
              <div className="animate-pulse w-2 h-2 rounded-full bg-green-500"></div>
           </div>
           
           <div className="flex-1 bg-slate-900/50 rounded-lg border border-slate-700 p-2 overflow-y-auto max-h-[300px]">
              {availableRooms.size === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm italic">
                  <span>Searching for battles...</span>
                  <span className="text-xs mt-2 opacity-50">(Requires another tab/window open)</span>
                </div>
              ) : (
                <ul className="space-y-2">
                  {[...availableRooms].map((room) => (
                    <li key={room}>
                      <button
                        onClick={() => onJoin(room)}
                        className="w-full text-left px-4 py-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-purple-500 transition group"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-slate-200 group-hover:text-white">{room}</span>
                          <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">ACTIVE</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
           </div>
           <p className="text-xs text-slate-500">
             Click a room to join instantly.
           </p>
        </div>

      </div>
    </div>
  );
};

export default Lobby;