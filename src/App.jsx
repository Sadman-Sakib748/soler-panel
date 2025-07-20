import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const PLANET_DATA = [
  { name: "Mercury", color: 0x8c7853, size: 0.4, distance: 8, speed: 4.74, info: "Closest planet to the Sun" },
  { name: "Venus", color: 0xffc649, size: 0.6, distance: 12, speed: 3.5, info: "Hottest planet in our solar system" },
  { name: "Earth", color: 0x6b93d6, size: 0.6, distance: 16, speed: 2.98, info: "Our home planet" },
  { name: "Mars", color: 0xc1440e, size: 0.5, distance: 20, speed: 2.41, info: "The Red Planet" },
  { name: "Jupiter", color: 0xd8ca9d, size: 2.0, distance: 28, speed: 1.31, info: "Largest planet in our solar system" },
  { name: "Saturn", color: 0xfad5a5, size: 1.8, distance: 36, speed: 0.97, info: "Famous for its ring system" },
  { name: "Uranus", color: 0x4fd0e7, size: 1.2, distance: 44, speed: 0.68, info: "Ice giant tilted on its side" },
  { name: "Neptune", color: 0x4b70dd, size: 1.1, distance: 52, speed: 0.54, info: "Windiest planet in our solar system" },
];

function App() {
  const mountRef = useRef(null);
  const planetsRef = useRef([]);
  const sunRef = useRef(null);
  const animationIdRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const controlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [planetSpeeds, setPlanetSpeeds] = useState(PLANET_DATA.map((p) => p.speed));
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 60);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2, 200);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 5000;
    const starsPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
      starsPositions[i] = (Math.random() - 0.5) * 400;
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Sun
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    sunRef.current = sun;

    // Planets
    const planets = [];
    PLANET_DATA.forEach((planetData) => {
      const orbitGroup = new THREE.Group();
      scene.add(orbitGroup);

      const planetGeometry = new THREE.SphereGeometry(planetData.size, 32, 32);
      const planetMaterial = new THREE.MeshLambertMaterial({ color: planetData.color });
      const planet = new THREE.Mesh(planetGeometry, planetMaterial);
      planet.position.x = planetData.distance;
      planet.userData = { name: planetData.name, info: planetData.info };

      orbitGroup.add(planet);

      // Orbit ring
      const orbitGeometry = new THREE.RingGeometry(planetData.distance - 0.05, planetData.distance + 0.05, 64);
      const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide });
      const orbitLine = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbitLine.rotation.x = -Math.PI / 2;
      scene.add(orbitLine);

      planets.push({ mesh: planet, orbit: orbitGroup, angle: Math.random() * Math.PI * 2 });
    });
    planetsRef.current = planets;

    // Mouse Move
    const handleMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      setMousePosition({ x: e.clientX, y: e.clientY });

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(planets.map((p) => p.mesh));
      setHoveredPlanet(intersects.length > 0 ? intersects[0].object.userData.name : null);
    };
    renderer.domElement.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    const animate = () => {
      const delta = clockRef.current.getDelta();

      // Sun rotate
      if (sunRef.current) sunRef.current.rotation.y += delta * 0.5;

      // Planet rotations
      planets.forEach((planet, index) => {
        if (isPlaying) {
          planet.angle += planetSpeeds[index] * delta * 0.1;
          planet.orbit.rotation.y = planet.angle;
          planet.mesh.rotation.y += delta * 2;
        }
      });

      controls.update(); // OrbitControls update
      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, [isPlaying, planetSpeeds]);

  const handleSpeedChange = (i, value) => {
    const updatedSpeeds = [...planetSpeeds];
    updatedSpeeds[i] = parseFloat(value);
    setPlanetSpeeds(updatedSpeeds);
  };

  return (
    <div className="relative w-full h-screen bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-black/70 p-4 rounded-lg text-white">
        <h2>Solar System Controls</h2>
        <button onClick={() => setIsPlaying(!isPlaying)} className="px-2 py-1 bg-gray-600 rounded mt-2">
          {isPlaying ? "Pause" : "Play"}
        </button>
        {PLANET_DATA.map((planet, i) => (
          <div key={planet.name} className="mt-2">
            <span>{planet.name} ({planetSpeeds[i].toFixed(1)}x)</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={planetSpeeds[i]}
              onChange={(e) => handleSpeedChange(i, e.target.value)}
            />
          </div>
        ))}
      </div>
      {hoveredPlanet && (
        <div className="absolute bg-black/80 text-white p-2 rounded" style={{ left: mousePosition.x + 10, top: mousePosition.y - 10 }}>
          <strong>{hoveredPlanet}</strong>
          <p>{PLANET_DATA.find((p) => p.name === hoveredPlanet)?.info}</p>
        </div>
      )}
    </div>
  );
}

export default App;
