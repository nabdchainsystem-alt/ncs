import React, { useState, useEffect, useRef } from 'react';
import { BalootGame, GameState, Card, PlayerId } from './engine/BalootGame';
import { ArrowLeft, RefreshCw, Trophy, Settings, Volume2, User as UserIcon } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- Assets & Styles ---
const WOOD_TEXTURE = "https://www.transparenttextures.com/patterns/wood-pattern.png";
const FELT_TEXTURE = "https://www.transparenttextures.com/patterns/felt.png";
const CARPET_PATTERN = "https://www.transparenttextures.com/patterns/arabesque.png"; // Placeholder for a carpet pattern

const CardComponent: React.FC<{
  card: Card;
  isHidden?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  index?: number; // For stagger effect
}> = ({ card, isHidden, isPlayable, onClick, index = 0 }) => {
  const isRed = card.suit === 'H' || card.suit === 'D';

  const SuitIcon = ({ className }: { className?: string }) => {
    switch (card.suit) {
      case 'H': return <span className={`text-red-600 ${className}`}>♥</span>;
      case 'D': return <span className={`text-red-600 ${className}`}>♦</span>;
      case 'C': return <span className={`text-slate-900 ${className}`}>♣</span>;
      case 'S': return <span className={`text-slate-900 ${className}`}>♠</span>;
    }
  };

  return (
    <motion.div
      layoutId={`card-${card.id}`}
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.05 }}
      whileHover={onClick && isPlayable ? { y: -20, scale: 1.1, zIndex: 50 } : {}}
      whileTap={onClick && isPlayable ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={`
        relative w-20 h-32 rounded-xl shadow-2xl transform-gpu preserve-3d transition-shadow duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${isPlayable ? 'ring-2 ring-yellow-400/80 ring-offset-2 ring-offset-black/20 shadow-yellow-500/20' : ''}
`}
      style={{
        perspective: '1000px',
      }}
    >
      {isHidden ? (
        // Card Back
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
          <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="w-16 h-28 border-2 border-white/10 rounded-lg flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 opacity-20 blur-sm"></div>
          </div>
        </div>
      ) : (
        // Card Front
        <div className="absolute inset-0 bg-white rounded-xl flex flex-col justify-between p-2 shadow-inner border border-gray-200 overflow-hidden">
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>

          <div className="flex flex-col items-center self-start leading-none">
            <span className={`text-lg font-bold ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.rank}</span>
            <SuitIcon className="text-sm" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <SuitIcon className="text-6xl transform scale-150" />
          </div>

          <div className="flex flex-col items-center self-end leading-none rotate-180">
            <span className={`text-lg font-bold ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.rank}</span>
            <SuitIcon className="text-sm" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

const PlayerAvatar: React.FC<{
  player: { name: string; id: number };
  isTurn: boolean;
  position: 'bottom' | 'top' | 'left' | 'right';
  score?: number;
}> = ({ player, isTurn, position }) => {
  return (
    <motion.div
      animate={isTurn ? { scale: 1.05 } : { scale: 1 }}
      className={`
        flex flex-col items-center gap-2 p-3 rounded-2xl backdrop-blur-md border transition-all duration-300
        ${isTurn
          ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-400/50 shadow-[0_0_30px_rgba(251,191,36,0.2)]'
          : 'bg-black/40 border-white/10 shadow-lg'
        }
`}
    >
      <div className="relative">
        <div className={`
w-14 h-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-xl border-2 shadow-inner
          ${isTurn ? 'border-yellow-400' : 'border-white/20'}
`}>
          {player.name.charAt(0)}
        </div>
        {isTurn && (
          <motion.div
            className="absolute -inset-1 rounded-full border-2 border-yellow-400 border-dashed"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
      <div className="flex flex-col items-center">
        <span className={`text-sm font-bold ${isTurn ? 'text-yellow-400' : 'text-gray-200'}`}>
          {player.name}
        </span>
        {/* Optional: Show individual score or tricks if needed */}
      </div>
    </motion.div>
  );
};

const BalootPage: React.FC = () => {
  const { setActivePage } = useNavigation();
  const gameRef = useRef<BalootGame>(new BalootGame());
  const [gameState, setGameState] = useState<GameState>(gameRef.current.state);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    gameRef.current.startNewRound();
    updateState();
  }, []);

  useEffect(() => {
    if (gameState.phase === 'PLAYING' && gameState.currentTurn !== 0) {
      const timer = setTimeout(() => {
        const botId = gameState.currentTurn;
        const botHand = gameState.players[botId].hand;
        for (const card of botHand) {
          if (gameRef.current.isValidMove(botId, card)) {
            gameRef.current.playCard(botId, card.id);
            updateState();
            break;
          }
        }
      }, 1200); // Slightly slower for better pacing
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.phase, lastUpdate]);

  const updateState = () => {
    setGameState({ ...gameRef.current.state });
    setLastUpdate(Date.now());
  };

  const handleCardClick = (card: Card) => {
    if (gameState.currentTurn !== 0) return;
    if (gameRef.current.playCard(0, card.id)) {
      updateState();
    }
  };

  const handleRestart = () => {
    gameRef.current = new BalootGame();
    gameRef.current.startNewRound();
    updateState();
  };

  const getPlayerPositionStyle = (id: PlayerId) => {
    switch (id) {
      case 0: return 'bottom-8 left-1/2 -translate-x-1/2';
      case 1: return 'right-8 top-1/2 -translate-y-1/2 flex-col items-end';
      case 2: return 'top-8 left-1/2 -translate-x-1/2 flex-col-reverse';
      case 3: return 'left-8 top-1/2 -translate-y-1/2 flex-col items-start';
    }
  };

  return (
    <div className="w-full h-full bg-[#0f172a] relative overflow-hidden flex flex-col select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-black pointer-events-none"></div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 pointer-events-none">
        <button
          onClick={() => setActivePage('home')}
          className="pointer-events-auto p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Score Board */}
        <div className="pointer-events-auto flex items-center gap-8 bg-black/40 backdrop-blur-xl px-10 py-4 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine"></div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Us</span>
            <span className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] font-mono">
              {gameState.scores.team0.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="h-12 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em]">Them</span>
            <span className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] font-mono">
              {gameState.scores.team1.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-3">
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all">
            <Volume2 size={20} />
          </button>
          <button
            onClick={handleRestart}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:rotate-180 duration-500"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Game Info Panel */}
      <div className="absolute top-32 left-8 pointer-events-none z-40">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/30 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-xl"
        >
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current Round</div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-white shadow-sm">
                {gameState.gameType === 'SUN' ? '☀️' : '👑'}
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">{gameState.gameType === 'SUN' ? 'Sun (No Trump)' : 'Hokum (Trump)'}</div>
              <div className="text-[10px] text-gray-400">Game Type</div>
            </div>
          </div>
          {gameState.trumpSuit && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-lg">
                <span className={`text-xl ${['H', 'D'].includes(gameState.trumpSuit) ? 'text-red-600' : 'text-slate-900'}`}>
                  {gameState.trumpSuit === 'H' ? '♥' : gameState.trumpSuit === 'D' ? '♦' : gameState.trumpSuit === 'C' ? '♣' : '♠'}
                </span>
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {gameState.trumpSuit === 'H' ? 'Hearts' : gameState.trumpSuit === 'D' ? 'Diamonds' : gameState.trumpSuit === 'C' ? 'Clubs' : 'Spades'}
                </div>
                <div className="text-xs text-gray-400">Trump Suit</div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Main Table */}
      <div className="flex-1 relative m-4 md:m-12 rounded-[5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden isolate transform-gpu">
        {/* Wood Border */}
        <div
          className="absolute inset-0 rounded-[5rem] z-0"
          style={{
            backgroundImage: `url(${WOOD_TEXTURE})`,
            backgroundColor: '#3f2e22',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)'
          }}
        ></div>

        {/* Felt Surface */}
        <div
          className="absolute inset-[20px] rounded-[4rem] z-0 overflow-hidden"
          style={{
            backgroundColor: '#1a472a',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9)'
          }}
        >
          {/* Carpet Pattern */}
          <div
            className="absolute inset-0 opacity-10 mix-blend-overlay"
            style={{ backgroundImage: `url(${CARPET_PATTERN})`, backgroundSize: '400px' }}
          ></div>

          {/* Felt Texture */}
          <div
            className="absolute inset-0 opacity-40 mix-blend-multiply"
            style={{ backgroundImage: `url(${FELT_TEXTURE})` }}
          ></div>

          {/* Lighting Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.8)_100%)]"></div>

          {/* Center Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <div className="w-96 h-96 border-[8px] border-white rounded-full flex items-center justify-center">
              <div className="w-80 h-80 border-[4px] border-white rounded-full flex items-center justify-center">
                <span className="text-6xl font-black text-white tracking-widest">BALOOT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Area Content */}
        <div className="absolute inset-[20px] z-10">

          {/* Players */}
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className={`absolute ${getPlayerPositionStyle(player.id)} flex items-center gap-4 transition-all duration-500`}
            >
              {/* Avatar */}
              <PlayerAvatar
                player={player}
                isTurn={gameState.currentTurn === player.id}
                position={player.id === 0 ? 'bottom' : player.id === 1 ? 'right' : player.id === 2 ? 'top' : 'left'}
              />

              {/* Hand */}
              <div className={`
                flex items-center justify-center
                ${player.id === 1 || player.id === 3 ? 'flex-col space-y-[-5rem]' : 'flex-row space-x-[-3rem]'}
`}>
                <AnimatePresence>
                  {player.hand.map((card, idx) => (
                    <div key={card.id} className="relative transition-transform hover:z-50" style={{ zIndex: idx }}>
                      <CardComponent
                        card={card}
                        isHidden={player.id !== 0}
                        isPlayable={player.id === 0 && gameRef.current.isValidMove(0, card) && gameState.currentTurn === 0}
                        onClick={player.id === 0 ? () => handleCardClick(card) : undefined}
                        index={idx}
                      />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {/* Current Trick (Center) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 flex items-center justify-center">
            <AnimatePresence>
              {gameState.currentTrick.map((play, idx) => {
                let initialPos = { x: 0, y: 0, rotate: 0 };
                // Start from player position roughly
                switch (play.playerId) {
                  case 0: initialPos = { x: 0, y: 200, rotate: 0 }; break;
                  case 1: initialPos = { x: 300, y: 0, rotate: 90 }; break;
                  case 2: initialPos = { x: 0, y: -200, rotate: 180 }; break;
                  case 3: initialPos = { x: -300, y: 0, rotate: -90 }; break;
                }

                // Random slight rotation for realism
                const randomRotate = Math.random() * 20 - 10;

                return (
                  <motion.div
                    key={play.card.id}
                    initial={{ opacity: 0, ...initialPos, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, y: 0, rotate: randomRotate, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="absolute shadow-2xl"
                    style={{ zIndex: idx }}
                  >
                    <CardComponent card={play.card} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Round End Overlay */}
        <AnimatePresence>
          {gameState.phase === 'FINISHED' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[#1e293b] border border-white/10 rounded-3xl p-10 text-center shadow-2xl max-w-lg w-full mx-4 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Round Complete</h2>
                <p className="text-gray-400 mb-8">The scores have been updated.</p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                    <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">Your Team</div>
                    <div className="text-4xl font-black text-white">{gameState.tricksCollected.team0}</div>
                    <div className="text-xs text-blue-300/60 mt-1">Points Gained</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
                    <div className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">Opponents</div>
                    <div className="text-4xl font-black text-white">{gameState.tricksCollected.team1}</div>
                    <div className="text-xs text-red-300/60 mt-1">Points Gained</div>
                  </div>
                </div>

                <button
                  onClick={handleRestart}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95"
                >
                  Start Next Round
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BalootPage;
