import { RigidBody } from '@react-three/rapier';
import Ecctrl from 'ecctrl';
import { useKeyboardControls, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef, useMemo } from 'react'

function Frog() {
  const { nodes, materials } = useGLTF('./frog.glb')
  const [, get] = useKeyboardControls()
  const jawRef = useRef()

  useFrame((state) => {
    const { forward, backward, left, right, leftward, rightward } = get()

    if (forward || backward || left || right || leftward || rightward) {
      if (jawRef.current) {
        const flapSpeed = 20
        const maxOpenAmount = 0.4
        jawRef.current.rotation.x = Math.abs(Math.sin(state.clock.elapsedTime * flapSpeed)) * maxOpenAmount
      }
    } else if (jawRef.current) {
      jawRef.current.rotation.x = 0
    }
  })

  return (
    <group dispose={null}>
      <mesh
        geometry={nodes.Body.geometry}
        position={nodes.Body.position}
        rotation={nodes.Body.rotation}
        material={materials.GreenMaterial || new THREE.MeshStandardMaterial({ color: 'green' })}
      />

      <mesh
        ref={jawRef}
        geometry={nodes.Jaw.geometry}
        position={nodes.Jaw.position}
        rotation={nodes.Jaw.rotation}
        material={materials.GreenMaterial || new THREE.MeshStandardMaterial({ color: 'green' })}
      />
    </group>
  )
}

function Bicycle() {
  const { nodes, materials } = useGLTF('./bicycle.glb')
  const [, get] = useKeyboardControls()

  const frontWheel = useRef()
  const backWheel = useRef()

  useFrame((_, delta) => {
    const { forward, backward, leftward, rightward } = get()
    const isMoving = forward || backward || leftward || rightward
    const speed = 15

    if (isMoving) {
      const direction = backward ? 1 : -1

      if (frontWheel.current) frontWheel.current.rotation.x += speed * direction * delta
      if (backWheel.current) backWheel.current.rotation.x += speed * direction * delta
    }
  })

  return (
    <group dispose={null}>
      <mesh
        geometry={nodes['FullBike_-_Frame-1'].geometry}
        position={nodes['FullBike_-_Frame-1'].position}
        rotation={nodes['FullBike_-_Frame-1'].rotation}
        material={materials.BikeFrameMat || materials.Material}
      />

      <mesh
        ref={frontWheel}
        geometry={nodes['FullBike_-_Wheel-1'].geometry}
        position={nodes['FullBike_-_Wheel-1'].position}
        rotation={nodes['FullBike_-_Wheel-1'].rotation}
        material={materials.BikeTire || materials.Material}
      />

      <mesh
        ref={backWheel}
        geometry={nodes['FullBike_-_Wheel-2'].geometry}
        position={nodes['FullBike_-_Wheel-2'].position}
        rotation={nodes['FullBike_-_Wheel-2'].rotation}
        material={materials.BikeTire || materials.Material}
      />
    </group>
  )
}

function PropBicycle({ position, rotation = [0, 0, 0], scale = 1 }) {
  const { nodes, materials } = useGLTF('./bicycle.glb')

  return (
    <RigidBody type="fixed" colliders="hull">
      <group position={position} rotation={rotation} scale={scale} dispose={null}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['FullBike_-_Frame-1'].geometry}
          position={nodes['FullBike_-_Frame-1'].position}
          rotation={nodes['FullBike_-_Frame-1'].rotation}
          material={materials.BikeFrameMat || materials.Material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['FullBike_-_Wheel-1'].geometry}
          position={nodes['FullBike_-_Wheel-1'].position}
          rotation={nodes['FullBike_-_Wheel-1'].rotation}
          material={materials.BikeTire || materials.Material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['FullBike_-_Wheel-2'].geometry}
          position={nodes['FullBike_-_Wheel-2'].position}
          rotation={nodes['FullBike_-_Wheel-2'].rotation}
          material={materials.BikeTire || materials.Material}
        />
      </group>
    </RigidBody>
  )
}

function PropFrog({ position, rotation = [0, 0, 0], scale = 0.5 }) {
  const { nodes, materials } = useGLTF('./frog.glb')

  return (
    <RigidBody type="fixed" colliders="hull">
      <group position={position} rotation={rotation} scale={scale} dispose={null}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Body.geometry}
          position={nodes.Body.position}
          rotation={nodes.Body.rotation}
          material={materials.GreenMaterial || new THREE.MeshStandardMaterial({ color: 'green' })}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Jaw.geometry}
          position={nodes.Jaw.position}
          rotation={nodes.Jaw.rotation}
          material={materials.GreenMaterial || new THREE.MeshStandardMaterial({ color: 'green' })}
        />
      </group>
    </RigidBody>
  )
}


function FlyingWingBike({ center = [0, 22, 0], radius = 90, speed = 0.2, phase = 0, altitudeWave = 3, scale = 0.55 }) {
  const { nodes, materials } = useGLTF('./bicycle.glb')
  const bikeRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + phase
    const x = center[0] + Math.cos(t) * radius
    const z = center[2] + Math.sin(t) * radius
    const y = center[1] + Math.sin(t * 2.4) * altitudeWave

    if (bikeRef.current) {
      bikeRef.current.position.set(x, y, z)
      bikeRef.current.rotation.set(0.08 * Math.sin(t * 2), -t, 0.12 * Math.cos(t * 1.7))
    }
  })

  return (
    <group ref={bikeRef} scale={scale}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['FullBike_-_Frame-1'].geometry}
        position={nodes['FullBike_-_Frame-1'].position}
        rotation={nodes['FullBike_-_Frame-1'].rotation}
        material={materials.BikeFrameMat || materials.Material}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['FullBike_-_Wheel-1'].geometry}
        position={nodes['FullBike_-_Wheel-1'].position}
        rotation={nodes['FullBike_-_Wheel-1'].rotation}
        material={materials.BikeTire || materials.Material}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['FullBike_-_Wheel-2'].geometry}
        position={nodes['FullBike_-_Wheel-2'].position}
        rotation={nodes['FullBike_-_Wheel-2'].rotation}
        material={materials.BikeTire || materials.Material}
      />

      <mesh castShadow receiveShadow position={[0, 1.5, -0.1]}>
        <boxGeometry args={[8.5, 0.2, 1.8]} />
        <meshStandardMaterial color="#e6e7ef" metalness={0.35} roughness={0.28} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.5, 0.9]}>
        <boxGeometry args={[3.2, 0.16, 1.1]} />
        <meshStandardMaterial color="#f0f2ff" metalness={0.3} roughness={0.25} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.6, 1.2, -2.3]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.45, 1.1, 3.9]} />
        <meshStandardMaterial color="#ffb6c7" emissive="#913146" emissiveIntensity={0.3} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.6, 1.2, -2.3]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.45, 1.1, 3.9]} />
        <meshStandardMaterial color="#ffb6c7" emissive="#913146" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function TrailerHome({ position = [0, 0, 0], bodyColor = '#d6d2c7', trimColor = '#8b8a85' }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={position}>
        <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
          <boxGeometry args={[5.5, 1.8, 2.6]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh castShadow position={[0, 1.7, 0]}>
          <boxGeometry args={[5.9, 0.25, 2.9]} />
          <meshStandardMaterial color={trimColor} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, -0.45, 0]}>
          <boxGeometry args={[5.1, 0.2, 2.2]} />
          <meshStandardMaterial color="#7d6f67" />
        </mesh>
        <mesh castShadow position={[0, 0.2, 1.34]}>
          <boxGeometry args={[1, 1.1, 0.12]} />
          <meshStandardMaterial color="#8b5a3c" />
        </mesh>
        <mesh castShadow position={[1.9, 0.75, 1.33]}>
          <boxGeometry args={[1.2, 0.6, 0.1]} />
          <meshStandardMaterial color="#9fd4f2" metalness={0.1} roughness={0.05} />
        </mesh>
        <mesh castShadow position={[-1.9, 0.75, 1.33]}>
          <boxGeometry args={[1.2, 0.6, 0.1]} />
          <meshStandardMaterial color="#9fd4f2" metalness={0.1} roughness={0.05} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, -0.12, 1.8]}>
          <boxGeometry args={[1.5, 0.22, 1]} />
          <meshStandardMaterial color={'#9c7044'} />
        </mesh>
        <mesh castShadow position={[-2.1, 0, -1.4]}>
          <cylinderGeometry args={[0.32, 0.32, 0.45, 18]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh castShadow position={[2.1, 0, -1.4]}>
          <cylinderGeometry args={[0.32, 0.32, 0.45, 18]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh castShadow position={[-2.1, 0, 1.4]}>
          <cylinderGeometry args={[0.32, 0.32, 0.45, 18]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh castShadow position={[2.1, 0, 1.4]}>
          <cylinderGeometry args={[0.32, 0.32, 0.45, 18]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    </RigidBody>
  )
}

function GuitarProp({ position, rotation = [0, 0, 0], scale = 1 }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={position} rotation={rotation} scale={scale}>
        <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.7, 16, 16]} />
          <meshStandardMaterial color="#a0522d" />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 1.85, 0]}>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshStandardMaterial color="#b5651d" />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 3.25, 0]}>
          <boxGeometry args={[0.25, 2.4, 0.22]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
      </group>
    </RigidBody>
  )
}


function PCBSection() {
  const traceLines = useMemo(() => {
    const lines = []
    for (let i = 0; i < 36; i += 1) {
      lines.push({
        id: `h-trace-${i}`,
        position: [-236 + (i % 9) * 10.5, -0.46, -80 + Math.floor(i / 9) * 14],
        size: [8.6, 0.06, 0.8]
      })
      lines.push({
        id: `v-trace-${i}`,
        position: [-240 + (i % 9) * 10.5, -0.46, -74 + Math.floor(i / 9) * 14],
        size: [0.8, 0.06, 8.6]
      })
    }
    for (let i = 0; i < 20; i += 1) {
      lines.push({
        id: `diag-${i}`,
        position: [-232 + (i % 5) * 18, -0.46, -76 + Math.floor(i / 5) * 16],
        size: [6, 0.06, 0.7],
        rotation: [0, Math.PI * 0.25, 0]
      })
    }
    return lines
  }, [])

  const components = useMemo(() => {
    const chips = []
    for (let i = 0; i < 30; i += 1) {
      chips.push({
        id: `chip-${i}`,
        position: [-230 + (i % 6) * 14, 0.2, -78 + Math.floor(i / 6) * 15],
        scale: 0.7 + (i % 4) * 0.18,
        rot: ((i * 35) % 360) * (Math.PI / 180)
      })
    }
    return chips
  }, [])

  const vias = useMemo(() => {
    const points = []
    for (let i = 0; i < 70; i += 1) {
      points.push({
        id: `via-${i}`,
        position: [-243 + (i % 14) * 7, -0.43, -84 + Math.floor(i / 14) * 13]
      })
    }
    return points
  }, [])

  const resistors = useMemo(() => (
    Array.from({ length: 18 }, (_, i) => ({
      id: `resistor-${i}`,
      position: [-238 + (i % 6) * 15.5, 0.2, -81 + Math.floor(i / 6) * 20],
      rotation: [0, (i % 2 === 0 ? Math.PI * 0.5 : 0), 0]
    }))
  ), [])

  const capacitorTowers = useMemo(() => (
    [
      { id: 'cap-1', position: [-230, 0, -82], height: 9 },
      { id: 'cap-2', position: [-182, 0, -80], height: 11 },
      { id: 'cap-3', position: [-158, 0, -38], height: 8 },
      { id: 'cap-4', position: [-218, 0, -18], height: 12 },
      { id: 'cap-5', position: [-176, 0, -4], height: 10 }
    ]
  ), [])

  return (
    <>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-196, -0.52, -40]} receiveShadow>
          <boxGeometry args={[110, 0.1, 110]} />
          <meshStandardMaterial color="#0d6b43" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-196, -0.5, -40]} receiveShadow>
          <boxGeometry args={[104, 0.11, 104]} />
          <meshStandardMaterial color="#0a5736" />
        </mesh>
      </RigidBody>

      {traceLines.map((trace) => (
        <RigidBody key={trace.id} type="fixed" colliders="cuboid">
          <mesh position={trace.position} rotation={trace.rotation || [0, 0, 0]} receiveShadow>
            <boxGeometry args={trace.size} />
            <meshStandardMaterial color="#d9af41" emissive="#7f5f00" emissiveIntensity={0.3} />
          </mesh>
        </RigidBody>
      ))}

      {vias.map((via) => (
        <RigidBody key={via.id} type="fixed" colliders="ball">
          <mesh position={via.position} receiveShadow>
            <cylinderGeometry args={[0.44, 0.44, 0.18, 14]} />
            <meshStandardMaterial color="#d7b56d" emissive="#5f4307" emissiveIntensity={0.2} />
          </mesh>
        </RigidBody>
      ))}

      {components.map((chip) => (
        <RigidBody key={chip.id} type="fixed" colliders="cuboid">
          <group position={chip.position} rotation={[0, chip.rot, 0]} scale={chip.scale}>
            <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
              <boxGeometry args={[5, 2.4, 5]} />
              <meshStandardMaterial color="#1c1f26" />
            </mesh>
            <mesh castShadow position={[0, 2.45, 0]}>
              <boxGeometry args={[4.1, 0.18, 4.1]} />
              <meshStandardMaterial color="#2f3745" />
            </mesh>
            {[-2.2, -1.4, -0.6, 0.2, 1, 1.8].map((pinX) => (
              <mesh key={`pin-front-${pinX}`} castShadow position={[pinX, 0.38, 2.65]}>
                <boxGeometry args={[0.35, 0.22, 0.9]} />
                <meshStandardMaterial color="#c4c9cf" />
              </mesh>
            ))}
            {[-2.2, -1.4, -0.6, 0.2, 1, 1.8].map((pinX) => (
              <mesh key={`pin-back-${pinX}`} castShadow position={[pinX, 0.38, -2.65]}>
                <boxGeometry args={[0.35, 0.22, 0.9]} />
                <meshStandardMaterial color="#c4c9cf" />
              </mesh>
            ))}
          </group>
        </RigidBody>
      ))}

      {capacitorTowers.map((tower) => (
        <RigidBody key={tower.id} type="fixed" colliders="cuboid">
          <group position={tower.position}>
            <mesh castShadow receiveShadow position={[0, tower.height * 0.5, 0]}>
              <cylinderGeometry args={[1.6, 1.9, tower.height, 20]} />
              <meshStandardMaterial color="#1a3f74" />
            </mesh>
            <mesh castShadow position={[0, tower.height + 0.35, 0]}>
              <cylinderGeometry args={[1.45, 1.45, 0.5, 20]} />
              <meshStandardMaterial color="#84d3ff" emissive="#2b88aa" emissiveIntensity={0.4} />
            </mesh>
          </group>
        </RigidBody>
      ))}

      {resistors.map((resistor) => (
        <RigidBody key={resistor.id} type="fixed" colliders="cuboid">
          <group position={resistor.position} rotation={resistor.rotation}>
            <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
              <boxGeometry args={[2.7, 0.55, 1.1]} />
              <meshStandardMaterial color="#c7c1ad" />
            </mesh>
            <mesh castShadow position={[-1.65, 0.26, 0]}>
              <boxGeometry args={[0.95, 0.18, 0.3]} />
              <meshStandardMaterial color="#bbb" />
            </mesh>
            <mesh castShadow position={[1.65, 0.26, 0]}>
              <boxGeometry args={[0.95, 0.18, 0.3]} />
              <meshStandardMaterial color="#bbb" />
            </mesh>
          </group>
        </RigidBody>
      ))}

      {Array.from({ length: 24 }, (_, i) => ({
        id: `micro-led-${i}`,
        position: [-241 + (i % 8) * 12.7, 0.18, -86 + Math.floor(i / 8) * 18]
      })).map((led) => (
        <RigidBody key={led.id} type="fixed" colliders="cuboid">
          <group position={led.position}>
            <mesh castShadow receiveShadow position={[0, 0.32, 0]}>
              <boxGeometry args={[1.35, 0.42, 1.35]} />
              <meshStandardMaterial color="#2a2f39" />
            </mesh>
            <mesh castShadow position={[0, 0.64, 0]}>
              <boxGeometry args={[0.65, 0.2, 0.65]} />
              <meshStandardMaterial color="#8ff9ff" emissive="#48c4d4" emissiveIntensity={0.75} />
            </mesh>
          </group>
        </RigidBody>
      ))}

      {Array.from({ length: 12 }, (_, i) => ({
        id: `coil-${i}`,
        position: [-236 + (i % 6) * 16.8, 0.15, -12 + Math.floor(i / 6) * 20],
        rot: i % 2 === 0 ? 0 : Math.PI * 0.5
      })).map((coil) => (
        <RigidBody key={coil.id} type="fixed" colliders="cuboid">
          <group position={coil.position} rotation={[0, coil.rot, 0]}>
            <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
              <boxGeometry args={[4.2, 1, 2.1]} />
              <meshStandardMaterial color="#232833" />
            </mesh>
            {[-1.25, -0.42, 0.42, 1.25].map((windX) => (
              <mesh key={`${coil.id}-wind-${windX}`} castShadow position={[windX, 0.7, 0]}>
                <torusGeometry args={[0.24, 0.08, 10, 24]} />
                <meshStandardMaterial color="#cf8f23" emissive="#7a4700" emissiveIntensity={0.28} />
              </mesh>
            ))}
          </group>
        </RigidBody>
      ))}
    </>
  )
}

function TownLayout() {
  const trailerRows = useMemo(() => {
    const rows = []
    const xSlots = [-66, -54, -42, -30, -18, -6, 6, 18, 30, 42, 54, 66]
    const zSlots = [-56, -44, -32, -20, -8, 4, 16, 28, 40]
    const colors = ['#d8c9b8', '#cfd6dc', '#e2d9c5', '#d7d2d2', '#c8d4c2', '#ddd0b8', '#d4d9e2', '#cfc8ba']

    zSlots.forEach((z, zIndex) => {
      xSlots.forEach((x, xIndex) => {
        rows.push({
          x,
          z,
          color: colors[(xIndex + zIndex) % colors.length],
          trim: (xIndex + zIndex) % 2 === 0 ? '#8d9098' : '#7d8b6f'
        })
      })
    })

    return rows
  }, [])

  const frontHouseBikes = useMemo(() => {
    const bikes = []
    trailerRows.forEach((home, index) => {
      bikes.push({
        id: `front-bike-${index}`,
        position: [home.x + 1.9, -0.32, home.z + 2.2],
        rotation: [0, -Math.PI / 2, 0],
        scale: 0.65 + (index % 6) * 0.15
      })
    })
    return bikes
  }, [trailerRows])

  const frogTree = useMemo(() => {
    const frogs = []
    for (let i = 0; i < 34; i += 1) {
      frogs.push({
        id: `trunk-frog-${i}`,
        position: [102 + (i % 2) * 0.8, -0.42 + Math.floor(i / 2) * 0.75, -12 + (i % 3) * 0.5],
        rotation: [0, ((i * 47) % 360) * (Math.PI / 180), 0],
        scale: 0.42
      })
    }
    for (let i = 0; i < 72; i += 1) {
      const radius = 4 + (i % 5) * 0.9
      const angle = (i / 72) * Math.PI * 2
      const height = 13 + (i % 4) * 0.8
      frogs.push({
        id: `canopy-frog-${i}`,
        position: [
          102 + Math.cos(angle) * radius,
          height,
          -12 + Math.sin(angle) * radius
        ],
        rotation: [0, angle, 0],
        scale: 0.44 + (i % 3) * 0.08
      })
    }
    return frogs
  }, [])

  const mapBikes = useMemo(() => (
    [
      { id: 'map-bike-1', position: [118, -0.3, -30], rotation: [0, 1.3, 0], scale: 1.4 },
      { id: 'map-bike-2', position: [132, -0.3, -4], rotation: [0, 0.5, 0], scale: 1.1 },
      { id: 'map-bike-3', position: [86, -0.3, 30], rotation: [0, -1.1, 0], scale: 1.8 },
      { id: 'map-bike-4', position: [148, -0.3, 18], rotation: [0, 2.1, 0], scale: 1.3 }
    ]
  ), [])

  const mapGuitars = useMemo(() => (
    [
      { id: 'guitar-1', position: [126, -0.4, -20], rotation: [0, 0.2, 0], scale: 1.4 },
      { id: 'guitar-2', position: [138, -0.4, 6], rotation: [0, -0.9, 0], scale: 1.1 },
      { id: 'guitar-3', position: [92, -0.4, 22], rotation: [0, 1.1, 0], scale: 1.6 },
      { id: 'guitar-4', position: [154, -0.4, -8], rotation: [0, 2.5, 0], scale: 1.2 }
    ]
  ), [])

  const stairSteps = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: `step-${i}`,
    position: [46 + i * 4.5, -0.3 + i * 2.45, -60],
    width: 2.8,
    height: 0.9,
    depth: 5.8
  })), [])

  const staircaseLanding = useMemo(() => ([
    { id: 'landing-1', position: [109, 33.7, -60], size: [9, 1.2, 7] },
    { id: 'landing-2', position: [116, 35.6, -60], size: [9, 1.2, 7] },
    { id: 'landing-3', position: [123, 37.2, -60], size: [10, 1.2, 7] }
  ]), [])

  const edgeGiants = useMemo(() => (
    [
      { id: 'giant-1', position: [-86, -0.5, -78], height: 30, color: '#1b1725', lean: 0.15 },
      { id: 'giant-2', position: [90, -0.5, -80], height: 34, color: '#211327', lean: -0.2 },
      { id: 'giant-3', position: [96, -0.5, 82], height: 28, color: '#2a1c30', lean: 0.1 },
      { id: 'giant-4', position: [-94, -0.5, 80], height: 36, color: '#171226', lean: -0.15 }
    ]
  ), [])

  const skyWingBikes = useMemo(() => (
    [
      { id: 'sky-bike-1', center: [0, 30, -6], radius: 120, speed: 0.14, phase: 0.2, altitudeWave: 4.2, scale: 0.72 },
      { id: 'sky-bike-2', center: [10, 36, 8], radius: 96, speed: 0.18, phase: Math.PI, altitudeWave: 3.5, scale: 0.66 }
    ]
  ), [])

  return (
    <>
      <RigidBody type="fixed" friction={1}>
        <mesh position={[0, -1, 0]} receiveShadow>
          <boxGeometry args={[520, 1, 420]} />
          <meshStandardMaterial color="#5f9d5f" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.48, -48]} receiveShadow>
          <boxGeometry args={[170, 0.08, 10]} />
          <meshStandardMaterial color="#4f5259" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.48, -24]} receiveShadow>
          <boxGeometry args={[170, 0.08, 10]} />
          <meshStandardMaterial color="#565a62" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.48, 0]} receiveShadow>
          <boxGeometry args={[170, 0.08, 10]} />
          <meshStandardMaterial color="#5c6068" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.48, 24]} receiveShadow>
          <boxGeometry args={[170, 0.08, 10]} />
          <meshStandardMaterial color="#52565d" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.48, 48]} receiveShadow>
          <boxGeometry args={[170, 0.08, 10]} />
          <meshStandardMaterial color="#4e5259" />
        </mesh>
      </RigidBody>

      {trailerRows.map((trailer) => (
        <TrailerHome
          key={`${trailer.x}-${trailer.z}`}
          position={[trailer.x, -0.35, trailer.z]}
          bodyColor={trailer.color}
          trimColor={trailer.trim}
        />
      ))}

      {[-70, -50, -30, -10, 10, 30, 50, 70].map((x) => (
        <group key={`lamp-${x}`} position={[x, -0.45, 0]}>
          <mesh castShadow position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 3.2, 10]} />
            <meshStandardMaterial color="#414141" />
          </mesh>
          <mesh castShadow position={[0, 3.25, 0]}>
            <sphereGeometry args={[0.26, 12, 12]} />
            <meshStandardMaterial color="#ffe59a" emissive="#ffb22f" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}

      {stairSteps.map((step) => (
        <RigidBody key={step.id} type="fixed" colliders="cuboid">
          <mesh position={step.position} castShadow receiveShadow>
            <boxGeometry args={[step.width, step.height, step.depth]} />
            <meshStandardMaterial color="#c9ccd1" />
          </mesh>
        </RigidBody>
      ))}

      {staircaseLanding.map((platform) => (
        <RigidBody key={platform.id} type="fixed" colliders="cuboid">
          <mesh position={platform.position} castShadow receiveShadow>
            <boxGeometry args={platform.size} />
            <meshStandardMaterial color="#d7dbe2" />
          </mesh>
        </RigidBody>
      ))}

      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[126, 37, -60]} castShadow receiveShadow>
          <boxGeometry args={[40, 2, 20]} />
          <meshStandardMaterial color="#f8f4ff" emissive="#cfc7ff" emissiveIntensity={0.4} />
        </mesh>
      </RigidBody>
      {[98, 112, 126, 140, 154].map((x) => (
        <RigidBody key={`kingdom-tower-${x}`} type="fixed" colliders="cuboid">
          <mesh position={[x, 40, -60]} castShadow>
            <cylinderGeometry args={[1.5, 1.8, 8, 16]} />
            <meshStandardMaterial color="#fff7cc" emissive="#ffe8a3" emissiveIntensity={0.35} />
          </mesh>
        </RigidBody>
      ))}

      {frontHouseBikes.map((bike) => (
        <PropBicycle
          key={bike.id}
          position={bike.position}
          rotation={bike.rotation}
          scale={bike.scale}
        />
      ))}

      {mapBikes.map((bike) => (
        <PropBicycle
          key={bike.id}
          position={bike.position}
          rotation={bike.rotation}
          scale={bike.scale}
        />
      ))}

      {mapGuitars.map((guitar) => (
        <GuitarProp
          key={guitar.id}
          position={guitar.position}
          rotation={guitar.rotation}
          scale={guitar.scale}
        />
      ))}

      <PCBSection />

      {frogTree.map((frog) => (
        <PropFrog
          key={frog.id}
          position={frog.position}
          rotation={frog.rotation}
          scale={frog.scale}
        />
      ))}

      {edgeGiants.map((giant) => (
        <RigidBody key={giant.id} type="fixed" colliders="cuboid">
          <group position={giant.position} rotation={[0, giant.lean, 0]}>
            <mesh castShadow receiveShadow position={[0, giant.height * 0.52, 0]}>
              <cylinderGeometry args={[2.1, 2.8, giant.height, 14]} />
              <meshStandardMaterial color={giant.color} roughness={0.9} metalness={0.1} />
            </mesh>
            <mesh castShadow position={[0, giant.height + 3.4, 0.5]}>
              <sphereGeometry args={[4.4, 16, 16]} />
              <meshStandardMaterial color="#2e2137" emissive="#3d224f" emissiveIntensity={0.32} />
            </mesh>
            <mesh castShadow position={[-2.1, giant.height + 3.8, 3.2]}>
              <sphereGeometry args={[1, 12, 12]} />
              <meshStandardMaterial color="#dc3b48" emissive="#aa1623" emissiveIntensity={0.6} />
            </mesh>
            <mesh castShadow position={[2.1, giant.height + 3.8, 3.2]}>
              <sphereGeometry args={[1, 12, 12]} />
              <meshStandardMaterial color="#dc3b48" emissive="#aa1623" emissiveIntensity={0.6} />
            </mesh>
          </group>
        </RigidBody>
      ))}

      {skyWingBikes.map((bike) => (
        <FlyingWingBike
          key={bike.id}
          center={bike.center}
          radius={bike.radius}
          speed={bike.speed}
          phase={bike.phase}
          altitudeWave={bike.altitudeWave}
          scale={bike.scale}
        />
      ))}
    </>
  )
}

export default function Experience({ activeCharacter, onFallStateChange }) {
  const { camera } = useThree()
  const isFallingRef = useRef(false)

  useFrame(() => {
    const falling = camera.position.y < -8
    if (falling !== isFallingRef.current) {
      isFallingRef.current = falling
      onFallStateChange?.(falling)
    }
  })

  const characterStats = useMemo(() => {
    if (activeCharacter === 'bike') {
      return {
        speed: 15, jump: 2, scale: 1,
        radius: 0.3, height: 0.3
      }
    }
    if (activeCharacter === 'rolly') {
      return {
        speed: 20, jump: 10, scale: 0.8,
        radius: 1.2, height: 0
      }
    }
    return {
      speed: 6, jump: 10, scale: 0.5,
      radius: 0.3, height: 0.3
    }
  }, [activeCharacter])

  return (
    <>
      <Ecctrl
        camInitDis={-6}
        camMaxDis={-7}
        maxVelLimit={characterStats.speed}
        jumpVel={characterStats.jump}
        camTargetPos={{ x: 0, y: 1.2, z: 0 }}
        capsuleRadius={characterStats.radius}
        capsuleHalfHeight={characterStats.height}
      >
        <group rotation-y={Math.PI} position={[0, -0.5, 0]}>
          {(activeCharacter === 'bike' || activeCharacter === 'rolly')
            ? <Bicycle />
            : <Frog />}
        </group>
      </Ecctrl>

      <TownLayout />
    </>
  )
}

useGLTF.preload('./frog.glb')
useGLTF.preload('./bicycle.glb')
