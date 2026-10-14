import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeSafetyShieldProps {
  className?: string;
  celebrate?: boolean;
  tone?: "safe" | "warning" | "danger";
  size?: number;
}

export function ThreeSafetyShield({
  className = "w-full h-48",
  celebrate = false,
  tone = "safe",
}: ThreeSafetyShieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Primary palette
    const colors = {
      safe: { primary: 0x0f766e, glow: 0x2dd4bf, gold: 0xf59e0b },
      warning: { primary: 0xd97706, glow: 0xfbbf24, gold: 0xf59e0b },
      danger: { primary: 0xbe123c, glow: 0xf43f5e, gold: 0xfb7185 },
    }[tone];

    // Shield group
    const shieldGroup = new THREE.Group();
    scene.add(shieldGroup);

    // 1. Central Shield Shape (Hexagonal Prism)
    const shieldShape = new THREE.Shape();
    const sides = 6;
    const radius = 1.6;
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides + Math.PI / 6;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * (radius * 1.15);
      if (i === 0) shieldShape.moveTo(x, y);
      else shieldShape.lineTo(x, y);
    }
    shieldShape.closePath();

    const extrudeSettings = {
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.15,
      bevelThickness: 0.15,
    };
    const shieldGeometry = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
    shieldGeometry.center();

    const shieldMaterial = new THREE.MeshPhysicalMaterial({
      color: colors.primary,
      emissive: colors.glow,
      emissiveIntensity: 0.28,
      roughness: 0.25,
      metalness: 0.85,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      wireframe: false,
    });
    const shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shieldGroup.add(shieldMesh);

    // 2. Inner Golden Hologram Emblem
    const emblemGeo = new THREE.IcosahedronGeometry(0.7, 1);
    const emblemMat = new THREE.MeshStandardMaterial({
      color: colors.gold,
      emissive: colors.gold,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.9,
    });
    const emblemMesh = new THREE.Mesh(emblemGeo, emblemMat);
    emblemMesh.position.z = 0.25;
    shieldGroup.add(emblemMesh);

    // 3. Orbital Rings
    const ringGeo1 = new THREE.TorusGeometry(2.35, 0.04, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: colors.glow,
      transparent: true,
      opacity: 0.75,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    shieldGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.65, 0.03, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: colors.gold,
      transparent: true,
      opacity: 0.6,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    shieldGroup.add(ring2);

    // 4. Particle Field
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 8;
      posArray[i + 1] = (Math.random() - 0.5) * 6;
      posArray[i + 2] = (Math.random() - 0.5) * 4;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      color: colors.glow,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(colors.glow, 4.5, 12);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    const backLight = new THREE.PointLight(colors.gold, 2.5, 10);
    backLight.position.set(-2, -2, -3);
    scene.add(backLight);

    // Mouse / Touch interaction
    let targetRotX = 0;
    let targetRotY = 0;
    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const rect = container.getBoundingClientRect();
      const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = normX * 0.6;
      targetRotX = -normY * 0.4;
    };

    container.addEventListener("mousemove", onPointerMove);
    container.addEventListener("touchmove", onPointerMove);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth tilt towards pointer
      shieldGroup.rotation.y += (targetRotY - shieldGroup.rotation.y) * 0.06;
      shieldGroup.rotation.x += (targetRotX - shieldGroup.rotation.x) * 0.06;

      // Idle float & spin
      const floatSpeed = celebrate ? 4.5 : 1.2;
      shieldGroup.position.y = Math.sin(elapsed * floatSpeed) * 0.12;

      emblemMesh.rotation.x = elapsed * (celebrate ? 3.0 : 0.8);
      emblemMesh.rotation.y = elapsed * (celebrate ? 4.0 : 1.1);

      ring1.rotation.z += celebrate ? 0.04 : 0.012;
      ring2.rotation.z -= celebrate ? 0.035 : 0.009;

      particles.rotation.y = elapsed * 0.05;

      // Pulse emissive when celebrate
      if (celebrate) {
        shieldMaterial.emissiveIntensity = 0.45 + Math.sin(elapsed * 8) * 0.25;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", onPointerMove);
      container.removeEventListener("touchmove", onPointerMove);
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      shieldGeometry.dispose();
      shieldMaterial.dispose();
      emblemGeo.dispose();
      emblemMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [tone, celebrate]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      aria-label="Interactive 3D Safety Shield"
      role="img"
    />
  );
}
