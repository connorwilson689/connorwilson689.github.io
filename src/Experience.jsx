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

function TownLayout() {
  const trailerRows = useMemo(() => {
    const rows = []
    const xSlots = [-26, -18, -10, -2, 6, 14, 22, 30]
    const zSlots = [-22, -10, 2, 14, 26]
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

  const decorativeObjects = useMemo(() => {
    const objects = []
    for (let i = 0; i < 240; i += 1) {
      const x = -38 + (i * 17.73) % 78
      const z = -34 + (i * 31.41) % 72
      const size = 0.2 + (i % 7) * 0.08
      objects.push({
        x,
        z,
        size,
        type: i % 4,
        hue: i % 9
      })
    }
    return objects
  }, [])

  const parkedBikes = useMemo(() => {
    const bikes = []
    for (let i = 0; i < 80; i += 1) {
      bikes.push({
        id: `bike-${i}`,
        position: [
          -36 + (i * 11.31) % 74,
          -0.3,
          -30 + (i * 19.87) % 64
        ],
        rotation: [0, ((i * 37) % 360) * (Math.PI / 180), 0],
        scale: 0.9 + (i % 5) * 0.12
      })
    }
    return bikes
  }, [])

  const frogGroup = useMemo(() => {
    const frogs = []
    for (let i = 0; i < 90; i += 1) {
      frogs.push({
        id: `frog-${i}`,
        position: [
          -34 + (i * 13.19) % 70,
          -0.45,
          -32 + (i * 23.03) % 66
        ],
        rotation: [0, ((i * 23) % 360) * (Math.PI / 180), 0],
        scale: 0.45 + (i % 4) * 0.1
      })
    }
    return frogs
  }, [])

  return (
    <>
      <RigidBody type="fixed" friction={1}>
        <mesh position={[0, -1, 0]} receiveShadow>
          <boxGeometry args={[180, 1, 180]} />
          <meshStandardMaterial color="#5f9d5f" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.48, 2]} receiveShadow>
          <boxGeometry args={[88, 0.08, 12]} />
          <meshStandardMaterial color="#4f5259" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.48, -18]} receiveShadow>
          <boxGeometry args={[88, 0.08, 10]} />
          <meshStandardMaterial color="#565a62" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.48, 22]} receiveShadow>
          <boxGeometry args={[88, 0.08, 10]} />
          <meshStandardMaterial color="#5c6068" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-38, -0.48, 2]} receiveShadow>
          <boxGeometry args={[10, 0.08, 76]} />
          <meshStandardMaterial color="#4e5259" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[38, -0.48, 2]} receiveShadow>
          <boxGeometry args={[10, 0.08, 76]} />
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

      {[-34, -22, -10, 2, 14, 26, 34].map((x) => (
        <group key={`lamp-${x}`} position={[x, -0.45, 2]}>
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

      {decorativeObjects.map((object, index) => (
        <RigidBody key={`scatter-${index}`} type="fixed" colliders="cuboid">
          <group position={[object.x, -0.4, object.z]}>
            {object.type === 0 && (
              <mesh castShadow receiveShadow position={[0, object.size * 0.5, 0]}>
                <boxGeometry args={[object.size, object.size, object.size]} />
                <meshStandardMaterial color={["#8b5a2b", "#6f4e37", "#7f5539"][object.hue % 3]} />
              </mesh>
            )}
            {object.type === 1 && (
              <mesh castShadow receiveShadow position={[0, object.size, 0]}>
                <cylinderGeometry args={[object.size * 0.5, object.size * 0.7, object.size * 2, 12]} />
                <meshStandardMaterial color={["#2f6b3d", "#3f8443", "#2c5d34"][object.hue % 3]} />
              </mesh>
            )}
            {object.type === 2 && (
              <>
                <mesh castShadow position={[0, object.size * 1.6, 0]}>
                  <coneGeometry args={[object.size, object.size * 2, 8]} />
                  <meshStandardMaterial color="#3b7f42" />
                </mesh>
                <mesh castShadow position={[0, object.size * 0.6, 0]}>
                  <cylinderGeometry args={[object.size * 0.15, object.size * 0.2, object.size * 1.2, 8]} />
                  <meshStandardMaterial color="#6f4e37" />
                </mesh>
              </>
            )}
            {object.type === 3 && (
              <mesh castShadow receiveShadow position={[0, object.size * 0.6, 0]}>
                <sphereGeometry args={[object.size * 0.65, 10, 10]} />
                <meshStandardMaterial color={["#9ca3af", "#7d8590", "#a8b1ba"][object.hue % 3]} />
              </mesh>
            )}
          </group>
        </RigidBody>
      ))}

      {parkedBikes.map((bike) => (
        <PropBicycle
          key={bike.id}
          position={bike.position}
          rotation={bike.rotation}
          scale={bike.scale}
        />
      ))}

      {frogGroup.map((frog) => (
        <PropFrog
          key={frog.id}
          position={frog.position}
          rotation={frog.rotation}
          scale={frog.scale}
        />
      ))}
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
