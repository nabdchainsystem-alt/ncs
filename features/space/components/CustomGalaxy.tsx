import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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

export const CustomGalaxy = () => {
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
