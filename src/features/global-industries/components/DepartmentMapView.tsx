import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { globalIndustriesData, Industry } from '../../../data/globalIndustriesData';
import { Search, ChevronRight, Activity, PieChart, BarChart3, Users, Building2 } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// --- Types ---
interface DepartmentNodeProps {
    name: string;
    position: [number, number, number];
    color: string;
    isCenter?: boolean;
}

// --- 3D Components ---

const DepartmentNode: React.FC<DepartmentNodeProps> = ({ name, position, color, isCenter }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            // Gentle floating animation
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
            meshRef.current.rotation.y += 0.01;
        }
    });

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                {isCenter ? (
                    <icosahedronGeometry args={[1.5, 0]} />
                ) : (
                    <boxGeometry args={[1, 1, 1]} />
                )}
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 2 : 0.5}
                    wireframe={!isCenter}
                />
            </mesh>

            {/* Connection Line to Center */}
            {!isCenter && (
                <Line
                    points={[[0, 0, 0], [-position[0], -position[1], -position[2]]]}
                    color={color}
                    opacity={0.2}
                    transparent
                    lineWidth={1}
                />
            )}

            <Html distanceFactor={10} position={[0, 1.5, 0]}>
                <div className={`
                    px-2 py-1 rounded backdrop-blur-md border whitespace-nowrap text-center transition-all
                    ${isCenter
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-100 text-sm font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                        : 'bg-black/60 border-white/10 text-gray-300 text-xs'}
                `}>
                    {name}
                </div>
            </Html>
        </group>
    );
};

const RadialScene: React.FC<{ industry: Industry }> = ({ industry }) => {
    const departments = useMemo(() => {
        return industry.departmentsEn.split(',').map(d => d.trim());
    }, [industry]);

    const nodes = useMemo(() => {
        return departments.map((dept, i) => {
            const angle = (i / departments.length) * Math.PI * 2;
            const radius = 6;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            // Color based on department type (mock logic)
            let color = '#a855f7'; // Default purple
            if (dept.includes('Quality') || dept.includes('Lab')) color = '#22d3ee'; // Cyan
            if (dept.includes('Production') || dept.includes('Assembly')) color = '#f472b6'; // Pink
            if (dept.includes('Sales') || dept.includes('Marketing')) color = '#fbbf24'; // Amber

            return { name: dept, position: [x, 0, z] as [number, number, number], color };
        });
    }, [departments]);

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            {/* Center Node (Industry) */}
            <DepartmentNode
                name={industry.nameEn}
                position={[0, 0, 0]}
                color="#ffffff"
                isCenter
            />

            {/* Department Nodes */}
            {nodes.map((node, i) => (
                <DepartmentNode
                    key={i}
                    name={node.name}
                    position={node.position}
                    color={node.color}
                />
            ))}

            <OrbitControls
                enablePan={false}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={Math.PI / 3}
                maxDistance={20}
                minDistance={10}
            />
        </>
    );
};

// --- UI Components ---

const IndustryList = ({ industries, selectedId, onSelect }: any) => (
    <div className="absolute left-6 top-6 bottom-6 w-80 bg-[#050510]/80 backdrop-blur-md border border-white/10 rounded-xl flex flex-col overflow-hidden z-10">
        <div className="p-4 border-b border-white/10">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search industries..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {industries.map((ind: Industry) => (
                <button
                    key={ind.id}
                    onClick={() => onSelect(ind)}
                    className={`
                        w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all
                        ${selectedId === ind.id
                            ? 'bg-cyan-950/50 border border-cyan-500/30'
                            : 'hover:bg-white/5 border border-transparent'}
                    `}
                >
                    <div>
                        <div className={`text-sm font-medium ${selectedId === ind.id ? 'text-cyan-400' : 'text-gray-300 group-hover:text-white'}`}>
                            {ind.nameEn}
                        </div>
                        <div className="text-[10px] text-gray-500 font-arabic">{ind.nameAr}</div>
                    </div>
                    {selectedId === ind.id && <ChevronRight className="w-4 h-4 text-cyan-500" />}
                </button>
            ))}
        </div>
    </div>
);

const MiniCharts = ({ industry }: { industry: Industry }) => {
    const deptCount = industry.departmentsEn.split(',').length;

    const pieData = [
        { name: 'High', value: 40, color: '#ef4444' },
        { name: 'Medium', value: 35, color: '#f59e0b' },
        { name: 'Low', value: 25, color: '#22d3ee' },
    ];

    const barData = [
        { name: 'This Industry', count: deptCount },
        { name: 'Sector Avg', count: 6 },
        { name: 'Global Avg', count: 5 },
    ];

    return (
        <div className="absolute right-6 top-6 bottom-6 w-80 flex flex-col gap-4 z-10 pointer-events-none">
            {/* Stats Card */}
            <div className="bg-[#050510]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 pointer-events-auto">
                <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-500" />
                    Importance Breakdown
                </h3>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff', fontSize: '12px' }}
                            />
                        </RePieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                    {pieData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[10px] text-gray-400">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Comparison Card */}
            <div className="bg-[#050510]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 pointer-events-auto">
                <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                    Department Count
                </h3>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                            />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-[#050510]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 flex-1 pointer-events-auto">
                <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-pink-500" />
                    Industry Details
                </h3>
                <div className="space-y-3">
                    <div className="p-3 rounded bg-white/5 border border-white/10">
                        <div className="text-[10px] text-gray-500 mb-1">Sector</div>
                        <div className="text-sm text-white font-medium">Manufacturing</div>
                    </div>
                    <div className="p-3 rounded bg-white/5 border border-white/10">
                        <div className="text-[10px] text-gray-500 mb-1">Complexity Score</div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 w-[85%]" />
                            </div>
                            <span className="text-xs text-cyan-400 font-bold">8.5</span>
                        </div>
                    </div>
                    <div className="p-3 rounded bg-white/5 border border-white/10">
                        <div className="text-[10px] text-gray-500 mb-1">Employees (Est.)</div>
                        <div className="text-sm text-white font-medium flex items-center gap-2">
                            <Users className="w-3 h-3 text-gray-400" />
                            2,500 - 5,000
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main View Component ---

export const DepartmentMapView: React.FC = () => {
    const [selectedIndustry, setSelectedIndustry] = useState<Industry>(globalIndustriesData[0]);

    return (
        <div className="relative w-full h-full">
            {/* 3D Canvas */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 10, 15], fov: 50 }}>
                    <RadialScene industry={selectedIndustry} />
                </Canvas>
            </div>

            {/* Left List */}
            <IndustryList
                industries={globalIndustriesData}
                selectedId={selectedIndustry.id}
                onSelect={setSelectedIndustry}
            />

            {/* Right Charts */}
            <MiniCharts industry={selectedIndustry} />
        </div>
    );
};
