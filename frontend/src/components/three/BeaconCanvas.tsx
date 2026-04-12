"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function BeaconCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.015);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 50);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ═══════════════════════════════════════════
    // CORE: Central Beacon Sphere
    // ═══════════════════════════════════════════
    const sphereGeo = new THREE.IcosahedronGeometry(8, 4);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x7c3aed,
      emissive: 0x3b0764,
      emissiveIntensity: 0.5,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Inner solid core
    const coreGeo = new THREE.IcosahedronGeometry(5, 3);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0xa78bfa,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.6,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Pulse ring around beacon
    const ringGeo = new THREE.TorusGeometry(12, 0.15, 16, 100);
    const ringMat = new THREE.MeshPhongMaterial({
      color: 0x7c3aed,
      emissive: 0x7c3aed,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    scene.add(ring);

    // Second ring
    const ring2Geo = new THREE.TorusGeometry(14, 0.08, 16, 100);
    const ring2Mat = new THREE.MeshPhongMaterial({
      color: 0xa78bfa,
      emissive: 0xa78bfa,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.4,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.z = Math.PI / 4;
    scene.add(ring2);

    // ═══════════════════════════════════════════
    // PARTICLES: Hackathon Network
    // ═══════════════════════════════════════════
    const particleCount = 600;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorPalette = [
      new THREE.Color(0x7c3aed),
      new THREE.Color(0xa78bfa),
      new THREE.Color(0xec4899),
      new THREE.Color(0x3b82f6),
      new THREE.Color(0x10b981),
    ];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 18 + Math.random() * 30;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 0.5;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
      size: 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ═══════════════════════════════════════════
    // CONNECTION LINES (constellation effect)
    // ═══════════════════════════════════════════
    const linePositions: number[] = [];
    const lineColors: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < Math.min(i + 5, particleCount); j++) {
        const x1 = positions[i * 3];
        const y1 = positions[i * 3 + 1];
        const z1 = positions[i * 3 + 2];
        const x2 = positions[j * 3];
        const y2 = positions[j * 3 + 1];
        const z2 = positions[j * 3 + 2];
        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);

        if (dist < 12) {
          linePositions.push(x1, y1, z1, x2, y2, z2);
          const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
          lineColors.push(c.r, c.g, c.b, c.r, c.g, c.b);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeo.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ═══════════════════════════════════════════
    // LIGHTING
    // ═══════════════════════════════════════════
    const ambientLight = new THREE.AmbientLight(0x7c3aed, 0.3);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x7c3aed, 2, 100);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa78bfa, 1.5, 80);
    pointLight2.position.set(-20, -10, 10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xec4899, 1, 60);
    pointLight3.position.set(0, -20, -20);
    scene.add(pointLight3);

    // ═══════════════════════════════════════════
    // LIGHTNING BOLT BEAMS (agent debate visual)
    // ═══════════════════════════════════════════
    const beamGroup = new THREE.Group();
    scene.add(beamGroup);

    const beamData = [
      { from: new THREE.Vector3(0, 0, 0), to: new THREE.Vector3(20, 15, 10), color: 0x3b82f6 },
      { from: new THREE.Vector3(0, 0, 0), to: new THREE.Vector3(-18, 12, -8), color: 0x10b981 },
      { from: new THREE.Vector3(0, 0, 0), to: new THREE.Vector3(5, -18, 15), color: 0xec4899 },
      { from: new THREE.Vector3(0, 0, 0), to: new THREE.Vector3(-10, -10, -20), color: 0xf59e0b },
    ];

    const beams: THREE.Line[] = [];
    beamData.forEach(({ from, to, color }) => {
      const points = [from, to];
      const beamGeo = new THREE.BufferGeometry().setFromPoints(points);
      const beamMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const beam = new THREE.Line(beamGeo, beamMat);
      beamGroup.add(beam);
      beams.push(beam);
    });

    // Animate beams on scroll
    ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const progress = self.progress;
        beams.forEach((beam, i) => {
          const mat = beam.material as THREE.LineBasicMaterial;
          const delay = i * 0.1;
          const beamProgress = Math.max(0, Math.min(1, (progress - delay) * 3));
          mat.opacity = beamProgress * 0.6 * (0.5 + 0.5 * Math.sin(Date.now() * 0.005 + i));
        });
        ringGroup.rotation.z = progress * Math.PI * 2;
      },
    });

    // ═══════════════════════════════════════════
    // ROTATING RING GROUP
    // ═══════════════════════════════════════════
    const ringGroup = new THREE.Group();
    ringGroup.rotation.x = Math.PI / 2.5;
    scene.add(ringGroup);

    // ═══════════════════════════════════════════
    // ANIMATION LOOP
    // ═══════════════════════════════════════════
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Sphere rotation
      sphere.rotation.x = elapsed * 0.15;
      sphere.rotation.y = elapsed * 0.2;

      // Core counter-rotation
      core.rotation.x = -elapsed * 0.1;
      core.rotation.y = -elapsed * 0.15;

      // Pulse rings
      const pulse = Math.sin(elapsed * 2) * 0.5 + 0.5;
      ring.scale.setScalar(1 + pulse * 0.1);
      ring2.scale.setScalar(1 + (1 - pulse) * 0.15);

      // Particle slow drift
      particles.rotation.y = elapsed * 0.03;
      particles.rotation.x = elapsed * 0.01;
      lines.rotation.y = elapsed * 0.03;
      lines.rotation.x = elapsed * 0.01;

      // Ring group spin
      ringGroup.rotation.z = elapsed * 0.2;

      // Camera subtle parallax
      camera.position.x += (mouseX * 5 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 5 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      // Light animation
      pointLight1.position.x = Math.sin(elapsed * 0.5) * 25;
      pointLight1.position.z = Math.cos(elapsed * 0.5) * 25;
      pointLight2.position.x = Math.cos(elapsed * 0.3) * 20;
      pointLight2.position.y = Math.sin(elapsed * 0.4) * 20;

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    // ═══════════════════════════════════════════
    // SCROLL-DRIVEN ANIMATIONS (GSAP)
    // ═══════════════════════════════════════════
    gsap.to(sphere.scale, {
      x: 1.3,
      y: 1.3,
      z: 1.3,
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "50% top",
        scrub: 1,
      },
    });

    gsap.to(particles.rotation, {
      y: Math.PI * 4,
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 3,
      },
    });

    // ═══════════════════════════════════════════
    // RESIZE HANDLER
    // ═══════════════════════════════════════════
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.setAnimationLoop(null);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
