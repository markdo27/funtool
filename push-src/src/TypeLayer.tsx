import { useEffect, useRef, useState } from "react";
import TypeState from "./TypeState";
import TypeKeyboard from "./TypeKeyboard";
import TypePointer from "./TypePointer";
import "./TypeFont.css";

export type TypeMode = "normal" | "choosePosition" | "navigation";

interface TypeLayerProps {
  active: boolean;
  textColor: string;
  onTypeStateReady?: (ts: TypeState) => void;
}

function TypeLayer({ active, textColor, onTypeStateReady }: TypeLayerProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null!);
  const printRef   = useRef<HTMLCanvasElement>(null!);
  const keyboardRef = useRef<HTMLDivElement>(null!);
  const [typeState, setTypeState] = useState<TypeState | null>(null);
  const [color, setColor] = useState("#ffffff");
  const [mode, setModeDisplay] = useState<TypeMode>("normal");

  // Init TypeState once canvas is ready
  useEffect(() => {
    if (!canvasRef.current || !printRef.current) return;
    const ts = new TypeState(canvasRef.current, printRef.current);
    setTypeState(ts);
    if (onTypeStateReady) onTypeStateReady(ts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When color changes, update text color
  useEffect(() => {
    if (typeState) typeState.setColor(color);
  }, [color, typeState]);

  // Expose mode changes to display
  useEffect(() => {
    if (!typeState) return;
    const interval = setInterval(() => {
      setModeDisplay(typeState.mode as TypeMode);
    }, 300);
    return () => clearInterval(interval);
  }, [typeState]);

  const modeLabel: Record<TypeMode, string> = {
    normal: "TYPE",
    choosePosition: "PLACE",
    navigation: "SELECT",
  };

  return (
    <>
      {/* Hidden print canvas */}
      <canvas
        ref={printRef}
        style={{ display: "none", position: "absolute" }}
      />

      {/* Type overlay canvas — transparent, sits above the push WebGL canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: active ? "auto" : "none",
          zIndex: 5,
          cursor: active ? "crosshair" : "default",
        }}
      />

      {/* Type controls bar — shown only when type mode active */}
      {active && typeState && (
        <div
          style={{
            position: "fixed",
            bottom: 64,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 30,
            display: "flex",
            gap: 4,
            pointerEvents: "auto",
            userSelect: "none",
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "6px 10px",
            alignItems: "center",
            flexWrap: "wrap",
            maxWidth: "92vw",
          }}
        >
          {/* Mode pill */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.15em",
              padding: "3px 10px",
              borderRadius: 4,
              background:
                mode === "normal"
                  ? "rgba(0,220,255,0.18)"
                  : mode === "choosePosition"
                  ? "rgba(255,220,0,0.18)"
                  : "rgba(255,40,104,0.18)",
              color:
                mode === "normal"
                  ? "#00dcff"
                  : mode === "choosePosition"
                  ? "#ffdc00"
                  : "#ff2868",
              border: `1px solid ${
                mode === "normal"
                  ? "#00dcff"
                  : mode === "choosePosition"
                  ? "#ffdc00"
                  : "#ff2868"
              }`,
            }}
          >
            {modeLabel[mode]}
          </div>

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 20,
              background: "rgba(255,255,255,0.12)",
              margin: "0 4px",
            }}
          />

          {/* Color picker */}
          <label
            style={{
              fontSize: 9,
              color: "#666",
              display: "flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
            }}
          >
            COLOR
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: 22,
                height: 22,
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 3,
                background: "none",
                padding: 1,
                cursor: "pointer",
              }}
            />
          </label>

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 20,
              background: "rgba(255,255,255,0.12)",
              margin: "0 4px",
            }}
          />

          {/* Keyboard hints */}
          <div
            style={{
              fontSize: 9,
              color: "#444",
              lineHeight: 1.6,
              letterSpacing: "0.04em",
            }}
          >
            <span style={{ color: "#666" }}>Type</span> to write ·{" "}
            <span style={{ color: "#666" }}>Mouse</span> to aim ·{" "}
            <span style={{ color: "#666" }}>↵</span> new line ·{" "}
            <span style={{ color: "#666" }}>Esc</span> navigate ·{" "}
            <span style={{ color: "#666" }}>Backspace</span> delete
          </div>
        </div>
      )}

      {/* Type keyboard + pointer — only mounted when canvas exists */}
      {typeState && active && (
        <>
          <TypeKeyboard state={typeState} />
          <TypePointer state={typeState} keyboardRef={keyboardRef} />
        </>
      )}
    </>
  );
}

export default TypeLayer;
