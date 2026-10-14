'use client';

import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { PackingResult, BoxPlacement } from '@/types';

const STOP_COLORS: Record<number, string> = {
  1: '#C17B4A',
  2: '#6B8F71',
  3: '#6B8FB8',
  4: '#D4A853',
  5: '#9B59B6',
  6: '#E74C3C',
};

const BOX_PALETTE = [
  '#C17B4A', '#2E8B57', '#3B82F6', '#8B5CF6', '#EC4899',
  '#F59E0B', '#10B981', '#06B6D4', '#6366F1', '#D97706',
  '#14B8A6', '#A855F7', '#EF4444', '#84CC16', '#0EA5E9'
];

function BoxMesh({
  placement,
  scale,
  boxIndex,
  isHovered,
  isSelected,
  onHover,
  onClick,
}: {
  placement: BoxPlacement & { isPrevious?: boolean };
  scale: number;
  boxIndex: number;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onClick: (box: BoxPlacement) => void;
}) {
  const isPrevious = placement.is_previous_job || placement.isPrevious;
  const color = isPrevious
    ? '#486581'
    : BOX_PALETTE[boxIndex % BOX_PALETTE.length] || STOP_COLORS[placement.stop_order] || '#C17B4A';

  const x = (placement.x + placement.length / 2) * scale;
  const y = (placement.y + placement.height / 2) * scale;
  const z = (placement.z + placement.width / 2) * scale;
  const bl = placement.length * scale;
  const bh = placement.height * scale;
  const bw = placement.width * scale;

  const edgesGeometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(bl, bh, bw);
    return new THREE.EdgesGeometry(geo);
  }, [bl, bh, bw]);

  return (
    <group position={[x, y, z]}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(placement.id);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onClick(placement);
        }}
      >
        <boxGeometry args={[bl * 0.98, bh * 0.98, bw * 0.98]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.96 : isHovered ? 0.92 : isPrevious ? 0.65 : 0.85}
          roughness={isPrevious ? 0.4 : 0.25}
          metalness={isPrevious ? 0.05 : 0.15}
          emissive={isSelected ? '#ffffff' : isHovered ? color : isPrevious ? '#102a43' : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : isHovered ? 0.25 : 0.05}
        />
      </mesh>
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial
          color={isSelected ? '#ffffff' : isHovered ? '#ffffff' : isPrevious ? '#829ab1' : '#e0e0e0'}
          transparent
          opacity={isSelected ? 0.95 : isHovered ? 0.8 : isPrevious ? 0.4 : 0.3}
          linewidth={isSelected ? 2 : 1}
        />
      </lineSegments>
    </group>
  );
}

export default function LoadPlanViewer({
  packingData,
  onSelectBox,
}: {
  packingData: PackingResult;
  onSelectBox?: (box: BoxPlacement | null) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedBox, setSelectedBox] = useState<BoxPlacement | null>(null);

  const maxDim = Math.max(
    packingData.truck_dimensions.length,
    packingData.truck_dimensions.width,
    packingData.truck_dimensions.height
  );
  const scale = 10 / (maxDim || 1);
  const tl = packingData.truck_dimensions.length * scale;
  const th = packingData.truck_dimensions.height * scale;
  const tw = packingData.truck_dimensions.width * scale;

  const currentPlacements = useMemo(() => {
    return (packingData.placements || []).map((p, idx) => ({
      ...p,
      isPrevious: false,
      displayIndex: idx + 1,
    }));
  }, [packingData.placements]);

  const previousPlacements = useMemo(() => {
    return (packingData.previous_placements || []).map((p, idx) => ({
      ...p,
      isPrevious: true,
      displayIndex: idx + 1,
    }));
  }, [packingData.previous_placements]);

  const allPlacements = useMemo(() => {
    return [...previousPlacements, ...currentPlacements];
  }, [previousPlacements, currentPlacements]);

  const handleBoxClick = (box: BoxPlacement) => {
    const next = selectedBox?.id === box.id ? null : box;
    setSelectedBox(next);
    if (onSelectBox) onSelectBox(next);
  };

  const activeBox = selectedBox || allPlacements.find((p) => p.id === hoveredId);

  return (
    <div className="relative w-full h-full select-none">
      <Canvas
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
        onPointerMissed={() => {
          setSelectedBox(null);
          if (onSelectBox) onSelectBox(null);
        }}
      >
        <PerspectiveCamera makeDefault position={[tl * 1.5, th * 1.8, tw * 1.5]} fov={50} />
        <OrbitControls enableDamping dampingFactor={0.05} target={[tl / 2, th / 2, tw / 2]} />

        <ambientLight intensity={0.65} />
        <directionalLight position={[tl * 1.5, th * 2.5, tw * 1.5]} intensity={0.9} />
        <directionalLight position={[-tl, th * 1.5, -tw]} intensity={0.35} />
        <directionalLight position={[0, -5, 0]} intensity={0.15} />

        {/* Ground grid */}
        <gridHelper args={[24, 24, '#3a3a5e', '#23233c']} position={[tl / 2, 0, tw / 2]} />

        {/* Truck container outer outline */}
        <mesh position={[tl / 2, th / 2, tw / 2]}>
          <boxGeometry args={[tl, th, tw]} />
          <meshBasicMaterial color="#7a889b" wireframe transparent opacity={0.25} />
        </mesh>

        {/* Truck Bed floor */}
        <mesh position={[tl / 2, 0.005, tw / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[tl, tw]} />
          <meshStandardMaterial color="#1e1e36" roughness={0.8} />
        </mesh>

        {/* Packed cargo boxes (both previous and current job) */}
        {allPlacements.map((p, idx) => (
          <BoxMesh
            key={p.id}
            placement={p}
            scale={scale}
            boxIndex={idx}
            isHovered={hoveredId === p.id}
            isSelected={selectedBox?.id === p.id}
            onHover={setHoveredId}
            onClick={handleBoxClick}
          />
        ))}
      </Canvas>

      {/* Interactive Overlay Info */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-xs text-white space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-amber-300">3D Cargo Load</p>
            {previousPlacements.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-400/30">
                Multi-Job Load
              </span>
            )}
          </div>
          <p className="text-gray-300">
            Truck: {packingData.truck_dimensions.length}×{packingData.truck_dimensions.width}×
            {packingData.truck_dimensions.height} cm
          </p>
          {previousPlacements.length > 0 ? (
            <p className="text-gray-200 text-[11px]">
              📦 <strong className="text-white">{currentPlacements.length}</strong> new boxes · 🚛 <strong className="text-sky-300">{previousPlacements.length}</strong> from previous active jobs
            </p>
          ) : (
            <p className="text-gray-300 text-[11px]">
              📦 {currentPlacements.length} boxes packed
            </p>
          )}
          <p className="text-gray-400 text-[11px]">🖱 Drag to rotate · Scroll to zoom · Click box to inspect</p>
        </div>
      </div>

      {activeBox && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-10 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-white/15 text-xs text-white shadow-xl">
            {activeBox.is_previous_job ? (
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm text-sky-300">{activeBox.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  🚛 Prev Job: {activeBox.job_name || 'Active Cargo'}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm text-amber-400">{activeBox.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Box #{currentPlacements.findIndex((p) => p.id === activeBox.id) + 1} (Current Job)
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-gray-300 mt-2">
              <div>
                Dimensions: <strong className="text-white">{activeBox.length}×{activeBox.width}×{activeBox.height} cm</strong>
              </div>
              <div>
                Position: <strong className="text-white">({activeBox.x}, {activeBox.y}, {activeBox.z})</strong>
              </div>
              {activeBox.fragile && <div className="text-amber-400 font-medium">⚠ Fragile Cargo</div>}
              {activeBox.is_previous_job && (
                <div className="text-sky-300 col-span-2 text-[11px]">
                  Loaded from: {activeBox.job_name}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
