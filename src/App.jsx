import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { KeyboardControls } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import Experience from './Experience';
import { Joystick } from 'react-joystick-component';
import { useJoystickControls } from 'ecctrl'; // Import the store hook

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

function App() {
  const [character, setCharacter] = useState(null);
  
  const setJoystick = useJoystickControls((state) => state.setJoystick)
  const pressButton1 = useJoystickControls((state) => state.pressButton1)
  const releaseButton1 = useJoystickControls((state) => state.releaseButton1)
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

      
      {/* --- THE HTML MENU OVERLAY --- */}
      {/* Only show this div if character is null */}
      {!character && (
        <div style={{
          position: 'absolute', 
          top: 0, left: 0, width: '100%', height: '100%', 
          zIndex: 10, 
          background: 'rgba(0,0,0,0.8)', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white'
        }}>
          <h1>Choose Your Character</h1>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
            {/* FROG CARD */}
            <div 
              onClick={() => setCharacter('frog')}
              style={{ 
                cursor: 'pointer', 
                background: 'white', 
                padding: '10px', 
                borderRadius: '10px',
                textAlign: 'center',
                transition: 'transform 0.2s' // Adds a hover effect
              }}
              // Simple hover animation (optional)
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1.0)"}
            >
              <img 
                // src="./frog-thumb.png" 
                alt="Frog" 
                style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }} 
              />
              <h3 style={{ color: 'black', margin: '10px 0 0 0' }}>Frog</h3>
            </div>

            {/* BIKE CARD */}
            <div 
              onClick={() => setCharacter('bike')}
              style={{ 
                cursor: 'pointer', 
                background: 'white', 
                padding: '10px', 
                borderRadius: '10px',
                textAlign: 'center',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1.0)"}
            >
              <img 
                // src="./bike-thumb.png" 
                alt="Bicycle" 
                style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }} 
              />
              <h3 style={{ color: 'black', margin: '10px 0 0 0' }}>Bicycle</h3>
            </div>
            {/* ROLLY CARD */}
            <div 
              onClick={() => setCharacter('rolly')}
              style={{ 
                cursor: 'pointer', background: 'white', padding: '10px', 
                borderRadius: '10px', textAlign: 'center', transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1.0)"}
            >
              <img 
                // src="./bike-thumb.png" 
                alt="Rolly" 
                style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }} 
              />
              <h3 style={{ color: 'black', margin: '10px 0 0 0' }}>Rolly Bike</h3>
            </div>
            {/*
                        
            <div 
              onClick={() => setCharacter('FrogOnBicycle')}
              style={{ 
                cursor: 'pointer', background: 'white', padding: '10px', 
                borderRadius: '10px', textAlign: 'center', transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1.0)"}
            >
              <img 
                src="./bike-thumb.png" 
                alt="Rolly" 
                style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }} 
              />
              <h3 style={{ color: 'black', margin: '10px 0 0 0' }}>Bike on Frog</h3>
            </div>
            */}

          </div>
        </div>
      )}

      {/* --- THE 3D WORLD --- */}
      <Canvas
        dpr={.25} // Performance fix for your Surface
        shadows
        camera={{ position: [0, 5, 10], fov: 50 }}
        //pixelated added to keep it from bluring
        style={{ height: '100vh', background: '#ececec', imageRendering: 'pixelated'}}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        
        {/* use this to see physics boxes: <Physics debug timeStep="vary"> */}
        <Physics timeStep="vary">
          <Suspense fallback={null}>
            {/* Pass the chosen character down to Experience */}
            {/* If char is null, we pass 'frog' as default just to prevent crash, 
                but the menu covers it anyway. */}
            <Experience activeCharacter={character || 'frog'} />
          </Suspense>
        </Physics>
      </Canvas>
    </KeyboardControls>
  );
}

export default App;