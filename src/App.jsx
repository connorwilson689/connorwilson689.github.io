import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, useAfterPhysicsStep, useBeforePhysicsStep, useRapier } from '@react-three/rapier';
import { KeyboardControls, Sky, Stars, Cloud } from '@react-three/drei';
import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import Experience from './Experience';
import { Joystick } from 'react-joystick-component';
import { useJoystickControls } from 'ecctrl'; // Import the store hook
import { camcorderVideos } from './media';
import { profile } from './profile';
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

const PERFORMANCE_SAMPLE_SECONDS = 0.5;

function SandboxPerformanceProbe({ onSample }) {
  const { gl, scene } = useThree();
  const { world } = useRapier();
  const sample = useRef({
    frames: 0,
    elapsed: 0,
    worstFrameMs: 0,
    drawCalls: 0,
    triangles: 0,
    physicsMs: 0,
    physicsSteps: 0
  });
  const physicsStartedAt = useRef(null);
  const resetOnNextFrame = useRef(true);

  useEffect(() => {
    const resetAfterVisibilityChange = () => {
      resetOnNextFrame.current = true;
    };

    document.addEventListener('visibilitychange', resetAfterVisibilityChange);
    return () => document.removeEventListener('visibilitychange', resetAfterVisibilityChange);
  }, []);

  useBeforePhysicsStep(() => {
    physicsStartedAt.current = window.performance.now();
  });

  useAfterPhysicsStep(() => {
    if (physicsStartedAt.current === null) return;
    sample.current.physicsMs += window.performance.now() - physicsStartedAt.current;
    sample.current.physicsSteps += 1;
    physicsStartedAt.current = null;
  });

  useFrame((_, delta) => {
    if (document.hidden) return;

    if (resetOnNextFrame.current) {
      sample.current = {
        frames: 0,
        elapsed: 0,
        worstFrameMs: 0,
        drawCalls: 0,
        triangles: 0,
        physicsMs: 0,
        physicsSteps: 0
      };
      resetOnNextFrame.current = false;
      return;
    }

    const current = sample.current;
    const frameMs = delta * 1000;
    current.frames += 1;
    current.elapsed += delta;
    current.worstFrameMs = Math.max(current.worstFrameMs, frameMs);
    current.drawCalls += gl.info.render.calls;
    current.triangles += gl.info.render.triangles;

    if (current.elapsed < PERFORMANCE_SAMPLE_SECONDS) return;

    let visibleMeshes = 0;
    scene.traverseVisible((object) => {
      if (object.isMesh) visibleMeshes += 1;
    });

    const browserMemory = window.performance.memory;
    onSample({
      fps: current.frames / current.elapsed,
      averageFrameMs: (current.elapsed * 1000) / current.frames,
      worstFrameMs: current.worstFrameMs,
      drawCalls: current.drawCalls / current.frames,
      triangles: current.triangles / current.frames,
      visibleMeshes,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      renderWidth: gl.domElement.width,
      renderHeight: gl.domElement.height,
      pixelRatio: gl.getPixelRatio(),
      physicsMs: current.physicsMs / current.frames,
      physicsSteps: current.physicsSteps,
      rigidBodies: world.bodies.len(),
      colliders: world.colliders.len(),
      heapMb: browserMemory ? browserMemory.usedJSHeapSize / 1048576 : null
    });

    sample.current = {
      frames: 0,
      elapsed: 0,
      worstFrameMs: 0,
      drawCalls: 0,
      triangles: 0,
      physicsMs: 0,
      physicsSteps: 0
    };
  });

  return null;
}

function PerformanceReadout({ stats }) {
  if (!stats) return <p className="performance-waiting">Sampling...</p>;

  const count = (value) => Math.round(value).toLocaleString();
  const decimal = (value) => value.toFixed(1);

  return (
    <div className="performance-readout">
      <div className="performance-group">
        <strong>Frame</strong>
        <dl>
          <div><dt>FPS</dt><dd>{count(stats.fps)}</dd></div>
          <div><dt>Average</dt><dd>{decimal(stats.averageFrameMs)} ms</dd></div>
          <div><dt>Worst</dt><dd>{decimal(stats.worstFrameMs)} ms</dd></div>
        </dl>
      </div>
      <div className="performance-group">
        <strong>Render</strong>
        <dl>
          <div><dt>Draw calls</dt><dd>{count(stats.drawCalls)}</dd></div>
          <div><dt>Triangles</dt><dd>{count(stats.triangles)}</dd></div>
          <div><dt>Visible meshes</dt><dd>{count(stats.visibleMeshes)}</dd></div>
          <div><dt>Buffer</dt><dd>{stats.renderWidth} × {stats.renderHeight}</dd></div>
          <div><dt>Pixel ratio</dt><dd>{stats.pixelRatio.toFixed(2)}</dd></div>
        </dl>
      </div>
      <div className="performance-group">
        <strong>Physics</strong>
        <dl>
          <div><dt>Time / frame</dt><dd>{decimal(stats.physicsMs)} ms</dd></div>
          <div><dt>Steps / sample</dt><dd>{count(stats.physicsSteps)}</dd></div>
          <div><dt>Bodies</dt><dd>{count(stats.rigidBodies)}</dd></div>
          <div><dt>Colliders</dt><dd>{count(stats.colliders)}</dd></div>
        </dl>
      </div>
      <div className="performance-group">
        <strong>Memory</strong>
        <dl>
          <div><dt>Geometries</dt><dd>{count(stats.geometries)}</dd></div>
          <div><dt>Textures</dt><dd>{count(stats.textures)}</dd></div>
          <div><dt>JS heap</dt><dd>{stats.heapMb === null ? '—' : `${count(stats.heapMb)} MB`}</dd></div>
        </dl>
      </div>
      <p className="performance-note">Exact object and script timing still needs the browser profiler.</p>
    </div>
  );
}

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
  const [showPerformance, setShowPerformance] = useState(false);
  const [performanceStats, setPerformanceStats] = useState(null);

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
        className="sandbox-settings"
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
          userSelect: 'none',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto'
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

        <button
          type="button"
          className="performance-toggle"
          aria-expanded={showPerformance}
          onClick={() => {
            setPerformanceStats(null);
            setShowPerformance((current) => !current);
          }}
        >
          <span>Performance</span>
          <span>{showPerformance ? 'close' : 'open'}</span>
        </button>

        {showPerformance && <PerformanceReadout stats={performanceStats} />}
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
          {showPerformance && <SandboxPerformanceProbe onSample={setPerformanceStats} />}
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
        <span>4K Boombox with CRT display / Archive</span>
      </nav>

      <header className="camcorder-header">
        <p className="eyebrow">Personal documentation</p>
        <h1>4K Boombox with CRT display</h1>
        <p className="camcorder-intro">
          250 hours of bad ideas from Jan 2026 to July 2026.
        </p>
      </header>

      <section className="video-grid" aria-label="Project videos">
        <CamcorderVideo label="footage" {...camcorderVideos.footage} />
        <CamcorderVideo label="cad" {...camcorderVideos.cad} />
        <CamcorderVideo label="custom cassette deck mechanics" {...camcorderVideos.external} />
      </section>

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

      <section className="build-summary" aria-labelledby="build-summary-title">
        <p className="eyebrow">Build summary</p>
        <h2 id="build-summary-title">Parts + cost</h2>
        <ul className="parts-list">
          <li><span>Broken GoPro HERO4 with Sony Exmor CMOS sensor</span><span>$10.00</span></li>
          <li><span>Canovision 8 lens</span><span>$2.00</span></li>
          <li><span>Sony Handycam shell with CRT display for GoPro composite feed</span><span>$6.00</span></li>
          <li><span>Karaoke machine cassette deck parts and radio</span><span>$3.00</span></li>
          <li><span>Sony microcassette speaker</span><span>$1.50</span></li>
          <li><span>Audio amplifier</span><span>$2.00</span></li>
          <li><span>Broken handwarmer power bank</span><span>$0.50</span></li>
          <li><span>Mini USB connector, USB connector, old Apple Earbuds microphone, GA-Tech 3D-print materials, wires, and glue</span><span>Free</span></li>
        </ul>
        <p className="build-total"><span>Total</span><strong>$25.00</strong></p>
      </section>

      <footer className="camcorder-footer">
        <span>4K Boombox with CRT display</span>
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
      <figcaption className="video-label">{label}</figcaption>
      <video controls playsInline preload="metadata" aria-label={label}>
        <source src={src} type={type} />
        <a href={src}>Open the {label.toLowerCase()} file.</a>
      </video>
    </figure>
  );
}

function ProfileDrawer({ open, onClose, triggerRef }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const closeDialog = () => dialogRef.current?.close();

  return (
    <dialog
      id="profile-dialog"
      ref={dialogRef}
      className="profile-dialog"
      aria-labelledby="profile-title"
      onClose={() => {
        onClose();
        triggerRef.current?.focus();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div className="profile-drawer">
        <header className="profile-drawer-header">
          <span>Profile / Contact</span>
          <button type="button" className="profile-close" onClick={closeDialog}>Close</button>
        </header>

        <figure className={`profile-portrait${profile.portraitSrc ? '' : ' profile-portrait-empty'}`}>
          {profile.portraitSrc ? (
            <img
              src={profile.portraitSrc}
              alt={profile.portraitAlt || 'Profile portrait'}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span>Portrait</span>
          )}
        </figure>

        <section className="profile-details">
          <p className="eyebrow">Personal details</p>
          <h2 id="profile-title">{profile.name || 'Profile'}</h2>
          <div className="profile-links">
            {profile.contactHref ? (
              <a className="profile-link" href={profile.contactHref}>
                <span>{profile.contactLabel || 'Contact'}</span>
                <span aria-hidden="true">&rarr;</span>
              </a>
            ) : (
              <span className="profile-link profile-link-empty">
                <span>Contact</span>
                <span aria-hidden="true">&mdash;</span>
              </span>
            )}

            {profile.linkedInHref ? (
              <a
                className="profile-link"
                href={profile.linkedInHref}
                target="_blank"
                rel="noreferrer"
              >
                <span>LinkedIn</span>
                <span aria-hidden="true">&nearr;</span>
              </a>
            ) : (
              <span className="profile-link profile-link-empty">
                <span>LinkedIn</span>
                <span aria-hidden="true">&mdash;</span>
              </span>
            )}
          </div>
        </section>
      </div>
    </dialog>
  );
}

function StartupMenu({ onSelect }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileTriggerRef = useRef(null);

  return (
    <main className="startup-menu">
      <div className="startup-grain" aria-hidden="true" />
      <header className="startup-header">
        <button
          ref={profileTriggerRef}
          type="button"
          className="startup-mark"
          aria-label="Open profile and contact"
          aria-haspopup="dialog"
          aria-expanded={profileOpen}
          aria-controls="profile-dialog"
          onClick={() => setProfileOpen(true)}
        >
          CW
        </button>
      </header>

      <section className="startup-content">
        <h1>THERE,<br />SLOW DREAMER</h1>
        <div className="project-options">
          <button type="button" className="project-option camcorder-option" onClick={() => onSelect('camcorder')}>
            <span className="option-number">01</span>
            <span className="option-copy">
              <strong>4K Boombox with CRT display</strong>
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
      </footer>

      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        triggerRef={profileTriggerRef}
      />
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
