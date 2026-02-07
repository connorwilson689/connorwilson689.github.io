import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { KeyboardControls } from '@react-three/drei';
import { Suspense, useState } from 'react'; // <--- Added useState
import Experience from './Experience';


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
  // 1. State to track if we have chosen a character yet
  // null = showing menu
  // 'frog' or 'bike' = playing game
  const [character, setCharacter] = useState(null);

  return (
    <KeyboardControls map={keyboardMap}>
      
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