import { RigidBody } from '@react-three/rapier';
import Ecctrl from 'ecctrl';

export default function Experience() {
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
        <mesh castShadow position={[0, 1, 0]}>
          <sphereGeometry args={[0.5]} />
          <meshStandardMaterial color="salmon" />
        </mesh>
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
    </>
  );
}