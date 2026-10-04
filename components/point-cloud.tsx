"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Locked defaults — the point-cloud "look"
const DENSITY = 7; // step = 10 - density
const SIZE = 5.7;
const DEPTH = 0.52;
const CUT = 0.0;
const MAX_DPR = 2;
const MAX_SIDE = 820; // cap long side when sampling

const VERT = `
attribute vec3 aColor;
uniform float uSize;
uniform float uPixelRatio;
uniform float uRefDist;
varying vec3 vColor;
void main() {
  vColor = aColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = max(uSize * uPixelRatio * (uRefDist / -mvPosition.z), 1.0);
  gl_Position = projectionMatrix * mvPosition;
}`;

const FRAG = `
precision mediump float;
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.32, d);
  gl_FragColor = vec4(vColor, alpha);
}`;

export default function PointCloud({ src, alt }: { src: string; alt: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let raf = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let geometry: THREE.BufferGeometry | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let ro: ResizeObserver | null = null;
    const cleanups: Array<() => void> = [];

    const img = new Image();
    img.crossOrigin = "anonymous";

    const build = () => {
      if (disposed) return;
      const W = container.clientWidth || 1;
      const H = container.clientHeight || 1;

      // --- sample image pixels into an offscreen canvas ---
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const s = Math.min(1, MAX_SIDE / Math.max(iw, ih));
      const cw = Math.max(1, Math.round(iw * s));
      const ch = Math.max(1, Math.round(ih * s));
      const oc = document.createElement("canvas");
      oc.width = cw;
      oc.height = ch;
      const octx = oc.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(img, 0, 0, cw, ch);

      let data: Uint8ClampedArray;
      try {
        data = octx.getImageData(0, 0, cw, ch).data;
      } catch (e) {
        // tainted canvas (CORS) — leave the poster <img> in place
        console.warn("[PointCloud] CORS-blocked, can't read pixels:", src);
        return;
      }

      const step = 10 - DENSITY; // = 3
      const scale = 2 / Math.max(cw, ch);
      const positions: number[] = [];
      const colors: number[] = [];

      for (let y = 0; y < ch; y += step) {
        for (let x = 0; x < cw; x += step) {
          const i = (y * cw + x) * 4;
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          const a = data[i + 3] / 255;
          if (a < 0.5) continue;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < CUT) continue;
          const px = (x - cw / 2) * scale;
          const py = -(y - ch / 2) * scale; // flip Y so image is upright
          const pz = (lum - 0.5) * DEPTH; // brightness-as-depth
          positions.push(px, py, pz);
          colors.push(r, g, b);
        }
      }
      if (positions.length === 0) return;

      // --- scene / camera / renderer ---
      const scene = new THREE.Scene();
      const pixelRatio = Math.min(window.devicePixelRatio, MAX_DPR);

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));

      // frame camera (fov 45) to fit the cloud, honoring canvas aspect
      const halfX = cw / Math.max(cw, ch);
      const halfY = ch / Math.max(cw, ch);
      const fov = 45;
      const vTan = Math.tan((fov * Math.PI) / 180 / 2);
      const aspect = W / H;
      const distV = halfY / vTan;
      const distH = halfX / (vTan * aspect);
      const fitDist = Math.max(distV, distH) * 1.15;

      const camera = new THREE.PerspectiveCamera(fov, aspect, 0.01, 100);
      camera.position.set(0, 0, fitDist);

      material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uSize: { value: SIZE },
          uPixelRatio: { value: pixelRatio },
          uRefDist: { value: fitDist },
        },
      });

      const points = new THREE.Points(geometry, material);
      const group = new THREE.Group();
      group.add(points);
      scene.add(group);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(W, H);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.inset = "0";
      renderer.domElement.style.cursor = "grab";
      renderer.domElement.style.touchAction = "pan-y"; // don't hijack vertical scroll

      // --- drag to orbit (damped), no wheel zoom ---
      let dragging = false;
      let lx = 0, ly = 0;
      let targetRotX = 0, targetRotY = 0;
      let curRotX = 0, curRotY = 0;
      const el = renderer.domElement;

      const onDown = (e: PointerEvent) => {
        dragging = true;
        lx = e.clientX; ly = e.clientY;
        el.style.cursor = "grabbing";
        el.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lx;
        const dy = e.clientY - ly;
        lx = e.clientX; ly = e.clientY;
        targetRotY += dx * 0.006;
        targetRotX += dy * 0.006;
        targetRotX = Math.max(-1.2, Math.min(1.2, targetRotX));
      };
      const onUp = (e: PointerEvent) => {
        dragging = false;
        el.style.cursor = "grab";
        try { el.releasePointerCapture(e.pointerId); } catch {}
      };
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
      cleanups.push(() => {
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
      });

      const loop = () => {
        if (disposed || !renderer) return;
        curRotX += (targetRotX - curRotX) * 0.1;
        curRotY += (targetRotY - curRotY) * 0.1;
        group.rotation.x = curRotX;
        group.rotation.y = curRotY;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      // resize
      ro = new ResizeObserver(() => {
        if (!renderer) return;
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      ro.observe(container);

      if (!disposed) setReady(true);
    };

    img.onload = build;
    img.onerror = () => console.warn("[PointCloud] image failed to load:", src);
    img.src = src;

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      cleanups.forEach((fn) => fn());
      if (ro) ro.disconnect();
      geometry?.dispose();
      material?.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      }
    };
  }, [src]);

  return (
    <div ref={mountRef} className="pc-wrap">
      {/* poster: the real image, hidden once the cloud is live */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="pc-poster"
        src={src}
        alt={alt}
        style={{ visibility: ready ? "hidden" : "visible" }}
      />
    </div>
  );
}
