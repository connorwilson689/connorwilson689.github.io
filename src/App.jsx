import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { KeyboardControls, Sky, Stars, Cloud } from '@react-three/drei';
import { Suspense, useState, useEffect, useMemo } from 'react';
import Experience from './Experience';
import { Joystick } from 'react-joystick-component';
import { useJoystickControls } from 'ecctrl'; // Import the store hook
import { camcorderVideos } from './media';
import './App.css';

// 1. Define your keyboard map
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  
  // 1. Add BOTH names for Left
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },

  // 2. Add BOTH names for Right
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },

  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
  { name: 'action1', keys: ['1'] }, // Bonus: Adds an interaction key for later
 ];

const characterCards = [
  { id: 'frog', label: 'Frog' },
  { id: 'bike', label: 'Bike' },
  { id: 'rolly', label: 'Rolly Bike' }
];

function SolidWorksSandbox({ onExit }) {
  const [character, setCharacter] = useState(null);
  
  const setJoystick = useJoystickControls((state) => state.setJoystick)
  const releaseButton1 = useJoystickControls((state) => state.releaseButton1)

  //RESOLUTION LOCK
  const [dpr, setDpr] = useState(1); // State to hold our calculated resolution
  const [pixelationWidth, setPixelationWidth] = useState(400);
  const [cameraSensitivity, setCameraSensitivity] = useState(1.6);
  const [showFallMessage, setShowFallMessage] = useState(false);
  const [loopingThoughts, setLoopingThoughts] = useState([]);

  const thoughtMessages = useMemo(() => ([
    'where was I going again?',
    'I can balance a lot of snowglobes on my nose'
  ]), [])

  useEffect(() => {
    const updateResolution = () => {
      // Lower number = chunkier pixels. Higher number = smoother.
      // The slider updates this target render width in real time.
      let calculatedDpr = pixelationWidth / window.innerWidth;
      
      // 3. Prevent it from rendering higher than the device's actual limits
      calculatedDpr = Math.min(calculatedDpr, window.devicePixelRatio || 1);
      
      setDpr(calculatedDpr);
    };

    updateResolution(); // Run on startup
    window.addEventListener('resize', updateResolution); // Run if they turn their phone sideways
    return () => window.removeEventListener('resize', updateResolution);
  }, [pixelationWidth]);

  useEffect(() => {
    let thoughtIndex = 0

    const interval = window.setInterval(() => {
      const nextThought = thoughtMessages[thoughtIndex % thoughtMessages.length]
      thoughtIndex += 1

      setLoopingThoughts((current) => ([
        ...current,
        {
          id: `${Date.now()}-${Math.random()}`,
          text: nextThought
        }
      ].slice(-6)))
    }, 60000)

    return () => window.clearInterval(interval)
  }, [thoughtMessages])

  const triggerJump = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
  };
  
  const releaseJump = () => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
  };

  // --- FIX #2: THE JUMP SAFETY NET ---
  // This listens for ANY release event on the whole screen.
  // It fixes the "Sticky Button" bug 100%.
  useEffect(() => {
    const handleRelease = () => {
      releaseButton1(); 
    };
    
    // Listen to every possible "Let Go" event
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchend', handleRelease);
    window.addEventListener('touchcancel', handleRelease);
    window.addEventListener('pointerup', handleRelease);
    
    return () => {
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchend', handleRelease);
      window.removeEventListener('touchcancel', handleRelease);
      window.removeEventListener('pointerup', handleRelease);
    };
  }, [releaseButton1]);


  return (
    <KeyboardControls map={keyboardMap}>
      <button className="sandbox-home-button" type="button" onClick={onExit}>
        <span aria-hidden="true">&larr;</span> Projects
      </button>
  
      {/* 1. MOVE JOYSTICK (Left) */}
      <div style={{ position: 'absolute', bottom: 40, left: 40, zIndex: 99999 }}>
        <Joystick 
          size={100} 
          sticky={false} 
          baseColor="rgba(40, 40, 40, 0.8)" 
          stickColor="white" 
          move={(e) => {
            // --- FIX #1: THE ROTATION FIX ---
            const distance = Math.min(Math.sqrt(Math.pow(e.x, 2) + Math.pow(e.y, 2)), 1);
            
            // We removed the "- Math.PI / 2". 
            // Now: Up (y=1) -> 90 degrees (Forward).
            const angle = Math.atan2(e.y, e.x);
            
            setJoystick(distance, angle, true);
          }}
          stop={() => {
            setJoystick(0, 0, false)
          }}
        />
      </div>
{/* 2. JUMP BUTTON (Right) - FAKE SPACEBAR MODE */}
      <div 
        style={{ 
            position: 'absolute', bottom: 60, right: 60, zIndex: 99999,
            width: 80, height: 80, borderRadius: '50%',
            backgroundColor: 'rgba(200, 50, 50, 0.8)', border: '4px solid white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            userSelect: 'none', cursor: 'pointer', 
            touchAction: 'none' // Prevents scroll/zoom interference
        }}
        // --- THE MAGIC FIX ---
        onPointerDown={(e) => {
            e.target.setPointerCapture(e.pointerId); // Lock finger
            triggerJump(); // Press Spacebar
            
            // SAFETY PULSE: Release automatically after 100ms
            // This guarantees the jump stops even if the browser freezes.
            setTimeout(() => releaseJump(), 100);
        }}
        onPointerUp={(e) => {
            e.target.releasePointerCapture(e.pointerId);
            releaseJump(); // Release Spacebar
        }}
        onPointerLeave={() => releaseJump()} // Backup release
      >
        <span style={{color: 'white', fontWeight: 'bold', pointerEvents: 'none'}}>JUMP</span>
      </div>

      
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          pointerEvents: 'none',
          color: '#131313',
          fontSize: '10px',
          opacity: 0.7,
          maxWidth: '320px'
        }}
      >
        {loopingThoughts.map((thought) => (
          <span key={thought.id}>{thought.text}</span>
        ))}
      </div>


      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 99999,
          width: 220,
          padding: '12px 14px',
          borderRadius: '12px',
          background: 'rgba(18, 18, 18, 0.68)',
          color: 'white',
          fontSize: '12px',
          letterSpacing: '0.3px',
          textAlign: 'left',
          userSelect: 'none'
        }}
      >
        <label
          htmlFor="pixelation-slider"
          style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}
        >
          <span>Pixelation</span>
          <span>{pixelationWidth}px</span>
        </label>
        <input
          id="pixelation-slider"
          type="range"
          min="180"
          max="1200"
          step="20"
          value={pixelationWidth}
          onChange={(event) => setPixelationWidth(Number(event.target.value))}
          style={{ width: '100%', accentColor: '#9ed4ff' }}
          aria-label="Adjust screen pixelation"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, opacity: 0.78 }}>
          <span>chunky</span>
          <span>smooth</span>
        </div>

        <label
          htmlFor="camera-sensitivity-slider"
          style={{ display: 'flex', justifyContent: 'space-between', gap: 12, margin: '14px 0 8px' }}
        >
          <span>Camera</span>
          <span>{cameraSensitivity.toFixed(1)}x</span>
        </label>
        <input
          id="camera-sensitivity-slider"
          type="range"
          min="0.4"
          max="3"
          step="0.1"
          value={cameraSensitivity}
          onChange={(event) => setCameraSensitivity(Number(event.target.value))}
          style={{ width: '100%', accentColor: '#ffd18f' }}
          aria-label="Adjust camera sensitivity"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, opacity: 0.78 }}>
          <span>gentle</span>
          <span>quick</span>
        </div>
      </div>

      {/* --- THE HTML MENU OVERLAY --- */}
      {/* Only show this div if character is null */}
      {!character && (
        <div className="character-menu">
          <div className="character-options" aria-label="Choose a character">
            {characterCards.map((card) => (
              <button
                type="button"
                key={card.id}
                onClick={() => setCharacter(card.id)}
                className="character-option"
              >
                {card.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showFallMessage && (
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(18, 18, 18, 0.75)',
            color: '#fff',
            fontStyle: 'italic',
            letterSpacing: '0.4px'
          }}
        >
          some things just happen, without explaination...
        </div>
      )}

      {/* --- THE 3D WORLD --- */}
      <Canvas
        dpr={dpr}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, depth: true }}
        performance={{ min: 0.45 }}
        camera={{ position: [0, 5, 10], fov: 50 }}
        className="retro-canvas"
        //pixelated added to keep it from bluring
        style={{ height: '100vh', background: '#ececec', imageRendering: 'pixelated' }}
      >
        <color attach="background" args={["#f39a67"]} />
        <fog attach="fog" args={["#d97967", 34, 170]} />
        <ambientLight intensity={0.82} />
        <hemisphereLight args={["#ffbd82", "#4f6f40", 0.9]} />
        <directionalLight position={[22, 15, 12]} intensity={1.7} color="#ff9f5f" />
        <Sky distance={450000} sunPosition={[8, 1.7, 8]} turbidity={9} rayleigh={3.2} mieCoefficient={0.012} mieDirectionalG={0.88} />
        <Cloud position={[-18, 18, -30]} speed={0.12} opacity={0.5} width={16} depth={4} segments={4} />
        <Cloud position={[12, 15, -26]} speed={0.08} opacity={0.45} width={13} depth={4} segments={4} />
        <Cloud position={[30, 20, -20]} speed={0.1} opacity={0.35} width={18} depth={5} segments={4} />
        <Stars radius={170} depth={40} count={220} factor={5} saturation={0} fade speed={0.6} />
        
        {/* use this to see physics boxes: <Physics debug> */}
        <Physics>
          <Suspense fallback={null}>
            {/* Pass the chosen character down after selection; Experience delays spawning. */}
            <Experience
              key={character || 'no-character'}
              activeCharacter={character}
              onFallStateChange={setShowFallMessage}
              cameraSensitivity={cameraSensitivity}
            />
          </Suspense>
        </Physics>
      </Canvas>
    </KeyboardControls>
  );
}

const cameraPhotoSlots = [
  {
    number: '01',
    image: '/images/camcorder/camera-outside-01.jpg',
    alt: 'Sony Handycam held outside with its viewfinder raised',
    width: 1650,
    height: 2200
  },
  {
    number: '02',
    image: '/images/camcorder/camera-outside-02.jpg',
    alt: 'Side view of a Sony Handycam held outside',
    width: 1650,
    height: 2200
  },
  {
    number: '03',
    image: '/images/camcorder/camera-outside-03.jpg',
    alt: 'Sony Handycam carried outside by its hand strap',
    width: 1650,
    height: 2200
  },
  {
    number: '04',
    image: '/images/camcorder/camera-outside-04.jpg',
    alt: 'Rear view of a Sony Handycam held outside',
    width: 1650,
    height: 2200
  },
  {
    number: '05',
    image: '/images/camcorder/camera-inside-01.jpg',
    alt: 'Open camcorder showing its circuit board, wiring, and replacement lens',
    width: 1650,
    height: 2200
  },
  {
    number: '06',
    image: '/images/camcorder/camera-inside-02.jpg',
    alt: 'Side view of the modified Sony Handycam and replacement lens',
    width: 2200,
    height: 1650
  },
  {
    number: '07',
    image: '/images/camcorder/camera-inside-03.jpg',
    alt: 'Open tape compartment and mechanism inside the Sony Handycam',
    width: 1650,
    height: 2200
  },
  {
    number: '08',
    image: '/images/camcorder/camera-inside-04.jpg',
    alt: 'Close view of wiring and circuit boards inside the open camcorder',
    width: 1650,
    height: 2200
  }
];

function CamcorderProject({ onExit }) {
  return (
    <main className="camcorder-page">
      <nav className="camcorder-nav" aria-label="Project navigation">
        <button type="button" onClick={onExit} className="text-button">
          <span aria-hidden="true">&larr;</span> All projects
        </button>
        <span>Camcorder Project / Archive</span>
      </nav>

      <header className="camcorder-header">
        <p className="eyebrow">Personal documentation</p>
        <h1>CAMCORDER<br />PROJECT</h1>
        <p className="camcorder-intro">
          250 hours of stupid ideas from Jan 2026 to July 2026.
        </p>
      </header>

      <section className="photo-grid" aria-label="Camcorder photo locations">
        {cameraPhotoSlots.map((slot) => (
          <article className="photo-slot" key={slot.number}>
            <figure className="photo-frame">
              <img
                className="camcorder-photo"
                src={slot.image}
                alt={slot.alt}
                width={slot.width}
                height={slot.height}
                loading={slot.number === '01' ? 'eager' : 'lazy'}
                decoding="async"
              />
              <span className="photo-number" aria-hidden="true">PHOTO {slot.number}</span>
            </figure>
          </article>
        ))}
      </section>

      <section className="video-grid" aria-label="Camcorder video locations">
        <CamcorderVideo label="FOOTAGE" {...camcorderVideos.footage} />
        <CamcorderVideo label="CAD VIDEO" {...camcorderVideos.cad} />
        <CamcorderVideo label="EXTERNAL FOOTAGE" {...camcorderVideos.external} />
      </section>

      <footer className="camcorder-footer">
        <span>Camcorder Project</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}

function CamcorderVideo({ label, src, type }) {
  if (!src) {
    return <div className="video-placeholder">{label}</div>;
  }

  return (
    <figure className="video-frame">
      <video controls playsInline preload="metadata" aria-label={label}>
        <source src={src} type={type} />
        <a href={src}>Open the {label.toLowerCase()} file.</a>
      </video>
    </figure>
  );
}

function StartupMenu({ onSelect }) {
  return (
    <main className="startup-menu">
      <div className="startup-grain" aria-hidden="true" />
      <header className="startup-header">
        <span className="startup-mark">CW</span>
        <span>PROJECT INDEX</span>
        <span>SELECT A WORLD</span>
      </header>

      <section className="startup-content">
        <p className="eyebrow">Choose a project to enter</p>
        <h1>WHERE TO?</h1>
        <div className="project-options">
          <button type="button" className="project-option camcorder-option" onClick={() => onSelect('camcorder')}>
            <span className="option-number">01</span>
            <span className="option-copy">
              <strong>Camcorder Project</strong>
              <small>Camera build and footage</small>
            </span>
            <span className="option-arrow" aria-hidden="true">↗</span>
          </button>
          <button type="button" className="project-option sandbox-option" onClick={() => onSelect('sandbox')}>
            <span className="option-number">02</span>
            <span className="option-copy">
              <strong>Solid Works Sandbox</strong>
              <small>Enter the interactive 3D world</small>
            </span>
            <span className="option-arrow" aria-hidden="true">↗</span>
          </button>
        </div>
      </section>

      <footer className="startup-footer">
        <span>Connor Wilson</span>
        <span>Use mouse / touch to select</span>
      </footer>
    </main>
  );
}

function App() {
  const [project, setProject] = useState(null);

  if (project === 'camcorder') {
    return <CamcorderProject onExit={() => setProject(null)} />;
  }

  if (project === 'sandbox') {
    return <SolidWorksSandbox onExit={() => setProject(null)} />;
  }

  return <StartupMenu onSelect={setProject} />;
}

export default App;
