import React, {
  Suspense,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Model component with animation controls
const Model = forwardRef(({ url, position }, ref) => {
  const group = useRef();
  const { scene, animations } = useGLTF(url);
  const [mixer] = useState(() => new THREE.AnimationMixer(scene));
  const [animationActions, setAnimationActions] = useState([]);

  React.useEffect(() => {
    // Setup all animations
    const actions = animations.map((clip) => {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat);
      action.clampWhenFinished = true;
      return action;
    });
    setAnimationActions(actions);

    return () => {
      actions.forEach((action) => action.stop());
      mixer.stopAllAction();
    };
  }, [animations, mixer]);

  React.useEffect(() => {
    let animationFrameId;
    const animate = () => {
      mixer.update(0.01);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mixer]);

  const playAllAnimations = () => {
    mixer.stopAllAction();
    animationActions.forEach((action) => {
      action.reset();
      action.play();
    });
  };

  // Expose playAllAnimations method through ref
  useImperativeHandle(ref, () => ({
    playAllAnimations,
  }));

  return (
    <group ref={group} position={position}>
      <primitive object={scene} />
    </group>
  );
});

// Set display name for better debugging
Model.displayName = "Model";

// Main component
const GLBViewer = () => {
  const [playing, setPlaying] = useState(false);
  const nitrogenRef = useRef();
  const oxygenRef = useRef();

  const playAllModels = () => {
    setPlaying(true);
    if (nitrogenRef.current) nitrogenRef.current.playAllAnimations();
    if (oxygenRef.current) oxygenRef.current.playAllAnimations();
    // Reset playing state after some time
    setTimeout(() => setPlaying(false), 1000);
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex justify-center p-4">
        <button
          onClick={playAllModels}
          className="px-6 py-2 bg-slate-200 rounded-md"
          disabled={playing}
        >
          Play All Animations
        </button>
      </div>
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 h-1/2 md:h-full">
          <Canvas
            camera={{
              position: [100, 70, 0],
              fov: 20,
              zoom: 1.2,
            }}
            style={{ background: "#cadaeb" }}
          >
            <ambientLight intensity={0.5} />
            <Environment preset="warehouse" />
            <pointLight position={[10, 10, 10]} />
            <Suspense fallback={null}>
              <Model
                url="/Nitrogen.glb"
                position={[0, 0, 13]}
                ref={nitrogenRef}
              />
            </Suspense>
            <OrbitControls />
          </Canvas>
        </div>
        <div className="w-full md:w-1/2 h-1/2 md:h-full">
          <Canvas
            camera={{ position: [100, 70, 0], fov: 20, zoom: 1.2 }}
            style={{ background: "#ebdeca" }}
          >
            <Environment preset="apartment" />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <Suspense fallback={null}>
              <Model url="/Oksigen.glb" position={[0, 0, 5]} ref={oxygenRef} />
            </Suspense>
            <OrbitControls />
          </Canvas>
        </div>
      </div>
    </div>
  );
};

// Pre-load models
useGLTF.preload("/nitrogen.glb");
useGLTF.preload("/oksigen.glb");

export default GLBViewer;
