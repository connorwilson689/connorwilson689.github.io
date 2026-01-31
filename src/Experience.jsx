import { RigidBody } from '@react-three/rapier';
import Ecctrl from 'ecctrl';
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber' // Needed for animation loop
import { useRef } from 'react' // Needed to target the jaw
import * as THREE from 'three' // Needed for math


function Frog() {
  // 1. Load the specific parts (nodes) so we can control them
  const { nodes, materials } = useGLTF('./frog.glb')
  const jawRef = useRef()

  // // 2. The Animation Loop (Runs 60 times/sec)
  // useFrame((state, delta) => {
  //   // A. Calculate Speed
  //   // We check how fast the camera/character is moving
  //   // (In Ecctrl, the character group velocity is tricky to get directly, 
  //   // so we often cheat and check the joystick or effective movement)
    
  //   // Simple "Is Moving?" check:
  //   const isMoving = state.controls?.current?.isMoving || false; // (Requires advanced setup)
    
  //   // EASIER WAY for now: Just flap constantly for testing
  //   // Or simpler: Flap based on time
    
  //   if (jawRef.current) {
  //       // Math.sin creates a wave (-1 to 1). We map it to rotation.
  //       // Speed = 15, Amplitude = 0.2
  //       jawRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 15) * 0.2
  //   }
  // })

  return (
    <group dispose={null}>
      {/* The Body (Static) */}
      <mesh geometry={nodes.Body.geometry} material={materials.GreenMaterial || new THREE.MeshStandardMaterial({color: 'green'})} />
      
      {/* The Jaw (Animated) */}
      <mesh 
        ref={jawRef}
        geometry={nodes.Jaw.geometry} 
        material={materials.GreenMaterial || new THREE.MeshStandardMaterial({color: 'green'})} 
      />
    </group>
  )
}











//the stage where i put the actors etc
export default function Experience() {

  const suvFrog = useGLTF('./FirstBlender.glb')

  return (
    <>
      {/* --- CHARACTER --- */}
      {/* Ecctrl handles all the complex math for walking/jumping */}
      <Ecctrl 
        camInitDis={-5} // Camera distance
        camMaxDis={-5} 
        maxVelLimit={5} // Walking speed
        jumpVel={4}     // Jump height
      >
        {/* This Sphere represents YOU (Connor) for now */}
        {/* <mesh castShadow position={[0, 1, 0]}>
          <sphereGeometry args={[0.5]} />
          <meshStandardMaterial color="salmon" />
        </mesh> */}

        <group rotation-y={Math.PI} position={[0, -0.5, 0]}>
            <Frog />
        </group>


      </Ecctrl>

      {/* --- THE WORLD --- */}
      
      {/* 1. The Floor (Static = it doesn't move) */}
      <RigidBody type="fixed" friction={1}>
        <mesh position={[0, -1, 0]} receiveShadow>
          <boxGeometry args={[50, 1, 50]} />
          <meshStandardMaterial color="lightblue" />
        </mesh>
      </RigidBody>

      {/* 2. A random box to jump on */}
      <RigidBody type="fixed" position={[5, 0.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </RigidBody>

      {/* my car frog first blender thing */}
      <primitive object={suvFrog.scene} position={[2, 0, 2]} scale={0.5} />
    </>
  );
}