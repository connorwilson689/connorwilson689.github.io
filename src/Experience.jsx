import { RigidBody } from '@react-three/rapier';
import Ecctrl from 'ecctrl';
import { useKeyboardControls, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
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

function TrailerHome({ position = [0, 0, 0], bodyColor = '#d6d2c7', trimColor = '#8b8a85' }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={position}>
        <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
          <boxGeometry args={[2.8, 1.1, 1.2]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh castShadow position={[0, 1, 0]}>
          <boxGeometry args={[3.1, 0.18, 1.45]} />
          <meshStandardMaterial color={trimColor} />
        </mesh>
        <mesh castShadow position={[0, -0.2, 0.8]}>
          <boxGeometry args={[0.8, 0.3, 0.45]} />
          <meshStandardMaterial color={'#9c7044'} />
        </mesh>
      </group>
    </RigidBody>
  )
}

function TownLayout() {
  const trailerRows = [
    { x: -11, z: -8, color: '#d8c9b8' },
    { x: -7, z: -8, color: '#cfd6dc' },
    { x: -3, z: -8, color: '#e2d9c5' },
    { x: 3, z: -8, color: '#d7d2d2' },
    { x: 7, z: -8, color: '#c8d4c2' },
    { x: 11, z: -8, color: '#ddd0b8' },
    { x: -11, z: 8, color: '#d4d9e2' },
    { x: -7, z: 8, color: '#cfc8ba' },
    { x: -3, z: 8, color: '#d9d0d0' },
    { x: 3, z: 8, color: '#d5d8c8' },
    { x: 7, z: 8, color: '#ded5c9' },
    { x: 11, z: 8, color: '#c5d2d8' },
  ]

  const lampPosts = [-12, -6, 0, 6, 12]

  return (
    <>
      <RigidBody type="fixed" friction={1}>
        <mesh position={[0, -1, 0]} receiveShadow>
          <boxGeometry args={[60, 1, 60]} />
          <meshStandardMaterial color="#78a85f" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.48, 0]} receiveShadow>
          <boxGeometry args={[44, 0.05, 6]} />
          <meshStandardMaterial color="#4f5259" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-15.5, -0.46, 0]} receiveShadow>
          <boxGeometry args={[5, 0.08, 26]} />
          <meshStandardMaterial color="#5b5f67" />
        </mesh>
      </RigidBody>

      {trailerRows.map((trailer, index) => (
        <TrailerHome
          key={`${trailer.x}-${trailer.z}`}
          position={[trailer.x, -0.45, trailer.z]}
          bodyColor={trailer.color}
          trimColor={index % 2 === 0 ? '#8d9098' : '#7d8b6f'}
        />
      ))}

      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[15.5, -0.35, -6]}>
          <boxGeometry args={[6, 1.4, 6]} />
          <meshStandardMaterial color="#9f734b" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[15.5, 0.75, -6]}>
          <coneGeometry args={[4.6, 2.4, 4]} />
          <meshStandardMaterial color="#5f3f2a" />
        </mesh>
      </RigidBody>

      {lampPosts.map((x) => (
        <group key={`lamp-${x}`} position={[x, -0.45, 0]}>
          <mesh castShadow position={[0, 1.25, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 2.5, 8]} />
            <meshStandardMaterial color="#444" />
          </mesh>
          <mesh castShadow position={[0, 2.6, 0]}>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshStandardMaterial color="#ffd68a" emissive="#ac7d1f" emissiveIntensity={0.35} />
          </mesh>
        </group>
      ))}

      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-15.5, -0.18, -13]} receiveShadow>
          <boxGeometry args={[5.4, 0.22, 0.4]} />
          <meshStandardMaterial color="#f2f2f2" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-15.5, -0.18, 13]} receiveShadow>
          <boxGeometry args={[5.4, 0.22, 0.4]} />
          <meshStandardMaterial color="#f2f2f2" />
        </mesh>
      </RigidBody>
    </>
  )
}

export default function Experience({ activeCharacter }) {
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
        camInitDis={-5}
        camMaxDis={-5}
        maxVelLimit={characterStats.speed}
        jumpVel={characterStats.jump}
        camTargetPos={{ x: 0, y: 1, z: 0 }}
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
