// Copies MediaPipe's WebAssembly runtime into public/ so the app self-hosts it
// (no remote scripts). Model files are downloaded at runtime only when the camera is turned on.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
const src = 'node_modules/@mediapipe/tasks-vision/wasm';
const dest = 'public/mediapipe';
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}
