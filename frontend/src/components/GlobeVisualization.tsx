import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import styles from "./GlobeVisualization.module.css";

// ---------------------------------------------------------------------------
// Deterministic seeded PRNG (mulberry32) — avoids React purity lint warnings
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
	return function () {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ---------------------------------------------------------------------------
// Wireframe Globe Mesh
// ---------------------------------------------------------------------------

function WireframeGlobe() {
	const groupRef = useRef<THREE.Group>(null);
	const glowRef = useRef<THREE.Mesh>(null);

	useFrame((_state, delta) => {
		if (groupRef.current) {
			groupRef.current.rotation.y += delta * 0.08;
			groupRef.current.rotation.x = 0.15;
		}
		if (glowRef.current) {
			glowRef.current.rotation.y += delta * 0.08;
			glowRef.current.rotation.x = 0.15;
		}
	});

	// Generate latitude/longitude line geometry as a THREE.Line object
	const wireframeLine = useMemo(() => {
		const radius = 1.6;
		const segments = 64;

		const latLines: THREE.Vector3[][] = [];
		const lonLines: THREE.Vector3[][] = [];

		// Latitude lines
		for (let lat = -80; lat <= 80; lat += 20) {
			const ring: THREE.Vector3[] = [];
			const phi = (90 - lat) * (Math.PI / 180);
			for (let i = 0; i <= segments; i++) {
				const theta = (i / segments) * Math.PI * 2;
				const x = radius * Math.sin(phi) * Math.cos(theta);
				const y = radius * Math.cos(phi);
				const z = radius * Math.sin(phi) * Math.sin(theta);
				ring.push(new THREE.Vector3(x, y, z));
			}
			latLines.push(ring);
		}

		// Longitude lines
		for (let lng = 0; lng < 360; lng += 20) {
			const arc: THREE.Vector3[] = [];
			const theta = lng * (Math.PI / 180);
			for (let i = 0; i <= segments; i++) {
				const phi = (i / segments) * Math.PI;
				const x = radius * Math.sin(phi) * Math.cos(theta);
				const y = radius * Math.cos(phi);
				const z = radius * Math.sin(phi) * Math.sin(theta);
				arc.push(new THREE.Vector3(x, y, z));
			}
			lonLines.push(arc);
		}

		const allSegments = [...latLines, ...lonLines];
		const material = new THREE.LineBasicMaterial({
			color: "#039855",
			transparent: true,
			opacity: 0.18,
		});

		const group = new THREE.Group();
		for (const pts of allSegments) {
			const geo = new THREE.BufferGeometry().setFromPoints(pts);
			const line = new THREE.Line(geo, material);
			group.add(line);
		}

		return group;
	}, []);

	return (
		<group>
			{/* Wireframe globe lines */}
			<primitive ref={groupRef} object={wireframeLine} />

			{/* Solid sphere (subtle fill) */}
			<mesh ref={glowRef}>
				<sphereGeometry args={[1.58, 48, 48]} />
				<meshBasicMaterial
					color="#ecfdf3"
					transparent
					opacity={0.04}
					side={THREE.FrontSide}
				/>
			</mesh>

			{/* Atmospheric glow ring */}
			<mesh>
				<sphereGeometry args={[1.72, 48, 48]} />
				<shaderMaterial
					transparent
					depthWrite={false}
					side={THREE.BackSide}
					uniforms={{
						glowColor: { value: new THREE.Color("#12b76a") },
						intensity: { value: 0.35 },
					}}
					vertexShader={`
						varying vec3 vNormal;
						void main() {
							vNormal = normalize(normalMatrix * normal);
							gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
						}
					`}
					fragmentShader={`
						uniform vec3 glowColor;
						uniform float intensity;
						varying vec3 vNormal;
						void main() {
							float glow = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
							gl_FragColor = vec4(glowColor, glow * intensity);
						}
					`}
				/>
			</mesh>
		</group>
	);
}

// ---------------------------------------------------------------------------
// Floating Particle Field
// ---------------------------------------------------------------------------

function ParticleField() {
	const particlesRef = useRef<THREE.Points>(null);
	const count = 300;

	const [positions, sizes] = useMemo(() => {
		const rand = mulberry32(42);
		const pos = new Float32Array(count * 3);
		const sz = new Float32Array(count);

		for (let i = 0; i < count; i++) {
			// Distribute in a sphere shell around the globe
			const r = 2.2 + rand() * 3.5;
			const theta = rand() * Math.PI * 2;
			const phi = Math.acos(2 * rand() - 1);

			pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
			pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
			pos[i * 3 + 2] = r * Math.cos(phi);

			sz[i] = 0.8 + rand() * 2.0;
		}

		return [pos, sz];
	}, []);

	useFrame((_state, delta) => {
		if (particlesRef.current) {
			particlesRef.current.rotation.y += delta * 0.015;
			particlesRef.current.rotation.x += delta * 0.005;
		}
	});

	return (
		<points ref={particlesRef}>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					args={[positions, 3]}
					count={count}
				/>
				<bufferAttribute
					attach="attributes-size"
					args={[sizes, 1]}
					count={count}
				/>
			</bufferGeometry>
			<pointsMaterial
				color="#6ce9a6"
				size={0.02}
				transparent
				opacity={0.5}
				sizeAttenuation
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</points>
	);
}

// ---------------------------------------------------------------------------
// Orbital Rings
// ---------------------------------------------------------------------------

function OrbitalRing({
	radius,
	tilt,
	speed,
	opacity,
}: {
	radius: number;
	tilt: number;
	speed: number;
	opacity: number;
}) {
	const ringRef = useRef<THREE.Group>(null);

	const ringLine = useMemo(() => {
		const points: THREE.Vector3[] = [];
		const segments = 128;
		for (let i = 0; i <= segments; i++) {
			const angle = (i / segments) * Math.PI * 2;
			points.push(
				new THREE.Vector3(
					radius * Math.cos(angle),
					0,
					radius * Math.sin(angle),
				),
			);
		}
		const geo = new THREE.BufferGeometry().setFromPoints(points);
		const mat = new THREE.LineBasicMaterial({
			color: "#a6f4c5",
			transparent: true,
			opacity,
		});
		return new THREE.Line(geo, mat);
	}, [radius, opacity]);

	useFrame((_state, delta) => {
		if (ringRef.current) {
			ringRef.current.rotation.y += delta * speed;
		}
	});

	return (
		<group rotation={[tilt, 0, 0]}>
			<primitive ref={ringRef} object={ringLine} />
		</group>
	);
}

// ---------------------------------------------------------------------------
// India Marker Dot — highlighted on the globe surface
// ---------------------------------------------------------------------------

function IndiaMarker() {
	const markerRef = useRef<THREE.Mesh>(null);

	// India approximate coordinates: 20.5°N, 79°E
	const lat = 20.5;
	const lng = 79;
	const radius = 1.62;
	const phi = (90 - lat) * (Math.PI / 180);
	const theta = (lng - 90) * (Math.PI / 180);

	const x = radius * Math.sin(phi) * Math.cos(theta);
	const y = radius * Math.cos(phi);
	const z = radius * Math.sin(phi) * Math.sin(theta);

	useFrame((state) => {
		if (markerRef.current) {
			const scale = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.3;
			markerRef.current.scale.setScalar(scale);
		}
	});

	return (
		<group rotation={[0.15, 0, 0]}>
			<mesh ref={markerRef} position={[x, y, z]}>
				<sphereGeometry args={[0.035, 16, 16]} />
				<meshBasicMaterial color="#12b76a" transparent opacity={0.9} />
			</mesh>
			{/* Glow ring around marker */}
			<mesh position={[x, y, z]}>
				<sphereGeometry args={[0.07, 16, 16]} />
				<meshBasicMaterial color="#6ce9a6" transparent opacity={0.15} />
			</mesh>
		</group>
	);
}

// ---------------------------------------------------------------------------
// Main Exported Component
// ---------------------------------------------------------------------------

export default function GlobeVisualization() {
	return (
		<div className={styles.container}>
			<Canvas
				camera={{
					position: [0, 0, 4.8],
					fov: 45,
					near: 0.1,
					far: 100,
				}}
				dpr={[1, 1.5]}
				style={{ background: "transparent" }}
				gl={{ alpha: true, antialias: true }}
			>
				{/* Subtle ambient light */}
				<ambientLight intensity={0.6} />
				<directionalLight position={[5, 3, 5]} intensity={0.3} />

				{/* Globe */}
				<WireframeGlobe />

				{/* India marker */}
				<IndiaMarker />

				{/* Particle field */}
				<ParticleField />

				{/* Orbital rings */}
				<OrbitalRing radius={2.1} tilt={1.2} speed={0.04} opacity={0.08} />
				<OrbitalRing radius={2.5} tilt={0.6} speed={-0.025} opacity={0.06} />
				<OrbitalRing radius={2.9} tilt={1.8} speed={0.018} opacity={0.04} />
			</Canvas>

			{/* Gradient fade overlay at edges */}
			<div className={styles.fadeOverlay} />
		</div>
	);
}
