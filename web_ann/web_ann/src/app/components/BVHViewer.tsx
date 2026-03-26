import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Slice } from '../types';

interface BVHViewerProps {
  currentFrame: number;
  totalFrames: number;
  slices: Slice[];
  showAnnotatedOverlay: boolean;
}

// Mock skeleton structure - in real app, this would be parsed from BVH file
const SKELETON_STRUCTURE = {
  joints: [
    { name: 'Hips', position: [0, 1, 0] },
    { name: 'Spine', position: [0, 1.2, 0] },
    { name: 'Head', position: [0, 1.6, 0] },
    { name: 'LeftShoulder', position: [-0.3, 1.4, 0] },
    { name: 'LeftElbow', position: [-0.5, 1.2, 0] },
    { name: 'LeftHand', position: [-0.7, 1.0, 0] },
    { name: 'RightShoulder', position: [0.3, 1.4, 0] },
    { name: 'RightElbow', position: [0.5, 1.2, 0] },
    { name: 'RightHand', position: [0.7, 1.0, 0] },
    { name: 'LeftHip', position: [-0.15, 0.95, 0] },
    { name: 'LeftKnee', position: [-0.15, 0.5, 0] },
    { name: 'LeftFoot', position: [-0.15, 0.0, 0] },
    { name: 'RightHip', position: [0.15, 0.95, 0] },
    { name: 'RightKnee', position: [0.15, 0.5, 0] },
    { name: 'RightFoot', position: [0.15, 0.0, 0] },
  ],
  bones: [
    [0, 1], [1, 2], // Spine to Head
    [1, 3], [3, 4], [4, 5], // Left Arm
    [1, 6], [6, 7], [7, 8], // Right Arm
    [0, 9], [9, 10], [10, 11], // Left Leg
    [0, 12], [12, 13], [13, 14], // Right Leg
  ],
};

export function BVHViewer({ currentFrame, totalFrames, slices, showAnnotatedOverlay }: BVHViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const skeletonGroupRef = useRef<THREE.Group | null>(null);
  const jointsRef = useRef<THREE.Mesh[]>([]);
  const bonesRef = useRef<THREE.Mesh[]>([]);
  const frameRef = useRef<number>(0);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5); // 浅灰色背景
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(2, 1.5, 2);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, 5, -5);
    scene.add(directionalLight2);

    // Grid
    const gridHelper = new THREE.GridHelper(10, 20, 0x9ca3af, 0xd1d5db);
    scene.add(gridHelper);

    // Skeleton Group
    const skeletonGroup = new THREE.Group();
    scene.add(skeletonGroup);
    skeletonGroupRef.current = skeletonGroup;

    // Create joints
    const jointMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const joints: THREE.Mesh[] = [];
    SKELETON_STRUCTURE.joints.forEach((joint) => {
      const geometry = new THREE.SphereGeometry(0.03, 16, 16);
      const mesh = new THREE.Mesh(geometry, jointMaterial);
      mesh.position.set(joint.position[0], joint.position[1], joint.position[2]);
      skeletonGroup.add(mesh);
      joints.push(mesh);
    });
    jointsRef.current = joints;

    // Create bones
    const boneMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const bones: THREE.Mesh[] = [];
    SKELETON_STRUCTURE.bones.forEach((bone) => {
      const start = SKELETON_STRUCTURE.joints[bone[0]].position;
      const end = SKELETON_STRUCTURE.joints[bone[1]].position;
      const startVec = new THREE.Vector3(...start);
      const endVec = new THREE.Vector3(...end);
      const direction = new THREE.Vector3().subVectors(endVec, startVec);
      const length = direction.length();

      const geometry = new THREE.CylinderGeometry(0.015, 0.015, length, 8);
      const mesh = new THREE.Mesh(geometry, boneMaterial);
      
      // Position at midpoint
      const midpoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
      mesh.position.copy(midpoint);
      
      // Orient the cylinder
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize()
      );
      
      skeletonGroup.add(mesh);
      bones.push(mesh);
    });
    bonesRef.current = bones;

    // Mouse controls
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !skeletonGroupRef.current) return;

      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      skeletonGroupRef.current.rotation.y += deltaX * 0.01;
      skeletonGroupRef.current.rotation.x += deltaY * 0.01;

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      
      const delta = e.deltaY * 0.001;
      const distance = cameraRef.current.position.length();
      const newDistance = Math.max(1, Math.min(10, distance + delta));
      cameraRef.current.position.multiplyScalar(newDistance / distance);
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, []);

  // Update skeleton animation based on currentFrame
  useEffect(() => {
    if (!skeletonGroupRef.current) return;

    const progress = currentFrame / totalFrames;
    
    // Rotate skeleton
    skeletonGroupRef.current.rotation.y = progress * Math.PI * 2;
    
    // Simulate walking motion
    const walkCycle = Math.sin(progress * Math.PI * 8) * 0.2;
    skeletonGroupRef.current.position.y = Math.abs(walkCycle) * 0.1;
  }, [currentFrame, totalFrames]);

  // Update colors based on annotation state
  useEffect(() => {
    const isInAnnotatedSlice = slices.some(
      slice => currentFrame >= slice.start && currentFrame <= slice.end
    );

    const color = showAnnotatedOverlay && isInAnnotatedSlice ? 0x60a5fa : 0xffffff;

    jointsRef.current.forEach(joint => {
      (joint.material as THREE.MeshStandardMaterial).color.setHex(color);
    });

    bonesRef.current.forEach(bone => {
      (bone.material as THREE.MeshStandardMaterial).color.setHex(color);
    });
  }, [currentFrame, slices, showAnnotatedOverlay]);

  return (
    <div className="w-full h-full bg-background rounded-lg overflow-hidden relative">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Overlay indicator */}
      <div className="absolute top-3 left-3 bg-card/80 px-3 py-1.5 rounded text-xs text-foreground border border-border">
        3D BVH 播放器
      </div>
    </div>
  );
}