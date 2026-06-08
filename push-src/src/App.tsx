import { useEffect, useRef, useState, useCallback } from "react";
import State from "./State";
import PointerComponent from "./PointerComponent";
import KeyboardComponent from "./Keyboard";
import { Bars } from "./Bars";
import TypeLayer from "./TypeLayer";
import TypeState from "./TypeState";

export type Mode = "normal" | "view";

function App() {
  const canvasRef = useRef(null!);
  const [state, setState] = useState<null | State>(null);
  const [mode, setMode] = useState<Mode>("normal");
  const [typeActive, setTypeActive] = useState(false);
  const [textColor, setTextColor] = useState("black");
  const typeStateRef = useRef<TypeState | null>(null);
  const syncLoopRef  = useRef<number>(0);
  const pushStateRef = useRef<State | null>(null);

  useEffect(() => {
    if (state !== null) {
      state.changeMode(mode);
    }
  }, [mode, state]);

  // Callback from TypeLayer when the TypeState instance is created
  const handleTypeStateReady = useCallback((ts: TypeState) => {
    typeStateRef.current = ts;
  }, []);

  // Sync loop: run every animation frame, update text Z positions from push heightGrid
  useEffect(() => {
    const loop = () => {
      const ts = typeStateRef.current;
      const ps = pushStateRef.current;
      if (ts && ps && ps.heightGrid.length > 0) {
        ts.syncWithPushGrid(
          ps.heightGrid,
          ps.selectedGrid,
          ps.cols,
          ps.rows
        );
      }
      syncLoopRef.current = requestAnimationFrame(loop);
    };
    syncLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(syncLoopRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const newState = new State(canvas);
    setState(newState);
    pushStateRef.current = newState;

    const handleResize = () => {
      const xChange = window.innerWidth - newState.renderer.domElement.width;
      const yChange = window.innerHeight - newState.renderer.domElement.height;

      newState.view.mouse1.copy(newState.view.min);
      newState.view.mouse2.copy(newState.view.max);

      newState.view.mouse1.x += xChange / 2;
      newState.view.mouse1.y += yChange / 2;
      newState.view.mouse2.x += xChange / 2;
      newState.view.mouse2.y += yChange / 2;

      const percent =
        window.innerHeight / 2 / (newState.renderer.domElement.height / 2);

      const minToCenterX = newState.view.mouse1.x - window.innerWidth / 2;
      newState.view.mouse1.x = minToCenterX * percent + window.innerWidth / 2;
      const maxToCenterX = newState.view.mouse2.x - window.innerWidth / 2;
      newState.view.mouse2.x = maxToCenterX * percent + window.innerWidth / 2;

      const minToCenterY = newState.view.mouse1.y - window.innerHeight / 2;
      newState.view.mouse1.y = minToCenterY * percent + window.innerHeight / 2;
      const maxToCenterY = newState.view.mouse2.y - window.innerHeight / 2;
      newState.view.mouse2.y = maxToCenterY * percent + window.innerHeight / 2;

      newState.view.update();

      newState.renderer.setSize(window.innerWidth, window.innerHeight);
      newState.camera.aspect = window.innerWidth / window.innerHeight;
      newState.camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (state) {
      const onPaste = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        for (const item of e.clipboardData.items) {
          if (item.type.indexOf("image") < 0) {
            continue;
          }
          let file = item.getAsFile();
          let src = URL.createObjectURL(file);
          state.loadImage(src);
        }
      };

      const onDrop = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        let file = e.dataTransfer.files[0];
        let src = URL.createObjectURL(file);
        state.loadImage(src);
      };

      const onDrag = (e: any) => {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      };

      window.addEventListener("paste", onPaste);
      window.addEventListener("dragover", onDrag);
      window.addEventListener("drop", onDrop);
      return () => {
        window.removeEventListener("paste", onPaste);
        window.removeEventListener("dragover", onDrag);
        window.removeEventListener("drop", onDrop);
      };
    }
  }, [state]);

  return (
    <>
      <input id="fileInput" type="file" style={{ display: "none" }}></input>
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0 }}></canvas>
      {/* Type overlay — always mounted, only interactive when typeActive */}
      <TypeLayer
        active={typeActive}
        textColor={textColor}
        onTypeStateReady={handleTypeStateReady}
      />
      {state ? (
        <>
          {/* Push pointer/keyboard disabled when type mode is active */}
          {!typeActive && <PointerComponent state={state} />}
          {!typeActive && <KeyboardComponent state={state} />}
          <Bars
            state={state}
            setMode={setMode}
            typeActive={typeActive}
            setTypeActive={setTypeActive}
            onTextColorChange={setTextColor}
          />
        </>
      ) : null}
    </>
  );
}

export default App;
