'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { PackingResult } from '@/types';

const STOP_COLORS: Record<number, string> = {
  1: '#C17B4A', 2: '#6B8F71', 3: '#6B8FB8', 4: '#D4A853', 5: '#9B59B6', 6: '#E74C3C',
};

export default function LoadPlanViewer({ packingData }: { packingData: PackingResult }) {
  const maxDim = Math.max(
    packingData.truck_dimensions.length,
    packingData.truck_dimensions.width,
    packingData.truck_dimensions.height
  );
  const scale = 10 / maxDim;
  const tl = packingData.truck_dimensions.length * scale;
  const th = packingData.truck_dimensions.height * scale;
  const tw = packingData.truck_dimensions.width * scale;

  return (
    <Canvas style={{ width: '100%', height: '100%' }}>
      <PerspectiveCamera makeDefault position={[tl * 1.5, th * 1.8, tw * 1.5]} fov={50} />
      <OrbitControls enableDamping dampingFactor={0.05} target={[tl / 2, th / 2, tw / 2]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />

      {/* Ground */}
      <gridHelper args={[20, 20, '#444466', '#333355']} position={[tl / 2, 0, tw / 2]} />

      {/* Truck wireframe */}
      <mesh position={[tl / 2, th / 2, tw / 2]}>
        <boxGeometry args={[tl, th, tw]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.15} />
      </mesh>

      {/* Floor */}
      <mesh position={[tl / 2, 0.01, tw / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[tl, tw]} />
        <meshStandardMaterial color="#2a2a4a" transparent opacity={0.5} />
      </mesh>

      {/* Packed boxes */}
      {packingData.placements.map((p) => {
        const color = STOP_COLORS[p.stop_order] || '#D4A853';
        const x = (p.x + p.length / 2) * scale;
        const y = (p.y + p.height / 2) * scale;
        const z = (p.z + p.width / 2) * scale;
        const bl = p.length * scale;
        const bh = p.height * scale;
        const bw = p.width * scale;

        const geo = new THREE.BoxGeometry(bl, bh, bw);
        const edgesGeo = new THREE.EdgesGeometry(geo);

        return (
          <group key={p.id} position={[x, y, z]}>
            <mesh>
              <boxGeometry args={[bl * 0.97, bh * 0.97, bw * 0.97]} />
              <meshStandardMaterial color={color} transparent opacity={0.85} roughness={0.3} metalness={0.1} />
            </mesh>
            <lineSegments geometry={edgesGeo}>
              <lineBasicMaterial color="#ffffff" transparent opacity={0.3} />
            </lineSegments>
          </group>
        );
      })}
    </Canvas>
  );
}
