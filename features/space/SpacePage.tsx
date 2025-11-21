import React, { useRef, useMemo, useState, useEffect } from 'react';
// import { Space } from './types'; // Unused in this file, but keeping reference if needed
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Html } from '@react-three/drei';
import { CustomGalaxy } from './components/CustomGalaxy';
import { InfoPanel } from './components/InfoPanel';



const SpacePage: React.FC = () => {
    return (
        <div className="w-full h-full bg-[#050508] relative overflow-hidden">
            <Canvas camera={{ position: [0, 25, 45], fov: 40 }}>
                <color attach="background" args={['#020203']} />

                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={10}
                    maxDistance={100}
                    autoRotate={false}
                    autoRotateSpeed={0.5}
                />

                {/* Background Stars - Subtle depth */}
                <Stars
                    radius={200}
                    depth={50}
                    count={5000}
                    factor={4}
                    saturation={0.8}
                    fade
                    speed={0.5}
                />

                <CustomGalaxy />

                {/* Cinematic Lighting */}
                <ambientLight intensity={0.1} />
                <pointLight position={[0, 0, 0]} intensity={2} distance={30} color="#ffccaa" />

                {/* Volumetric Fog feel via background color gradient (simulated) */}
            </Canvas>

            {/* Elegant UI Overlay */}
            <InfoPanel />

            <div className="absolute top-8 right-8 text-right pointer-events-none select-none">
                <h1 className="text-6xl font-thin tracking-[0.2em] text-white/10 uppercase">
                    Galaxy
                </h1>
            </div>
        </div>
    );
};

export default SpacePage;
