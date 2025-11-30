import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { CustomGalaxy, GalaxyConfig } from './components/CustomGalaxy';
import { InfoPanel } from './components/InfoPanel';

// --- Galaxy Data ---
const GALAXIES: { id: string; name: string; config: GalaxyConfig }[] = [
    {
        id: 'milky-way',
        name: 'Milky Way',
        config: {
            colors: { inside: '#ff8866', outside: '#1b3984' },
            structure: { branches: 3, spin: 1, randomness: 0.2, randomnessPower: 3 }
        }
    },
    {
        id: 'andromeda',
        name: 'Andromeda',
        config: {
            colors: { inside: '#dca3ff', outside: '#4c1d95' }, // Purple/Pink
            structure: { branches: 5, spin: 1.5, randomness: 0.4, randomnessPower: 2 }
        }
    },
    {
        id: 'the-eye',
        name: 'The Eye',
        config: {
            colors: { inside: '#000000', outside: '#0ea5e9' }, // Black center, Blue ring
            structure: {
                branches: 0,
                spin: 0.5,
                randomness: 0.1,
                randomnessPower: 3,
                radiusMin: 15, // Ring shape
                radiusPower: 0.5
            }
        }
    },
    {
        id: 'chaos-cloud',
        name: 'Chaos Cloud',
        config: {
            colors: { inside: '#f59e0b', outside: '#ef4444' }, // Orange/Red
            structure: {
                branches: 0,
                spin: 0.2,
                randomness: 2.0, // High chaos
                randomnessPower: 1
            }
        }
    },
    {
        id: 'cyber-prime',
        name: 'Cyber Prime',
        config: {
            colors: { inside: '#22d3ee', outside: '#e879f9' }, // Cyan/Magenta
            structure: {
                branches: 8,
                spin: 3, // Tight spiral
                randomness: 0.05, // Very structured
                randomnessPower: 5
            }
        }
    },
    {
        id: 'crimson-void',
        name: 'Crimson Void',
        config: {
            colors: { inside: '#7f1d1d', outside: '#000000' }, // Dark Red/Black
            structure: {
                branches: 4,
                spin: 0.5,
                randomness: 0.8,
                randomnessPower: 2
            }
        }
    }
];

// --- Warp Effect Component ---
const WarpEffect: React.FC<{ isWarping: boolean }> = ({ isWarping }) => {
    const starsRef = useRef<THREE.Points>(null);

    useFrame((state) => {
        if (starsRef.current) {
            if (isWarping) {
                // Stretch stars
                starsRef.current.scale.z = THREE.MathUtils.lerp(starsRef.current.scale.z, 20, 0.05);
                const camera = state.camera as THREE.PerspectiveCamera;
                camera.fov = THREE.MathUtils.lerp(camera.fov, 100, 0.05);
                camera.updateProjectionMatrix();
            } else {
                // Return to normal
                starsRef.current.scale.z = THREE.MathUtils.lerp(starsRef.current.scale.z, 1, 0.05);
                const camera = state.camera as THREE.PerspectiveCamera;
                camera.fov = THREE.MathUtils.lerp(camera.fov, 40, 0.05);
                camera.updateProjectionMatrix();
            }
            // Always move stars forward to simulate travel
            starsRef.current.position.z += isWarping ? 2 : 0.05;
            if (starsRef.current.position.z > 50) starsRef.current.position.z = -50;
        }
    });

    return (
        <Stars
            ref={starsRef}
            radius={100}
            depth={50}
            count={7000}
            factor={4}
            saturation={0}
            fade
            speed={0} // Handled manually
        />
    );
};

const CosmosPage: React.FC = () => {
    const [currentGalaxyIndex, setCurrentGalaxyIndex] = useState(0);
    const [isWarping, setIsWarping] = useState(false);
    const [targetGalaxyIndex, setTargetGalaxyIndex] = useState(0);

    const handleTravel = (index: number) => {
        if (index === currentGalaxyIndex || isWarping) return;

        setTargetGalaxyIndex(index);
        setIsWarping(true);

        // Warp Sequence
        setTimeout(() => {
            setCurrentGalaxyIndex(index);
            // Wait a bit more before stopping warp to simulate arrival
            setTimeout(() => {
                setIsWarping(false);
            }, 1000);
        }, 2000); // 2 seconds of warp travel
    };

    return (
        <div className="w-full h-full bg-[#020203] relative overflow-hidden">
            <Canvas camera={{ position: [0, 25, 45], fov: 40 }}>
                <color attach="background" args={['#000000']} />

                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={10}
                    maxDistance={100}
                    autoRotate={!isWarping}
                    autoRotateSpeed={0.5}
                />

                <WarpEffect isWarping={isWarping} />

                {/* Hide galaxy during peak warp for smoother transition effect */}
                <group visible={!isWarping}>
                    <CustomGalaxy config={GALAXIES[currentGalaxyIndex].config} />
                </group>

                <ambientLight intensity={0.2} />
                <pointLight position={[0, 0, 0]} intensity={2} distance={30} color="#ffccaa" />
            </Canvas>

            {/* Vignette Effect */}
            <div className={`absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-10 transition-opacity duration-500 ${isWarping ? 'opacity-50' : 'opacity-100'}`}></div>

            {/* Warp Speed Overlay (Motion Blur Lines) */}
            {isWarping && (
                <div className="absolute inset-0 pointer-events-none z-20 bg-white/5 mix-blend-overlay animate-pulse"></div>
            )}

            {/* UI Overlay */}
            <InfoPanel
                currentGalaxy={GALAXIES[currentGalaxyIndex]}
                galaxies={GALAXIES}
                onTravel={handleTravel}
                isWarping={isWarping}
            />
        </div>
    );
};

export default CosmosPage;
