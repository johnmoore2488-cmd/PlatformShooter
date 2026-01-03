import React, { useState } from 'react';
import { GameMode } from './types';
import { useGameEngine } from './hooks/useGameEngine';
import GameCanvas from './components/GameCanvas';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [gameOverResult, setGameOverResult] = useState<string | null>(null);

  const handleGameOver = (winner?: string) => {
    setGameOverResult(winner || 'Game Over');
  };

  const resetGame = () => {
    setMode(GameMode.MENU);
    setGameOverResult(null);
  };

  // The engine is always initialized but we only render canvas when active
  const engine = useGameEngine({
    mode: mode === GameMode.PVE ? mode : GameMode.MENU, // prevent running loop in menu effectively
    onGameOver: handleGameOver
  });

  if (gameOverResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black/90 text-white z-50 absolute inset-0">
         <h1 className="text-6xl font-black text-red-500 mb-4 tracking-tighter uppercase">Terminated</h1>
         <p className="text-2xl text-slate-300 mb-8">{gameOverResult}</p>
         <button 
           onClick={resetGame}
           className="px-8 py-3 bg-white text-black font-bold text-lg rounded hover:bg-slate-200 transition"
         >
           MAIN MENU
         </button>
      </div>
    );
  }

  if (mode === GameMode.MENU) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white overflow-hidden relative">
        {/* Background ambience */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-50"></div>
        
        <div className="z-10 text-center max-w-2xl px-4">
          <h1 className="text-7xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            NEON RIFT
          </h1>
          <p className="text-xl text-slate-400 mb-12 tracking-wide">
            Adaptive AI Warfare
          </p>

          <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
            <button
              onClick={() => setMode(GameMode.PVE)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg shadow-cyan-500/20 transition transform hover:-translate-y-1"
            >
              START GAME
              <span className="block text-xs font-normal opacity-70 mt-1">vs Gemini AI Director</span>
            </button>
          </div>
          
          <div className="mt-16 text-xs text-slate-600">
            <p>Controls: WASD to Move • Space to Jump • Mouse to Aim & Shoot</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden cursor-crosshair">
       <GameCanvas 
          gameState={engine.gameState} 
          canvasRef={engine.canvasRef}
          directorMessage={engine.directorMessage}
        />
       
       {/* Quit Button */}
       <button 
         onClick={resetGame}
         className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 hover:bg-white/20 text-white/50 hover:text-white px-4 py-1 rounded-full text-xs transition"
       >
         ABORT MISSION
       </button>
    </div>
  );
};

export default App;