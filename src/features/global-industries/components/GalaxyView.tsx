import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Sparkles, Billboard, Line, CameraControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { globalIndustriesData, Industry } from '../../../data/globalIndustriesData';
import { Search, Filter, Activity, Layers, Database, Info, Zap, Globe, Cpu, X, ArrowRight } from 'lucide-react';

// --- Types ---
interface NodeProps {
    industry: Industry;
    position: [number, number, number];
    color: string;
    isHovered: boolean;
    isSelected: boolean;
    onHover: (industry: Industry | null) => void;
    onDoubleClick: (industry: Industry, position: [number, number, number]) => void;
}

// --- 3D Components ---

const ConnectionLines: React.FC<{ nodes: any[] }> = ({ nodes }) => {
    const lines = useMemo(() => {
        const connections: any[] = [];
        // Optimization: Limit connections to nearest neighbors only to reduce draw calls
        // Simple spatial partitioning or just limiting loop range could work, 
        // but for < 300 nodes, a simple distance check with a strict cutoff is fine if we limit max connections per node.

        nodes.forEach((nodeA, i) => {
            let connectionsCount = 0;
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeB = nodes[j];
                const distSq =
                    (nodeA.position[0] - nodeB.position[0]) ** 2 +
                    (nodeA.position[1] - nodeB.position[1]) ** 2 +
                    (nodeA.position[2] - nodeB.position[2]) ** 2;

                if (distSq < 36) { // Distance < 6
                    connections.push({
                        start: nodeA.position,
                        end: nodeB.position,
                        opacity: Math.max(0.05, 1 - Math.sqrt(distSq) / 6) * 0.2
                    });
                    connectionsCount++;
                    if (connectionsCount > 3) break; // Limit connections per node
                }
            }
        });
        return connections;
    }, [nodes]);

    return (
        <group>
            {lines.map((line, i) => (
                <Line
                    key={i}
                    points={[line.start, line.end]}
                    color="#22d3ee"
                    transparent
                    opacity={line.opacity}
                    lineWidth={1}
                />
            ))}
        </group>
    );
};

const IndustryNode: React.FC<NodeProps> = ({ industry, position, color, isHovered, isSelected, onHover, onDoubleClick }) => {
    const meshRef = useRef<THREE.Group>(null);
    const glowRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.002; // Slower rotation

            // Hover scale effect
            const targetScale = isHovered || isSelected ? 1.5 : 1;
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }

        if (glowRef.current) {
            // Pulsing glow
            glowRef.current.scale.setScalar(1.2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1);
        }
    });

    return (
        <group position={position}>
            <group ref={meshRef}>
                {/* Core Sphere - Reduced geometry detail for performance */}
                <mesh
                    onPointerOver={(e) => { e.stopPropagation(); onHover(industry); }}
                    onPointerOut={(e) => { onHover(null); }}
                    onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(industry, position); }}
                >
                    <icosahedronGeometry args={[0.4, 1]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={1} // Lower brightness
                        roughness={0.4}
                        metalness={0.6}
                    />
                </mesh>

                {/* Detail Ring */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.6, 0.02, 8, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.4} />
                </mesh>

                {/* Outer Wireframe Shell */}
                <mesh>
                    <icosahedronGeometry args={[0.5, 0]} />
                    <meshBasicMaterial
                        color={color}
                        wireframe
                        transparent
                        opacity={0.15}
                    />
                </mesh>

                {/* Glowing Halo (Billboard) */}
                <Billboard>
                    <mesh ref={glowRef}>
                        <planeGeometry args={[2, 2]} />
                        <meshBasicMaterial
                            map={new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/glow.png')}
                            color={color}
                            transparent
                            opacity={isHovered ? 0.6 : 0.2}
                            depthWrite={false}
                            blending={THREE.AdditiveBlending}
                        />
                    </mesh>
                </Billboard>
            </group>

            {/* Hover Tooltip - Arrow + Rectangle */}
            {isHovered && !isSelected && (
                <Html position={[0, 0.8, 0]} center distanceFactor={12} zIndexRange={[100, 0]}>
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pointer-events-none flex flex-col items-center"
                    >
                        {/* Info Rectangle */}
                        <div className="bg-[#050510]/90 backdrop-blur-md border border-cyan-500/40 px-4 py-3 rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.2)] min-w-[180px]">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-cyan-300">{industry.nameEn}</span>
                                <div className={`w-2 h-2 rounded-full bg-${color === '#22d3ee' ? 'cyan' : 'purple'}-500 shadow-[0_0_5px_currentColor]`} />
                            </div>
                            <div className="text-[10px] text-gray-400 font-arabic mb-2">{industry.nameAr}</div>
                            <div className="flex items-center gap-2 text-[9px] text-gray-500 uppercase tracking-wider">
                                <Activity className="w-3 h-3" />
                                <span>Double Click to View</span>
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-cyan-500/40 translate-y-[-1px]" />
                    </motion.div>
                </Html>
            )}
        </group>
    );
};

const GalaxyScene: React.FC<{
    data: Industry[];
    hoveredNodeId: number | null;
    selectedNodeId: number | null;
    onNodeHover: (industry: Industry | null) => void;
    onNodeSelect: (industry: Industry) => void;
}> = ({ data, hoveredNodeId, selectedNodeId, onNodeHover, onNodeSelect }) => {
    const cameraControlsRef = useRef<CameraControls>(null);

    // Generate positions
    const nodes = useMemo(() => {
        return data.map((industry, i) => {
            const phi = Math.acos(-1 + (2 * i) / data.length);
            const theta = Math.sqrt(data.length * Math.PI) * phi;
            const radius = 8 + Math.random() * 12;
            const x = radius * Math.cos(theta) * Math.sin(phi);
            const y = (Math.random() - 0.5) * 6;
            const z = radius * Math.sin(theta) * Math.sin(phi);
            const colors = ['#06b6d4', '#8b5cf6', '#d946ef', '#10b981', '#f59e0b'];
            const color = colors[i % colors.length];
            return { ...industry, position: [x, y, z] as [number, number, number], color };
        });
    }, [data]);

    const handleNodeDoubleClick = (industry: Industry, position: [number, number, number]) => {
        onNodeSelect(industry);
        if (cameraControlsRef.current) {
            // Travel to the node
            // Position camera slightly offset from the node
            const offset = 4;
            const targetPos = new THREE.Vector3(...position);
            const cameraPos = targetPos.clone().add(new THREE.Vector3(offset, offset * 0.5, offset));

            cameraControlsRef.current.setLookAt(
                cameraPos.x, cameraPos.y, cameraPos.z,
                targetPos.x, targetPos.y, targetPos.z,
                true // animate
            );
        }
    };

    return (
        <>
            <color attach="background" args={['#020205']} />

            {/* Lighting - Reduced intensity */}
            <ambientLight intensity={0.1} />
            <pointLight position={[10, 10, 10]} intensity={0.8} color="#22d3ee" />

            {/* Environment */}
            <Stars radius={150} depth={50} count={3000} factor={4} saturation={0} fade speed={0.2} />
            <Sparkles count={300} scale={30} size={2} speed={0.1} opacity={0.3} color="#ffffff" />

            {/* Central Brain/Core */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshStandardMaterial
                    color="#000000"
                    emissive="#22d3ee"
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </mesh>

            {/* Connections */}
            <ConnectionLines nodes={nodes} />

            {/* Nodes */}
            {nodes.map((node) => (
                <IndustryNode
                    key={node.id}
                    industry={node}
                    position={node.position}
                    color={node.color}
                    isHovered={hoveredNodeId === node.id}
                    isSelected={selectedNodeId === node.id}
                    onHover={onNodeHover}
                    onDoubleClick={handleNodeDoubleClick}
                />
            ))}

            {/* Post Processing - Optimized */}
            <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={1.2} mipmapBlur intensity={1.2} radius={0.5} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>

            <CameraControls ref={cameraControlsRef} maxDistance={80} minDistance={2} />
        </>
    );
};

// --- UI Components ---

const HolographicMenu = ({ industry, onClose }: { industry: Industry; onClose: () => void }) => (
    <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 50, opacity: 0 }}
        className="absolute right-10 top-24 bottom-24 w-96 z-50 pointer-events-auto"
    >
        {/* Holographic Container */}
        <div className="w-full h-full relative">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-[#050510]/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.1)] clip-path-polygon" />

            {/* Decorative Lines */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />

            {/* Content */}
            <div className="relative z-10 p-8 h-full flex flex-col">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-[10px] text-cyan-400 uppercase tracking-widest">Live Data Stream</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-1">{industry.nameEn}</h2>
                        <h3 className="text-lg text-gray-400 font-arabic">{industry.nameAr}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors">
                            <div className="text-gray-500 text-[10px] uppercase mb-1">Readiness</div>
                            <div className="text-2xl font-bold text-cyan-400">92%</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors">
                            <div className="text-gray-500 text-[10px] uppercase mb-1">Complexity</div>
                            <div className="text-2xl font-bold text-purple-400">High</div>
                        </div>
                    </div>

                    {/* Departments List */}
                    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-cyan-500" />
                            Departments Structure
                        </h4>
                        <div className="space-y-3">
                            {industry.departmentsEn.split(',').map((dept, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{dept.trim()}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-cyan-400 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Insight */}
                    <div className="p-5 rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20">
                        <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            AI Insight
                        </h4>
                        <p className="text-xs text-gray-300 leading-relaxed">
                            This industry shows a 15% increase in cross-departmental dependencies. Recommended to optimize the supply chain flow.
                        </p>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                    <button className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 group">
                        <span>Open Full Dashboard</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    </motion.div>
);

// --- Main View Component ---

export const GalaxyView: React.FC = () => {
    const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);

    return (
        <div className="relative w-full h-full bg-[#020205]">
            {/* 3D Canvas */}
            <div className="absolute inset-0 z-0">
                <Canvas
                    camera={{ position: [25, 15, 25], fov: 40 }}
                    gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.2 }}
                    dpr={[1, 1.5]} // Cap DPR for performance
                >
                    <GalaxyScene
                        data={globalIndustriesData}
                        hoveredNodeId={hoveredNodeId}
                        selectedNodeId={selectedIndustry?.id || null}
                        onNodeHover={(node) => setHoveredNodeId(node ? node.id : null)}
                        onNodeSelect={setSelectedIndustry}
                    />
                </Canvas>
            </div>

            {/* UI Overlays - Only show when no industry is selected to avoid clutter */}
            <AnimatePresence>
                {!selectedIndustry && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-none"
                    >
                        <div className="absolute left-6 top-24 w-64 bg-[#050510]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 z-10 shadow-2xl pointer-events-auto">
                            <div className="flex items-center gap-2 mb-6 text-cyan-400">
                                <Filter className="w-4 h-4" />
                                <span className="font-bold text-xs uppercase tracking-[0.2em]">Data Filters</span>
                            </div>
                            {/* ... Filter Content ... */}
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {['Manufacturing', 'Services', 'Tech'].map(tag => (
                                        <button key={tag} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-cyan-500/20 transition-all">
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="absolute right-6 top-24 w-72 space-y-4 z-10 pointer-events-auto">
                            <div className="bg-[#050510]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                                <div className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">Total Industries</div>
                                <div className="text-3xl font-bold text-white">236</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Holographic Side Menu */}
            <AnimatePresence>
                {selectedIndustry && (
                    <HolographicMenu
                        industry={selectedIndustry}
                        onClose={() => setSelectedIndustry(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
