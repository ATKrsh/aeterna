import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import './AvatarVisualizer.css';

// ── Premium skin PBR material ─────────────────────────────────────────────────
function applySkinMaterial(scene) {
  scene.traverse((child) => {
    if (!child.isMesh) return;
    const tex = child.material?.map ?? null;

    child.material = new THREE.MeshPhysicalMaterial({
      map:                tex,
      roughness:          0.78,
      metalness:          0.0,
      // Subsurface scattering approximation
      sheen:              0.15,
      sheenColor:         new THREE.Color(0xffb899),
      sheenRoughness:     0.85,
      // Skin clearcoat
      clearcoat:          0.04,
      clearcoatRoughness: 0.9,
      side:               THREE.FrontSide,
      toneMapped:         true,
    });

    if (tex) {
      tex.colorSpace      = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter       = THREE.LinearMipmapLinearFilter;
      tex.magFilter       = THREE.LinearFilter;
      tex.anisotropy      = 8;
      tex.needsUpdate     = true;
    }

    child.castShadow    = true;
    child.receiveShadow = true;
  });
}

// ── Avatar model with gentle idle animation ───────────────────────────────────
function HeadModel({ url, isActive }) {
  const groupRef = useRef();
  const { scene } = useGLTF(url);

  useEffect(() => { applySkinMaterial(scene); }, [scene]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Subtle breathing
    groupRef.current.position.y = Math.sin(t * 0.9) * 0.002;
    // Gentle idle sway — stay mostly forward
    groupRef.current.rotation.y = Math.sin(t * 0.28) * 0.06;
    groupRef.current.rotation.x = Math.sin(t * 0.42) * 0.02 - 0.04;
    if (isActive) {
      const p = 1 + Math.sin(t * 9) * 0.006;
      groupRef.current.scale.setScalar(p);
    } else {
      groupRef.current.scale.setScalar(1);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head is ~15–22 cm, position so it sits in upper half of frame */}
      <primitive object={scene} scale={1} position={[0, 0.02, 0]} />
    </group>
  );
}

// ── Cinematic portrait lighting ───────────────────────────────────────────────
function PortraitLights({ isActive }) {
  return (
    <>
      {/* Soft ambient fill — keeps shadow areas readable */}
      <ambientLight intensity={0.35} color="#e8d5c8" />

      {/* Key light — warm, angled from upper-left like a window */}
      <directionalLight
        position={[-0.6, 1.2, 1.0]}
        intensity={2.0}
        color="#fff5e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={5}
        shadow-camera-left={-0.5}
        shadow-camera-right={0.5}
        shadow-camera-top={0.5}
        shadow-camera-bottom={-0.5}
      />

      {/* Fill light — cool, from right, softens shadows */}
      <directionalLight
        position={[0.8, 0.4, 0.8]}
        intensity={0.7}
        color="#d0e8ff"
      />

      {/* Rim/hair light — behind, gives edge definition */}
      <directionalLight
        position={[0.1, 0.6, -1.2]}
        intensity={0.5}
        color={isActive ? '#c080ff' : '#8060c0'}
      />

      {/* Under-chin bounce — prevents bottom looking totally dark */}
      <pointLight
        position={[0, -0.3, 0.5]}
        intensity={0.25}
        color="#ffe0c8"
        distance={2}
      />
    </>
  );
}

// ── Post-processing ───────────────────────────────────────────────────────────
function PostFX({ isActive }) {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        luminanceThreshold={0.9}
        luminanceSmoothing={0.5}
        intensity={isActive ? 0.4 : 0.15}
        radius={0.5}
      />
      <Vignette eskil={false} offset={0.1} darkness={0.4} />
    </EffectComposer>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const AvatarVisualizer = ({ isActive, avatarUrl }) => {
  return (
    <div className="avatar-container animate-fade-in">
      {/* Header */}
      <div className="avatar-header">
        <h2 className="gradient-text" style={{ fontSize: '22px', margin: 0 }}>
          Your 3D Persona
        </h2>
        <div className="status-indicator">
          <div className={`status-dot ${isActive ? 'active' : ''}`} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {isActive ? 'Synthesizing…' : 'Presence Active'}
          </span>
        </div>
      </div>

      {/* Canvas — portrait FOV, head visible top-to-neck */}
      <div className="avatar-canvas-wrapper" style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{
            position: [0, 0.03, 0.62],   // pulled back to show full head + neck
            fov: 38,                       // moderate FOV, like a portrait lens
            near: 0.01,
            far: 10,
          }}
          shadows
          gl={{
            antialias:           true,
            alpha:               true,
            toneMapping:         THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.95,
            outputColorSpace:    THREE.SRGBColorSpace,
          }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <PortraitLights isActive={isActive} />

            {avatarUrl && <HeadModel url={avatarUrl} isActive={isActive} />}

            {/* Contact shadow on an invisible ground plane */}
            <ContactShadows
              position={[0, -0.18, 0]}
              opacity={0.3}
              scale={0.8}
              blur={2.5}
              far={0.3}
              color="#200030"
            />

            {/* Studio environment for realistic skin reflections */}
            <Environment preset="studio" />

            <PostFX isActive={isActive} />
          </Suspense>

          <OrbitControls
            enableZoom
            enablePan={false}
            minDistance={0.25}
            maxDistance={1.2}
            minPolarAngle={Math.PI * 0.2}
            maxPolarAngle={Math.PI * 0.75}
            target={[0, 0.04, 0]}
            autoRotate={false}
            dampingFactor={0.08}
            enableDamping
          />
        </Canvas>

        {/* Cinematic vignette */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            borderRadius: '24px',
            background: 'radial-gradient(ellipse at 50% 45%, transparent 38%, rgba(6,6,14,0.5) 100%)',
          }}
        />
      </div>

      {/* Footer */}
      <div className="avatar-footer">
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', margin: 0 }}>
          "I am here, always."
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '10px', textAlign: 'center', margin: '4px 0 0', opacity: 0.5 }}>
          Drag to orbit · Scroll to zoom
        </p>
      </div>
    </div>
  );
};

export default AvatarVisualizer;
