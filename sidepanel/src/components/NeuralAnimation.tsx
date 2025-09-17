import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = vec3(modelViewMatrix * vec4(position, 1.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 viewDirection = normalize(-vPosition);
    float centerFactor = dot(vNormal, viewDirection);

    // Glow color (white)
    vec3 glowColor = vec3(1.0, 1.0, 1.0);

    // Calculate a rim lighting effect (Fresnel).
    // The glow is strongest at the edges of the sphere, where the surface normal
    // is perpendicular to the view direction.
    float rimFactor = 1.0 - clamp(centerFactor, 0.0, 1.0);
    
    // The 'pow' function controls the tightness of the glow. A higher exponent
    // creates a sharper, more defined rim. We use a value of 2.0 for a strong but soft glow.
    float intensity = pow(rimFactor, 2.0);

    // Boost the intensity for a more pronounced "glowing" effect and add a
    // very sharp, bright highlight right at the edge.
    intensity = intensity * 1.5 + pow(rimFactor, 8.0);

    vec3 finalColor = glowColor * clamp(intensity, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const NeuralAnimation: React.FC<{ className?: string }> = ({ className }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);
    
    // Sphere Material
    const sphereMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
    });

    // Sphere Geometry & Mesh
    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    // Particles
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const velocities: number[] = [];

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const radius = 3 + Math.random() * 4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);

        velocities.push(0.01 + Math.random() * 0.01);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.05,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.NormalBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);


    // Animation loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      
      // Animate particles
      const posAttribute = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i);
        const z = posAttribute.getZ(i);

        let p = new THREE.Vector3(x, y, z);
        const distance = p.length();

        if (distance < 1.1) {
            const radius = 3 + Math.random() * 4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            p.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
        } else {
            p.multiplyScalar(1 - velocities[i]);
        }
        posAttribute.setXYZ(i, p.x, p.y, p.z);
      }
      posAttribute.needsUpdate = true;

      // Rotate scene
      scene.rotation.y = elapsedTime * 0.1;
      scene.rotation.x = elapsedTime * 0.05;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
        if (!mount) return;
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  return <div ref={mountRef} className={className ?? "w-9 h-9"} />;
};

export default NeuralAnimation;