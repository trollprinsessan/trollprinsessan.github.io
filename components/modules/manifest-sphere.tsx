"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ManifestSphere({ imageUrls }: { imageUrls: string[] }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current || imageUrls.length === 0) return;
    const container = mountRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 1, 1000);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Offscreen canvas for drawing the current image
    const texCanvas = document.createElement("canvas");
    texCanvas.width = 1024;
    texCanvas.height = 1024;
    const ctx = texCanvas.getContext("2d")!;

    const texture = new THREE.CanvasTexture(texCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.IcosahedronGeometry(5, 32);
    geometry.rotateY(-Math.PI * 0.5);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let urlIdx = 0;
    let loading = false;

    const loadImage = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

    const drawFrame = (img: HTMLImageElement) => {
      ctx.clearRect(0, 0, 1024, 1024);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      texture.needsUpdate = true;
    };

    const showNext = () => {
      if (loading || imageUrls.length < 2) return;
      loading = true;
      const nextIdx = (urlIdx + 1) % imageUrls.length;
      loadImage(imageUrls[nextIdx])
        .then((img) => { drawFrame(img); urlIdx = nextIdx; })
        .catch(() => {})
        .finally(() => { loading = false; });
    };

    // Load first image
    loadImage(imageUrls[0])
      .then((img) => drawFrame(img))
      .catch(() => {});

    const swapInterval = setInterval(showNext, 4000);

    // Drag-to-rotate state
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let velX = 0;
    let velY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      velX = 0;
      velY = 0;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      velX = dx * 0.008;
      velY = dy * 0.008;
      mesh.rotation.y += velX;
      mesh.rotation.x += velY;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerUp = () => { isDragging = false; };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isDragging) {
        // Slow auto-rotation + momentum decay
        velX *= 0.92;
        velY *= 0.92;
        mesh.rotation.y += 0.0025 + velX;
        mesh.rotation.x += 0.0015 + velY;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(swapInterval);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [imageUrls]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
