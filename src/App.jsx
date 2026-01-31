import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { KeyboardControls } from '@react-three/drei';
import { Suspense } from 'react' // <--- Add this line
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

//the environment manager (doesnt contain game objects)
function App() {
  return (
    // 2. The KeyboardControls wrapper lets the whole app know when you press W/A/S/D
    <KeyboardControls map={keyboardMap}>
      {/* 3. The Canvas is your 3D window */}
      <Canvas
        shadows
        camera={{ position: [0, 5, 10], fov: 50 }}
        style={{ height: '100vh', background: '#ececec' }}
      >
        {/* 4. Lights so we can see */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1} 
          castShadow 
        />

        {/* 5. Physics World - "debug" shows wireframes so you can see hitboxes */}
        <Physics debug timeStep="vary">
            <Experience />
        </Physics>
      </Canvas>
    </KeyboardControls>
  );
}

export default App;