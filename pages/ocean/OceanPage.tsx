import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// --- Shaders & Components ---

const Bubbles = () => {
    const count = 1000;
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, [count]);

    useFrame((state) => {
        if (!mesh.current) return;

        particles.forEach((particle, i) => {
            let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
            t = particle.t += speed / 2;
            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.cos(t);

            particle.mx += (state.mouse.x * 100 - particle.mx) * 0.01;
            particle.my += (state.mouse.y * 100 - particle.my) * 0.01;

            dummy.position.set(
                (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
                (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
                (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
            );
            dummy.scale.set(s, s, s);
            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#88ccff" transparent opacity={0.6} roughness={0} metalness={0.1} />
        </instancedMesh>
    );
};

const OceanPage: React.FC = () => {
    return (
        <div className="w-full h-full bg-[#001e36] relative overflow-hidden">
            <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
                {/* Deep Ocean Fog */}
                <color attach="background" args={['#001e36']} />
                <fog attach="fog" args={['#001e36', 5, 40]} />

                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={5}
                    maxDistance={30}
                    maxPolarAngle={Math.PI / 1.5}
                    minPolarAngle={Math.PI / 3}
                />

                {/* Lighting */}
                <ambientLight intensity={0.4} color="#004466" />
                <directionalLight position={[0, 50, 0]} intensity={1.5} color="#ccffff" />
                <pointLight position={[0, 10, 0]} intensity={1} color="#00ffff" distance={20} />

                {/* Particles / Bubbles */}
                <Bubbles />

                {/* Floating "Marine Snow" or subtle dust */}
                <Stars radius={50} depth={50} count={2000} factor={2} saturation={0} fade speed={0.5} />

            </Canvas>

            <div className="absolute top-8 right-8 text-right pointer-events-none select-none">
                <h1 className="text-6xl font-thin tracking-[0.2em] text-cyan-100/20 uppercase drop-shadow-lg">
                    Deep Ocean
                </h1>
            </div>
        </div>
    );
};

export default OceanPage;
