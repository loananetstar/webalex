import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

const RobotModel = (props: JSX.IntrinsicElements['group']) => {
    const { viewport } = useThree();

    // Refs
    const headRef = useRef<THREE.Group>(null);
    const pupilLeftRef = useRef<THREE.Mesh>(null);
    const pupilRightRef = useRef<THREE.Mesh>(null);

    // Global Mouse State (Fix for Deadzone)
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            // Normalize mouse coordinates (-1 to 1)
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Emotion State
    const [emotion, setEmotion] = useState<'normal' | 'excited' | 'scared' | 'angry' | 'happy'>('normal');

    useEffect(() => {
        const emotions: ('normal' | 'excited' | 'scared' | 'angry' | 'happy')[] = ['normal', 'excited', 'scared', 'angry', 'happy', 'normal', 'normal'];
        const interval = setInterval(() => {
            const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
            setEmotion(randomEmotion);
        }, 3000 + Math.random() * 3000);
        return () => clearInterval(interval);
    }, []);

    // Config
    const getEyeScale = () => {
        switch (emotion) {
            case 'excited': return [0.65, 0.65, 1];
            case 'scared': return [0.3, 0.3, 1];
            case 'angry': return [0.45, 0.25, 1];
            case 'happy': return [0.55, 0.3, 1];
            default: return [0.5, 0.5, 1];
        }
    };

    const getTargetColor = () => {
        switch (emotion) {
            case 'angry': return "#ef4444";
            case 'happy': return "#10b981";
            case 'excited': return "#facc15";
            default: return "#06b6d4";
        }
    }

    // Target Tilt Rotation (in radians)
    // Angry: \ / (Inward tilt)
    // Happy: / \ (Outward tilt or neutral)
    const getTargetTilt = () => {
        switch (emotion) {
            case 'angry': return 0.4; // Strong inward tilt
            case 'happy': return -0.2; // Slight outward cheery tilt
            case 'scared': return 0;
            default: return 0;
        }
    }

    const targetScale = new THREE.Vector3(...getEyeScale());
    const targetColor = new THREE.Color(getTargetColor());
    const targetTilt = getTargetTilt();

    useFrame((state) => {
        if (!headRef.current) return;

        const time = state.clock.getElapsedTime();
        const lerpFactor = 0.15; // Fast response

        // Use GLOBAL mouse state instead of state.mouse (which gets blocked)
        const mouseX = mouseRef.current.x;
        const mouseY = mouseRef.current.y;

        // Idle Animation
        const idleX = Math.sin(time * 0.8) * 0.03;
        const idleY = Math.cos(time * 0.5) * 0.03;

        // Head Tracking
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, (mouseX * 0.4) + idleX, 0.1);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, (-mouseY * 0.4) + idleY, 0.1);
        headRef.current.position.y = Math.sin(time * 1.5) * 0.05;

        // Eye Tracking
        // Since we are using global mouse, strictly clamp eye movement to keep pupils inside eyes
        const eyeX = mouseX * 0.45;
        const eyeY = mouseY * 0.45;
        const clampedEyeX = THREE.MathUtils.clamp(eyeX, -0.35, 0.35); // Stricter horizontal clamp
        const clampedEyeY = THREE.MathUtils.clamp(eyeY, -0.22, 0.22);

        if (pupilLeftRef.current) {
            pupilLeftRef.current.position.x = THREE.MathUtils.lerp(pupilLeftRef.current.position.x, clampedEyeX, 0.2);
            pupilLeftRef.current.position.y = THREE.MathUtils.lerp(pupilLeftRef.current.position.y, clampedEyeY, 0.2);
            pupilLeftRef.current.scale.lerp(targetScale, lerpFactor);
            (pupilLeftRef.current.material as THREE.MeshBasicMaterial).color.lerp(targetColor, 0.1);

            // TILT LOGIC:
            // Left Eye: Positive rotation is Counter-Clockwise. 
            // We want Top-Left to Bottom-Right (\) for Angry? No wait.
            // Angry Eyes: \ / 
            // Left Eye shape: \  (Top-Left). 
            // Default is square [ ]. To get \ we rotate CCW (+)? No, rotating + turns Top to Left. Yes.
            // So +Tilt for Left Eye?
            // Let's verify: +Z rotation on standard plane makes Top go LEFT. Correct.
            // So Angry Left (\) needs +rotation.

            // Right Eye: Need / (Top-Right).
            // Rotate -Z (CW) makes Top go RIGHT.
            // So Angry Right (/) needs -rotation.

            // If Happy is opposite / \:
            // Left Eye (/) -> -rotation.
            // Right Eye (\) -> +rotation.

            // So: Left gets +targetTilt, Right gets -targetTilt.

            pupilLeftRef.current.rotation.z = THREE.MathUtils.lerp(pupilLeftRef.current.rotation.z, targetTilt, 0.1);
        }

        if (pupilRightRef.current) {
            pupilRightRef.current.position.x = THREE.MathUtils.lerp(pupilRightRef.current.position.x, clampedEyeX, 0.2);
            pupilRightRef.current.position.y = THREE.MathUtils.lerp(pupilRightRef.current.position.y, clampedEyeY, 0.2);
            pupilRightRef.current.scale.lerp(targetScale, lerpFactor);
            (pupilRightRef.current.material as THREE.MeshBasicMaterial).color.lerp(targetColor, 0.1);

            // Right gets negative tilt
            pupilRightRef.current.rotation.z = THREE.MathUtils.lerp(pupilRightRef.current.rotation.z, -targetTilt, 0.1);
        }
    });

    // --- MATERIALS ---
    // Premium "Ceramic" White
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        roughness: 0.2,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
    });

    // Matte Black Details
    const darkMaterial = new THREE.MeshStandardMaterial({
        color: "#111827",
        roughness: 0.3,
        metalness: 0.5,
    });

    const speakerMaterial = new THREE.MeshStandardMaterial({
        color: "#9ca3af",
        roughness: 0.5,
        metalness: 0.8,
    });

    return (
        <group ref={headRef} {...props}>
            {/* MAIN CHASSIS */}
            <RoundedBox args={[3.0, 3.0, 3.0]} radius={0.15} smoothness={8}> {/* Increased smoothness */}
                <primitive object={bodyMaterial} attach="material" />
            </RoundedBox>

            {/* FACE PLATE */}
            <group position={[0, 0.1, 1.52]}>
                <RoundedBox args={[2.6, 1.4, 0.1]} radius={0.1} smoothness={4}>
                    <primitive object={darkMaterial} attach="material" />
                </RoundedBox>

                {/* --- EYES --- */}
                {/* Glow Effect Plane (Behind pupils) */}
                <mesh position={[0, 0, 0.05]}>
                    <planeGeometry args={[2.0, 0.8]} />
                    <meshBasicMaterial color={targetColor} transparent opacity={0.15} blending={THREE.AdditiveBlending} />
                </mesh>

                {/* Left Eye */}
                <group position={[-0.6, 0, 0.06]}>
                    <mesh ref={pupilLeftRef}>
                        <planeGeometry args={[1, 1]} />
                        <meshBasicMaterial color="#06b6d4" toneMapped={false} />
                    </mesh>
                </group>

                {/* Right Eye */}
                <group position={[0.6, 0, 0.06]}>
                    <mesh ref={pupilRightRef}>
                        <planeGeometry args={[1, 1]} />
                        <meshBasicMaterial color="#06b6d4" toneMapped={false} />
                    </mesh>
                </group>

                {/* Nose Camera */}
                <mesh position={[0, -0.4, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.15, 0.15, 0.1, 32]} />
                    <meshStandardMaterial color="#000" metalness={0.9} roughness={0.2} />
                </mesh>
                <mesh position={[0, -0.4, 0.07]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            </group>

            {/* TOP PANEL */}
            <group position={[0, 1.5, 0.4]}>
                {[-0.9, -0.3, 0.3, 0.9].map((x, i) => (
                    <group key={i} position={[x, 0, -0.8]}>
                        <mesh>
                            <cylinderGeometry args={[0.2, 0.2, 0.1, 32]} />
                            <meshStandardMaterial color="#f3f4f6" />
                        </mesh>
                        <mesh position={[0, -0.04, 0]}>
                            <cylinderGeometry args={[0.25, 0.25, 0.05, 32]} />
                            <meshStandardMaterial color="#d1d5db" />
                        </mesh>
                    </group>
                ))}
            </group>

            <group position={[0, 1.5, 0.6]}>
                <mesh>
                    <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
                    <meshStandardMaterial color="#f3f4f6" />
                </mesh>
                <mesh position={[0, -0.04, 0]}>
                    <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
                    <meshStandardMaterial color="#d1d5db" />
                </mesh>
            </group>

            {/* SIDE SPEAKERS */}
            <group position={[-1.51, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh>
                    <cylinderGeometry args={[0.8, 0.8, 0.05, 64]} />
                    <primitive object={bodyMaterial} attach="material" />
                </mesh>
                <mesh position={[0, 0.03, 0]} rotation={[0, 0, 0]}>
                    <cylinderGeometry args={[0.7, 0.7, 0.01, 64]} />
                    <primitive object={speakerMaterial} attach="material" />
                </mesh>
            </group>

            <group position={[1.51, -0.2, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <mesh>
                    <cylinderGeometry args={[0.8, 0.8, 0.05, 64]} />
                    <primitive object={bodyMaterial} attach="material" />
                </mesh>
                <mesh position={[0, 0.03, 0]}>
                    <cylinderGeometry args={[0.7, 0.7, 0.01, 64]} />
                    <primitive object={speakerMaterial} attach="material" />
                </mesh>
            </group>

            {/* BACK PANEL */}
            <group position={[0, -0.5, -1.51]} rotation={[0, Math.PI, 0]}>
                <RoundedBox args={[1.8, 0.8, 0.05]} radius={0.05} smoothness={2}>
                    <primitive object={bodyMaterial} attach="material" />
                </RoundedBox>
                <group position={[-0.5, 0, 0.05]}>
                    <boxGeometry args={[0.2, 0.4, 0.1]} />
                    <primitive object={darkMaterial} attach="material" />
                </group>
                <group position={[0.5, 0, 0.05]}>
                    <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
                    <primitive object={darkMaterial} attach="material" />
                </group>
            </group>

        </group>
    );
};

export default RobotModel;
