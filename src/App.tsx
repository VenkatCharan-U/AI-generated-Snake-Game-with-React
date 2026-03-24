import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Types ---
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 70;

const TRACKS = [
  {
    id: 1,
    title: "DATA_STREAM_01.WAV",
    artist: "UNKNOWN_ENTITY",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "CORRUPTED_SECTOR.MP3",
    artist: "SYS_ADMIN",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "VOID_RESONANCE.FLAC",
    artist: "NULL_POINTER",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

// --- Helper Functions ---
const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // eslint-disable-next-line no-loop-func
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGamePaused, setIsGamePaused] = useState(false);

  // Refs for game loop to avoid dependency issues in setInterval
  const snakeRef = useRef(snake);
  const directionRef = useRef(direction);
  const foodRef = useRef(food);
  const gameOverRef = useRef(gameOver);
  const isGamePausedRef = useRef(isGamePaused);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Sync Refs ---
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { isGamePausedRef.current = isGamePaused; }, [isGamePaused]);

  // --- Game Logic ---
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setIsGamePaused(false);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const moveSnake = useCallback(() => {
    if (gameOverRef.current || isGamePausedRef.current) return;

    const currentSnake = snakeRef.current;
    const head = currentSnake[0];
    const currentDir = directionRef.current;

    const newHead = { ...head };

    switch (currentDir) {
      case 'UP': newHead.y -= 1; break;
      case 'DOWN': newHead.y += 1; break;
      case 'LEFT': newHead.x -= 1; break;
      case 'RIGHT': newHead.x += 1; break;
    }

    // Check collision with walls
    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      setGameOver(true);
      return;
    }

    // Check collision with self
    if (currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      setGameOver(true);
      return;
    }

    const newSnake = [newHead, ...currentSnake];

    // Check food collision
    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
      setScore(s => s + 16); // Hex-like scoring
      setFood(generateFood(newSnake));
    } else {
      newSnake.pop(); // Remove tail if no food eaten
    }

    setSnake(newSnake);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (gameOver) resetGame();
        else setIsGamePaused(p => !p);
        return;
      }

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  useEffect(() => {
    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-digital selection:bg-magenta-glitch selection:text-black">
      
      {/* Overlays */}
      <div className="scanlines"></div>
      <div className="static-noise"></div>

      <div className="screen-tear w-full max-w-6xl z-10">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-2 uppercase glitch-text" data-text="SYS.SNAKE_PROTOCOL">
            SYS.SNAKE_PROTOCOL
          </h1>
          <br />
          <p className="text-magenta-glitch tracking-widest text-xl uppercase bg-cyan-glitch/20 inline-block px-2 border border-magenta-glitch">
            WARNING: UNAUTHORIZED_ACCESS_DETECTED
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start w-full justify-center">
          
          {/* Left Panel: Music Player */}
          <div className="w-full lg:w-80 glitch-box-magenta p-6 flex flex-col gap-6 relative">
            <div className="absolute top-0 left-0 bg-magenta-glitch text-black px-2 py-1 text-sm font-bold">
              AUDIO_STREAM_OVERRIDE
            </div>
            
            <div className="text-center mt-4">
              <div className="relative w-full aspect-square border-2 border-cyan-glitch mb-4 bg-black overflow-hidden flex items-center justify-center">
                {/* Abstract visualizer */}
                <div className="absolute inset-0 flex items-end justify-center gap-2 p-4 opacity-80">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-4 bg-cyan-glitch border-t-4 border-magenta-glitch"
                      style={{ 
                        height: isPlaying ? `${Math.random() * 80 + 10}%` : '5%',
                        animation: isPlaying ? `pulse ${0.1 + i * 0.05}s infinite alternate` : 'none'
                      }}
                    ></div>
                  ))}
                </div>
                {!isPlaying && <span className="text-magenta-glitch z-10 bg-black px-2 border border-cyan-glitch">OFFLINE</span>}
              </div>

              <h3 className="text-2xl font-bold text-cyan-glitch truncate uppercase">{TRACKS[currentTrackIndex].title}</h3>
              <p className="text-lg text-magenta-glitch truncate uppercase">SRC: {TRACKS[currentTrackIndex].artist}</p>
            </div>

            <audio 
              ref={audioRef} 
              src={TRACKS[currentTrackIndex].url} 
              onEnded={handleTrackEnd}
            />

            <div className="flex flex-col gap-6">
              {/* Controls */}
              <div className="flex items-center justify-between border-y-2 border-magenta-glitch py-2">
                <button onClick={prevTrack} className="text-2xl text-cyan-glitch hover:text-magenta-glitch hover:bg-cyan-glitch/20 px-2 transition-none cursor-pointer">
                  [ &lt;&lt; ]
                </button>
                <button 
                  onClick={togglePlay} 
                  className="text-3xl bg-cyan-glitch text-black px-4 py-1 hover:bg-magenta-glitch hover:text-white transition-none font-bold cursor-pointer"
                >
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <button onClick={nextTrack} className="text-2xl text-cyan-glitch hover:text-magenta-glitch hover:bg-cyan-glitch/20 px-2 transition-none cursor-pointer">
                  [ &gt;&gt; ]
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-4 text-cyan-glitch">
                <button onClick={() => setIsMuted(!isMuted)} className="hover:text-magenta-glitch text-xl w-12 text-left cursor-pointer">
                  {isMuted || volume === 0 ? 'MUTE' : 'VOL'}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-full h-4 bg-black border-2 border-cyan-glitch appearance-none cursor-pointer accent-magenta-glitch"
                />
              </div>
            </div>
          </div>

          {/* Center Panel: Game */}
          <div className="flex flex-col items-center">
            <div className="flex justify-between w-full mb-2 px-2 items-end border-b-2 border-cyan-glitch pb-2">
              <div className="flex items-center gap-4">
                <span className="text-magenta-glitch text-2xl uppercase tracking-widest">BYTES_HARVESTED:</span>
                <span className="text-cyan-glitch text-4xl bg-magenta-glitch/20 px-2 border border-cyan-glitch">
                  0x{score.toString(16).padStart(4, '0').toUpperCase()}
                </span>
              </div>
              <div className="text-magenta-glitch text-xl flex items-center animate-pulse">
                {isGamePaused && !gameOver ? '[ PAUSED ]' : (isPlaying ? 'LINK_ACTIVE' : 'AWAITING_INPUT')}
              </div>
            </div>

            <div className="relative glitch-box-cyan p-2">
              {/* Game Grid */}
              <div 
                className="grid bg-black border-2 border-magenta-glitch/30"
                style={{ 
                  gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                  width: 'min(90vw, 500px)',
                  height: 'min(90vw, 500px)'
                }}
              >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  
                  const snakeIndex = snake.findIndex(segment => segment.x === x && segment.y === y);
                  const isSnake = snakeIndex !== -1;
                  const isHead = snakeIndex === 0;
                  const isFood = food.x === x && food.y === y;

                  // Calculate opacity and glow for tail
                  const tailOpacity = isSnake && !isHead ? Math.max(0.2, 1 - (snakeIndex / snake.length)) : 1;
                  const glowStyle = isSnake && !isHead ? { boxShadow: `0 0 ${10 * tailOpacity}px var(--color-cyan-glitch)` } : {};

                  return (
                    <div 
                      key={i} 
                      className={`
                        w-full h-full border-[1px] border-cyan-glitch/10
                        ${isHead ? 'bg-cyan-glitch border-2 border-magenta-glitch z-10 relative shadow-[0_0_15px_var(--color-cyan-glitch)]' : ''}
                        ${isFood ? 'bg-magenta-glitch animate-pulse shadow-[0_0_15px_var(--color-magenta-glitch)]' : ''}
                      `}
                      style={{
                        ...(isSnake && !isHead ? { backgroundColor: `rgba(0, 255, 255, ${tailOpacity})`, ...glowStyle } : {})
                      }}
                    />
                  );
                })}
              </div>

              {/* Overlays */}
              {gameOver && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 border-4 border-magenta-glitch">
                  <h2 className="text-5xl font-black mb-4 tracking-widest uppercase text-magenta-glitch glitch-text" data-text="FATAL_EXCEPTION">
                    FATAL_EXCEPTION
                  </h2>
                  <p className="text-3xl mb-8 text-cyan-glitch bg-magenta-glitch/20 px-4 py-2 border border-cyan-glitch">
                    TOTAL_BYTES: 0x{score.toString(16).padStart(4, '0').toUpperCase()}
                  </p>
                  <button 
                    onClick={resetGame}
                    className="px-8 py-4 bg-cyan-glitch text-black font-bold text-2xl uppercase tracking-widest hover:bg-magenta-glitch hover:text-white transition-none border-4 border-black outline outline-2 outline-cyan-glitch hover:outline-magenta-glitch cursor-pointer"
                  >
                    [ INITIATE_REBOOT ]
                  </button>
                </div>
              )}

              {!gameOver && isGamePaused && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 border-4 border-cyan-glitch">
                  <h2 className="text-6xl font-black text-cyan-glitch tracking-widest uppercase glitch-text" data-text="SYSTEM_PAUSED">SYSTEM_PAUSED</h2>
                  <p className="text-magenta-glitch mt-4 text-2xl bg-black px-4 border border-magenta-glitch">AWAITING SPACEBAR INPUT</p>
                </div>
              )}
            </div>

            <div className="mt-4 text-cyan-glitch text-lg text-center border border-cyan-glitch/30 p-2 bg-black/50 w-full">
              <p>INPUT: [W][A][S][D] OR [ARROWS] TO NAVIGATE</p>
              <p>INTERRUPT: [SPACE] TO PAUSE/RESUME</p>
            </div>
          </div>

        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { transform: scaleY(0.1); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
