import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Shaders ---
const galaxyVertexShader = `
  attribute float scale;
  attribute vec3 customColor;
  varying vec3 vColor;
  
  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = scale * (500.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const galaxyFragmentShader = `
  varying vec3 vColor;
  
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    float strength = 1.0 - (r * 2.0);
    strength = pow(strength, 3.0);
    
    gl_FragColor = vec4(vColor, strength);
  }
`;

export interface GalaxyConfig {
    colors: {
        inside: string;
        outside: string;
    };
    structure: {
        branches: number;
        spin: number;
        randomness: number;
        randomnessPower: number;
    };
}

interface CustomGalaxyProps {
    config: GalaxyConfig;
}

export const CustomGalaxy: React.FC<CustomGalaxyProps> = ({ config }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const dustRef = useRef<THREE.Points>(null);

    // --- Stars Generation ---
    const starData = useMemo(() => {
        const count = 150000; // High Def Stars
        const radius = 30;

        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const scales = new Float32Array(count);

        const colorInside = new THREE.Color(config.colors.inside);
        const colorOutside = new THREE.Color(config.colors.outside);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const r = Math.random() * radius;
            const spinAngle = r * config.structure.spin;
            const branchAngle = (i % config.structure.branches) / config.structure.branches * Math.PI * 2;

            const randomX = Math.pow(Math.random(), config.structure.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * config.structure.randomness * r;
            const randomY = Math.pow(Math.random(), config.structure.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * config.structure.randomness * r;
            const randomZ = Math.pow(Math.random(), config.structure.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * config.structure.randomness * r;

            positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

            const mixedColor = colorInside.clone();
            mixedColor.lerp(colorOutside, r / radius);

            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;

            scales[i] = Math.random();
        }

        return { positions, colors, scales };
    }, [config]);

    // --- Dust/Nebula Generation ---
    const dustData = useMemo(() => {
        const count = 50000; // Dust particles
        const radius = 30;

        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const scales = new Float32Array(count);

        const colorInside = new THREE.Color(config.colors.inside);
        const colorOutside = new THREE.Color(config.colors.outside);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const r = Math.random() * radius;
            const spinAngle = r * config.structure.spin;
            const branchAngle = (i % config.structure.branches) / config.structure.branches * Math.PI * 2;

            // More spread for dust
            const spread = config.structure.randomness * 1.5;
            const randomX = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1) * spread * r;
            const randomY = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1) * spread * r;
            const randomZ = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1) * spread * r;

            positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

            const mixedColor = colorInside.clone();
            mixedColor.lerp(colorOutside, r / radius);

            // Dust is dimmer
            colors[i3] = mixedColor.r * 0.5;
            colors[i3 + 1] = mixedColor.g * 0.5;
            colors[i3 + 2] = mixedColor.b * 0.5;

            scales[i] = Math.random() * 2 + 1; // Larger particles
        }

        return { positions, colors, scales };
    }, [config]);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
        }
        if (dustRef.current) {
            dustRef.current.rotation.y = state.clock.getElapsedTime() * 0.04; // Dust moves slightly slower
        }
    });

    return (
        <group>
            {/* Stars */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={starData.positions.length / 3} array={starData.positions} itemSize={3} />
                    <bufferAttribute attach="attributes-customColor" count={starData.colors.length / 3} array={starData.colors} itemSize={3} />
                    <bufferAttribute attach="attributes-scale" count={starData.scales.length} array={starData.scales} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    vertexColors={true}
                    vertexShader={galaxyVertexShader}
                    fragmentShader={galaxyFragmentShader}
                    uniforms={{ uSize: { value: 20 * window.devicePixelRatio } }}
                />
            </points>

            {/* Dust/Nebula */}
            <points ref={dustRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={dustData.positions.length / 3} array={dustData.positions} itemSize={3} />
                    <bufferAttribute attach="attributes-customColor" count={dustData.colors.length / 3} array={dustData.colors} itemSize={3} />
                    <bufferAttribute attach="attributes-scale" count={dustData.scales.length} array={dustData.scales} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    vertexColors={true}
                    vertexShader={galaxyVertexShader}
                    fragmentShader={galaxyFragmentShader}
                    uniforms={{ uSize: { value: 40 * window.devicePixelRatio } }} // Larger dust
                    transparent={true}
                    opacity={0.3}
                />
            </points>
        </group>
    );
};
