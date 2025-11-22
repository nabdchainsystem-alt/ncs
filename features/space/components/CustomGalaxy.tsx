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
    // Circular particle
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Soft glow
    float strength = 1.0 - (r * 2.0);
    strength = pow(strength, 3.0);
    
    gl_FragColor = vec4(vColor, strength);
  }
`;

export const CustomGalaxy = () => {
    const pointsRef = useRef<THREE.Points>(null);

    // Galaxy Parameters
    const parameters = {
        count: 100000,
        size: 0.01,
        radius: 20,
        branches: 3,
        spin: 1,
        randomness: 0.2,
        randomnessPower: 3,
        insideColor: '#ff6030', // Orange/Red core
        outsideColor: '#1b3984', // Blue arms
    };

    const particleData = useMemo(() => {
        const positions = new Float32Array(parameters.count * 3);
        const colors = new Float32Array(parameters.count * 3);
        const scales = new Float32Array(parameters.count);

        const colorInside = new THREE.Color(parameters.insideColor);
        const colorOutside = new THREE.Color(parameters.outsideColor);

        for (let i = 0; i < parameters.count; i++) {
            const i3 = i * 3;

            // Radius
            const radius = Math.random() * parameters.radius;

            // Spin Angle
            const spinAngle = radius * parameters.spin;

            // Branch Angle
            const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;

            // Randomness
            const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
            const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
            const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;

            // Positions
            positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            positions[i3 + 1] = randomY; // Flattened galaxy
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

            // Colors
            const mixedColor = colorInside.clone();
            mixedColor.lerp(colorOutside, radius / parameters.radius);

            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;

            // Scales - varied sizes
            scales[i] = Math.random();
        }

        return { positions, colors, scales };
    }, []);

    useFrame((state) => {
        if (pointsRef.current) {
            // Rotate the galaxy
            pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={parameters.count}
                    array={particleData.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-customColor"
                    count={parameters.count}
                    array={particleData.colors}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-scale"
                    count={parameters.count}
                    array={particleData.scales}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                vertexColors={true}
                vertexShader={galaxyVertexShader}
                fragmentShader={galaxyFragmentShader}
                uniforms={{
                    uTime: { value: 0 },
                    uSize: { value: 30 * window.devicePixelRatio }
                }}
            />
        </points>
    );
};
