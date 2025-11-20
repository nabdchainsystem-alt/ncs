import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Info, Sparkles, Zap, Wind } from 'lucide-react';

// --- Shaders ---
// Optimized for deep, rich colors and contrast
const galaxyVertexShader = `
  attribute float scale;
  attribute vec3 customColor;
  varying vec3 vColor;
  varying float vDistance;
  
  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Distance from center for some shader tricks
    vDistance = length(position);
    
    gl_PointSize = scale * (600.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const galaxyFragmentShader = `
  varying vec3 vColor;
  varying float vDistance;
  
  void main() {
    // Circular particle
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Glow calculation - sharper core, softer glow
    float strength = 1.0 - (r * 2.0);
    strength = pow(strength, 4.0); // Sharper falloff for less "bloom"
    
    // Add "sparkle" variation
    float sparkle = 1.0;
    
    vec3 finalColor = vColor;
    
    // Boost brightness at the center of the particle
    finalColor += vec3(0.2) * strength;
    
    gl_FragColor = vec4(finalColor, strength * 0.5); // More transparent for darker look
  }
`;

const CustomGalaxy = () => {
    const pointsRef = useRef<THREE.Points>(null);

    const particleData = useMemo(() => {
        const count = 120000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const scales = new Float32Array(count);

        // "Monochrome / Dark Matter" Palette
        const colorCore = new THREE.Color('#ffffff'); // Pure White Core
        const colorInner = new THREE.Color('#cccccc'); // Silver
        const colorMid = new THREE.Color('#666666');   // Dark Grey
        const colorOuter = new THREE.Color('#1a1a1a'); // Charcoal
        const colorEdge = new THREE.Color('#000000');  // Deep Black

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Structure: Barred Spiral with vertical volume
            const radius = Math.random() * 30;

            // 3 Main Arms
            const branches = 3;
            const spin = 2.5; // Tighter spin

            const branchAngle = (i % branches) * ((Math.PI * 2) / branches);
            const spinAngle = radius * spin * 0.2;

            // Randomness with volume
            // Use power function to concentrate stars in the plane but allow vertical spread
            const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (radius * 0.3 + 1);
            const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (radius * 0.2 + 0.5);
            const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (radius * 0.3 + 1);

            positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

            // Color Logic - Gradient based on radius
            const mixedColor = colorCore.clone();

            if (radius < 5) {
                mixedColor.lerp(colorInner, radius / 5);
            } else if (radius < 12) {
                mixedColor.copy(colorInner).lerp(colorMid, (radius - 5) / 7);
            } else if (radius < 20) {
                mixedColor.copy(colorMid).lerp(colorOuter, (radius - 12) / 8);
            } else {
                mixedColor.copy(colorOuter).lerp(colorEdge, (radius - 20) / 10);
            }

            // Add vibrancy variation
            mixedColor.r += (Math.random() - 0.5) * 0.15;
            mixedColor.g += (Math.random() - 0.5) * 0.15;
            mixedColor.b += (Math.random() - 0.5) * 0.15;

            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;

            // Scale Logic
            scales[i] = Math.random() * 2.0;

            // Occasional "Super Stars"
            if (Math.random() < 0.005) {
                scales[i] *= 4.0;
                colors[i3] += 0.5; // Make them brighter
                colors[i3 + 1] += 0.5;
                colors[i3 + 2] += 0.5;
            }
        }

        return { positions, colors, scales, count };
    }, []);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleData.count}
                    array={particleData.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-customColor"
                    count={particleData.count}
                    array={particleData.colors}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-scale"
                    count={particleData.count}
                    array={particleData.scales}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial
                vertexShader={galaxyVertexShader}
                fragmentShader={galaxyFragmentShader}
                transparent={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

const InfoPanel = () => {
    const [currentFactIndex, setCurrentFactIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const facts = [
        {
            title: "Andromeda-X",
            description: "A rare barred spiral galaxy located in the Deep Field. Known for its vibrant high-energy core and extensive star-forming regions composed of exotic matter.",
            stats: [
                { label: "Star Count", value: "~400 Billion", icon: Sparkles, color: "text-purple-300", bg: "bg-purple-500/20" },
                { label: "Energy Output", value: "Type III Civilization", icon: Zap, color: "text-blue-300", bg: "bg-blue-500/20" },
                { label: "Rotation Speed", value: "220 km/s", icon: Wind, color: "text-pink-300", bg: "bg-pink-500/20" }
            ]
        },
        {
            title: "Milky Way Core",
            description: "The supermassive black hole Sagittarius A* resides here, surrounded by a dense cluster of ancient stars and high-velocity gas clouds orbiting at relativistic speeds.",
            stats: [
                { label: "Mass", value: "4.1 Million Suns", icon: Zap, color: "text-yellow-300", bg: "bg-yellow-500/20" },
                { label: "Diameter", value: "100,000 Light Years", icon: Wind, color: "text-green-300", bg: "bg-green-500/20" },
                { label: "Age", value: "13.6 Billion Years", icon: Sparkles, color: "text-orange-300", bg: "bg-orange-500/20" }
            ]
        },
        {
            title: "Nebula Cluster",
            description: "A stellar nursery where new stars are born from collapsing clouds of dust and hydrogen gas. The vibrant colors indicate different ionized elements like oxygen and sulfur.",
            stats: [
                { label: "Temperature", value: "10,000 K", icon: Zap, color: "text-red-300", bg: "bg-red-500/20" },
                { label: "Span", value: "50 Light Years", icon: Wind, color: "text-cyan-300", bg: "bg-cyan-500/20" },
                { label: "Composition", value: "Hydrogen / Helium", icon: Sparkles, color: "text-indigo-300", bg: "bg-indigo-500/20" }
            ]
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentFactIndex((prev) => (prev + 1) % facts.length);
                setIsTransitioning(false);
            }, 500); // Wait for fade out
        }, 8000); // Change every 8 seconds

        return () => clearInterval(interval);
    }, []);

    const currentFact = facts[currentFactIndex];

    return (
        <div className="absolute bottom-0 left-0 w-full pointer-events-none flex justify-center pb-6">
            <div className="w-full max-w-7xl mx-6 pointer-events-auto">
                <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-xl p-4 text-white shadow-2xl relative overflow-hidden group transition-all duration-500 hover:bg-black/90">

                    {/* Decorative background gradients - Subtle & Dark */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30"></div>
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-1000"></div>

                    <div className={`relative z-10 transition-opacity duration-500 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                        <div className="flex flex-row items-center justify-between gap-8">

                            {/* Left: Title & Description */}
                            <div className="flex-1 text-left flex items-center gap-6">
                                <h2 className="text-2xl font-bold text-white tracking-tight shrink-0 min-w-[200px]">
                                    {currentFact.title}
                                </h2>
                                <div className="h-8 w-[1px] bg-white/10"></div>
                                <p className="text-xs text-gray-400 leading-relaxed font-light max-w-2xl line-clamp-2">
                                    {currentFact.description}
                                </p>
                            </div>

                            {/* Right: Stats Grid - Horizontal */}
                            <div className="flex flex-row gap-4 shrink-0">
                                {currentFact.stats.map((stat, idx) => (
                                    <div key={idx} className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className={`p-1.5 rounded-md ${stat.bg} ${stat.color} shadow-inner`}>
                                            <stat.icon size={14} className="animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">{stat.label}</p>
                                            <p className="text-xs font-bold text-gray-200">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>

                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent w-full opacity-20">
                            <div key={currentFactIndex} className="h-full bg-white/40 w-full origin-left animate-[progress_8s_linear]"></div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes progress {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
            `}</style>
        </div>
    );
};

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
