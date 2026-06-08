import * as THREE from "three";
import { updateVector } from "./TypeActions";
import { Cursor } from "./TypeCursor";
import { TEXT_COLOR } from "./TypeConstants";
import TypeText from "./TypeText";

class TypeState {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  printCamera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  printRenderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  text: TypeText;
  data: string;
  worldPixel: number;
  center: THREE.Vector2;
  mouse: THREE.Vector2;
  vector: THREE.Vector2;
  tempVec: THREE.Vector3;
  ray: THREE.Vector3;
  lastPosition: [number, number];
  cursor: Cursor;
  draggingCamera: boolean;
  draggingLine: boolean;
  movedCheck: boolean;
  mode: "normal" | "choosePosition" | "navigation";
  transparentBackground: boolean;
  save2x: boolean;
  touch: boolean;
  printCanvas: HTMLCanvasElement;
  typeCellSize: number; // push cell size expressed in type-world units

  constructor(canvas: HTMLCanvasElement, printCanvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.printCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.printCanvas = printCanvas;
    this.printRenderer = new THREE.WebGLRenderer({
      canvas: printCanvas,
      alpha: true,
    });
    this.printRenderer.setPixelRatio(window.devicePixelRatio);
    this.printRenderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    this.center = new THREE.Vector2(
      window.innerWidth / 2,
      window.innerHeight / 2
    );
    this.vector = new THREE.Vector2();
    this.draggingLine = false;
    this.draggingCamera = false;

    const ZSTART = 10;
    {
      const visibleHeight =
        2 * Math.tan((this.camera.fov * Math.PI) / 360) * ZSTART;
      this.worldPixel = visibleHeight / window.innerHeight;
    }

    this.data = "";
    this.ray = new THREE.Vector3();
    this.tempVec = new THREE.Vector3();
    this.mouse = new THREE.Vector2(window.innerWidth - 48, 72);
    this.movedCheck = false;
    this.transparentBackground = true;
    this.save2x = true;
    this.lastPosition = [0, 0];
    this.touch = window.matchMedia("(pointer: coarse)").matches;

    // Each push block is 16 screen pixels wide at the push camera z=5.
    // push worldPixel = visibleHeight(z=5) / windowH = typeWorldPixel / 2
    // Push cell size in type world = pushWorldPixel * 16 = typeWorldPixel * 8
    this.typeCellSize = this.worldPixel * 8;

    // Build text BEFORE cursor (cursor references text)
    this.text = new TypeText(this, [
      (-window.innerWidth / 2 + 24) * this.worldPixel,
      (window.innerHeight / 2 - 72) * this.worldPixel,
    ]);

    this.cursor = new Cursor(this);
    this.mode = "normal";
    this.scene.add(this.cursor);

    this.camera.position.z = ZSTART;

    updateVector(this);

    const start = this.text.linePositions[this.text.activeLine];
    this.cursor.setEnd(
      this.lastPosition[0] + this.vector.x + start[0],
      this.lastPosition[1] + this.vector.y + start[1]
    );

    this.animate();

    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  setMode(newMode: "normal" | "choosePosition" | "navigation") {
    this.mode = newMode;
    this.cursor.updateMarker();
  }

  /** Bridge: called from App every ~60ms or after any push operation. */
  syncWithPushGrid(
    heightGrid: number[],
    selectedGrid: number[],
    cols: number,
    rows: number
  ) {
    if (!this.text || this.text.charCounter === 0) return;
    this.text.updateFromPushGrid(
      heightGrid,
      selectedGrid,
      cols,
      rows,
      this.typeCellSize
    );
  }

  animate() {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }

  setColor(color: string) {
    this.text.setColor(color);
  }

  printImage(compositeCanvas: HTMLCanvasElement) {
    if (this.text.charCounter > 0) {
      let multiplier = this.save2x ? 2 : 1;
      const visibleHeight =
        2 * Math.tan((this.camera.fov * Math.PI) / 360) * 10;
      const zoomPixel = visibleHeight / window.innerHeight;
      let { top, left, bottom, right } = this.text.getPoints();
      const pad = 0.6;
      top += pad; bottom -= pad; left -= pad; right += pad;
      const width  = ((right - left) / zoomPixel) * multiplier;
      const height = ((top - bottom) / zoomPixel) * multiplier;
      const center = [left + (right - left) / 2, bottom + (top - bottom) / 2];
      const adjust = height / window.innerHeight / multiplier;

      this.printCamera.position.x = center[0];
      this.printCamera.position.y = center[1];
      this.printCamera.position.z = 10 * adjust;
      this.printCamera.aspect = width / height;
      this.printCamera.updateProjectionMatrix();
      this.printRenderer.setSize(width, height);

      this.cursor.visible = false;
      this.cursor.curMarker.visible = false;
      this.cursor.nextMarker.visible = false;
      this.cursor.mouse.visible = false;

      const cacheBg = this.scene.background;
      this.scene.background = null;
      this.printRenderer.setClearColor(0x000000, 0);
      this.printRenderer.clear();
      this.printRenderer.render(this.scene, this.printCamera);
      this.scene.background = cacheBg;

      this.printRenderer.domElement.toBlob((blob) => {
        const link = document.createElement("a");
        link.setAttribute("download", "type-" + Math.round(Date.now() / 1000) + ".png");
        link.setAttribute("href", URL.createObjectURL(blob!));
        link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      });

      this.cursor.visible = true;
      this.cursor.mouse.visible = true;
      this.cursor.curMarker.visible = true;
      this.cursor.nextMarker.visible = true;
    }
  }
}

export default TypeState;
