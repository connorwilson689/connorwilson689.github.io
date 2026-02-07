import { RigidBody } from '@react-three/rapier';
import Ecctrl from 'ecctrl';
import { useKeyboardControls, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber' // Needed for animation loop
import * as THREE from 'three' // Needed for math
import { useThree } from '@react-three/fiber'
import { useRef, useEffect, useMemo } from 'react' // <--- Add useMemo here


function Frog() {
  const { nodes, materials } = useGLTF('./frog.glb')
  const [, get] = useKeyboardControls()
  const jawRef = useRef()

  useFrame((state, delta) => {
    const { forward, backward, left, right, leftward, rightward } = get()
    
    // Check all movement keys
    if (forward || backward || left || right || leftward || rightward) {
        if (jawRef.current) {
            // FIX: Math.abs() makes negative numbers positive.
            // Result: The jaw bounces from 0 to 0.4, never going "up" into the head.
            const flapSpeed = 20
            const maxOpenAmount = 0.4 // Lower this if it opens too wide
            
            jawRef.current.rotation.x = Math.abs(Math.sin(state.clock.elapsedTime * flapSpeed)) * maxOpenAmount
        }
    } else {
        // Reset to perfectly closed (0) when stopped
        if (jawRef.current) jawRef.current.rotation.x = 0
    }
  })

  return (
    <group dispose={null}>
      {/* BODY */}
      <mesh 
        geometry={nodes.Body.geometry} 
        position={nodes.Body.position} 
        rotation={nodes.Body.rotation}
        material={materials.GreenMaterial || new THREE.MeshStandardMaterial({color: 'green'})} 
      />
      
      {/* JAW */}
      <mesh 
        ref={jawRef}
        geometry={nodes.Jaw.geometry} 
        position={nodes.Jaw.position} 
        rotation={nodes.Jaw.rotation} 
        material={materials.GreenMaterial || new THREE.MeshStandardMaterial({color: 'green'})} 
      />
    </group>
  )
}


// function Bicycle() {
//   const { nodes, materials } = useGLTF('./bicycle.glb')
//   // Note: Check your specific node names in the console! 
//   // If your bike is one piece, just use nodes.Bicycle or similar.
//   // Below assumes separate parts like we discussed.

//   // console.log("My Bike Parts:", nodes)
//   console.log("My Materials:", materials) // <--- Check this in the browser console!
  
//   const frontWheelRef = useRef()
//   const backWheelRef = useRef()

//   // useFrame((state, delta) => {
//   //   // Simple rotation animation based on time
//   //   // Later we can link this to actual velocity
//   //   const speed = 10
//   //   if (frontWheelRef.current) frontWheelRef.current.rotation.x -= speed * delta
//   //   if (backWheelRef.current) backWheelRef.current.rotation.x -= speed * delta
//   // })
//   return (
//     <group dispose={null}>
//       {/* The Frame */}
//       {/* Use ['Bracket Notation'] for names with dashes/spaces */}
//       <mesh 
//         geometry={nodes['FullBike_-_Frame-1'].geometry} 
//         material={materials.BikeFrameMat || materials.Material} 
//       />
      
//       {/* The Wheels */}
//       <mesh 
//         ref={frontWheelRef} 
//         geometry={nodes['FullBike_-_Wheel-1'].geometry} 
//         material={materials.BikeTire || materials.Material} 
//       />
      
//       <mesh 
//         ref={backWheelRef} 
//         geometry={nodes['FullBike_-_Wheel-2'].geometry} 
//         material={materials.BikeTire || materials.Material} 
//       />
//     </group>
//   )
// }

function Bicycle() {
  const { nodes, materials } = useGLTF('./bicycle.glb')
  const [, get] = useKeyboardControls()
  
  const frontWheel = useRef()
  const backWheel = useRef()

  useFrame((state, delta) => {
    // 1. Get ALL keys
    const { forward, backward, leftward, rightward } = get()
    
    // 2. Check if ANY key is pressed
    const isMoving = forward || backward || leftward || rightward
    const speed = 15

    if (isMoving) {
      // If moving backward, spin reverse. Otherwise spin forward.
      const direction = backward ? 1 : -1 
      
      if (frontWheel.current) frontWheel.current.rotation.x += speed * direction * delta
      if (backWheel.current) backWheel.current.rotation.x += speed * direction * delta
    }
  })

  return (
    <group dispose={null}>
      
      {/* FRAME */}
      <mesh 
        geometry={nodes['FullBike_-_Frame-1'].geometry} 
        position={nodes['FullBike_-_Frame-1'].position} 
        rotation={nodes['FullBike_-_Frame-1'].rotation}
        material={materials.BikeFrameMat || materials.Material} 
      />
      
      {/* FRONT WHEEL */}
      <mesh 
        ref={frontWheel}
        geometry={nodes['FullBike_-_Wheel-1'].geometry} 
        position={nodes['FullBike_-_Wheel-1'].position} 
        rotation={nodes['FullBike_-_Wheel-1'].rotation}
        material={materials.BikeTire || materials.Material} 
      />
      
      {/* BACK WHEEL */}
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







//the stage where i put the actors etc
export default function Experience({ activeCharacter }) {
  

const characterStats = useMemo(() => {
    if (activeCharacter === 'bike') {
      return { 
        speed: 15, jump: 2, scale: 1, 
        radius: 0.3, height: 0.3
      }
    } 
    else if (activeCharacter === 'rolly') {
      return { 
        speed: 20, jump: 10, scale: 0.8, 
        radius: 1.2, height: 0
      }
    } 
    else { // Frog
      return { 
        speed: 6, jump: 10, scale: 0.5, 
        radius: 0.3, height: 0.3
      }
    }
  }, [activeCharacter])

  return (
    <>
      {/* --- DYNAMIC CHARACTER --- */}
      <Ecctrl 
        // 1. Existing props
        camInitDis={-5} 
        camMaxDis={-5} 
        maxVelLimit={characterStats.speed} 
        jumpVel={characterStats.jump}
        camTargetPos={{ x: 0, y: 1, z: 0 }} 
        
        // 2. NEW: Dynamic Size Props
        capsuleRadius={characterStats.radius}
        capsuleHalfHeight={characterStats.height}
      >
        
        <group rotation-y={Math.PI} position={[0, -0.5, 0]}>
          {/* The Switcher Logic */}
            { (activeCharacter === 'bike' || activeCharacter === 'rolly') 
              ? <Bicycle /> 
              : <Frog />
            }
        </group>

      </Ecctrl>

      {/* --- THE WORLD --- */}
      <RigidBody type="fixed" friction={1}>
        <mesh position={[0, -1, 0]} receiveShadow>
          <boxGeometry args={[50, 1, 50]} />
          <meshStandardMaterial color="lightblue" />
        </mesh>
      </RigidBody>
    </>
  );
}