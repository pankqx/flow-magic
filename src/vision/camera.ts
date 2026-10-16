import type { FaceLandmarker, GestureRecognizer, ImageSegmenter } from '@mediapipe/tasks-vision';
import { drawFaceFilter, star, type FaceFilter } from './faceFilters';
import type { HandFrame } from './gestures';

export type ColorFilter = 'none' | 'noir' | 'vintage' | 'pop' | 'alien' | 'xray' | 'cool' | 'warm';
export const COLOR_FILTERS: { id: ColorFilter; label: string; css: string }[] = [
  { id: 'none', label: 'Natural', css: 'none' },
  { id: 'noir', label: 'Noir', css: 'grayscale(1) contrast(1.25)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.75) contrast(1.05) saturate(1.2)' },
  { id: 'pop', label: 'Pop', css: 'saturate(1.9) contrast(1.15)' },
  { id: 'cool', label: 'Cool', css: 'hue-rotate(-12deg) saturate(1.2) brightness(1.05)' },
  { id: 'warm', label: 'Warm', css: 'sepia(0.3) saturate(1.4) hue-rotate(-8deg)' },
  { id: 'alien', label: 'Alien', css: 'hue-rotate(160deg) saturate(1.6)' },
  { id: 'xray', label: 'X-ray', css: 'grayscale(1) invert(1) contrast(1.3)' },
];

export interface CameraOptions {
  gestures: boolean;
  face: FaceFilter;
  color: ColorFilter;
  removeBackground: boolean;
  wand: boolean;
}

const MODELS = {
  gesture:
    'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
  face: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  segment:
    'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
};

type Status = { state: 'off' | 'starting' | 'loading' | 'on' | 'error'; message?: string };

/**
 * Owns the webcam stream and the MediaPipe tasks. Models load lazily the first time a
 * feature needs them. Draws a mirrored, filtered frame onto `canvas` each video frame.
 */
export class CameraEngine {
  opts: CameraOptions = { gestures: true, face: 'none', color: 'none', removeBackground: false, wand: true };
  onHand?: (f: HandFrame | undefined) => void;
  onStatus?: (s: Status) => void;

  private video = document.createElement('video');
  private stream?: MediaStream;
  private raf = 0;
  private vision?: Promise<unknown>;
  private gesture?: GestureRecognizer;
  private face?: FaceLandmarker;
  private seg?: ImageSegmenter;
  private loading = new Set<string>();
  private off = document.createElement('canvas');
  private trail: { x: number; y: number; t: number }[] = [];
  private lastTs = -1;

  constructor(private canvas: HTMLCanvasElement) {
    this.video.playsInline = true;
    this.video.muted = true;
  }

  async start() {
    this.onStatus?.({ state: 'starting' });
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
    } catch (e) {
      this.onStatus?.({ state: 'error', message: 'Camera permission was blocked or no camera was found.' });
      throw e;
    }
    this.video.srcObject = this.stream;
    await this.video.play();
    this.canvas.width = this.video.videoWidth || 640;
    this.canvas.height = this.video.videoHeight || 480;
    this.onStatus?.({ state: 'on' });
    this.ensureModels();
    this.loop();
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
    this.onHand?.(undefined);
    this.onStatus?.({ state: 'off' });
  }

  setOptions(o: Partial<CameraOptions>) {
    this.opts = { ...this.opts, ...o };
    if (this.stream) this.ensureModels();
  }

  private fileset() {
    if (!this.vision) {
      this.vision = import('@mediapipe/tasks-vision').then((m) =>
        m.FilesetResolver.forVisionTasks(`${import.meta.env.BASE_URL}mediapipe`),
      );
    }
    return this.vision;
  }

  private async load(name: 'gesture' | 'face' | 'segment') {
    if (this.loading.has(name)) return;
    this.loading.add(name);
    this.onStatus?.({
      state: 'loading',
      message: `Loading ${name === 'segment' ? 'background removal' : name} model…`,
    });
    try {
      const m = await import('@mediapipe/tasks-vision');
      const fs = (await this.fileset()) as Parameters<typeof m.GestureRecognizer.createFromOptions>[0];
      const create = async (delegate: 'GPU' | 'CPU') => {
        if (name === 'gesture')
          this.gesture = await m.GestureRecognizer.createFromOptions(fs, {
            baseOptions: { modelAssetPath: MODELS.gesture, delegate },
            runningMode: 'VIDEO',
            numHands: 1,
          });
        else if (name === 'face')
          this.face = await m.FaceLandmarker.createFromOptions(fs, {
            baseOptions: { modelAssetPath: MODELS.face, delegate },
            runningMode: 'VIDEO',
            numFaces: 1,
          });
        else
          this.seg = await m.ImageSegmenter.createFromOptions(fs, {
            baseOptions: { modelAssetPath: MODELS.segment, delegate },
            runningMode: 'VIDEO',
            outputConfidenceMasks: true,
            outputCategoryMask: false,
          });
      };
      try {
        await create('GPU');
      } catch {
        await create('CPU');
      }
      this.onStatus?.({ state: 'on' });
    } catch {
      this.loading.delete(name);
      this.onStatus?.({
        state: 'error',
        message: `Couldn't load the ${name} model (needs internet the first time).`,
      });
    }
  }

  private ensureModels() {
    if (this.opts.gestures || this.opts.wand) void this.load('gesture');
    if (this.opts.face !== 'none') void this.load('face');
    if (this.opts.removeBackground) void this.load('segment');
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const v = this.video;
    if (v.readyState < 2) return;
    let ts = performance.now();
    if (ts <= this.lastTs) ts = this.lastTs + 1;
    this.lastTs = ts;
    const { width: w, height: h } = this.canvas;
    const ctx = this.canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);

    // 1. Video (optionally with background removed), mirrored and colour-filtered.
    const filterCss = COLOR_FILTERS.find((f) => f.id === this.opts.color)?.css ?? 'none';
    if (this.opts.removeBackground && this.seg) {
      const off = this.off;
      off.width = w;
      off.height = h;
      const octx = off.getContext('2d', { willReadFrequently: true })!;
      octx.drawImage(v, 0, 0, w, h);
      const res = this.seg.segmentForVideo(v, ts);
      const mask = res.confidenceMasks?.[0];
      if (mask) {
        const conf = mask.getAsFloat32Array();
        const img = octx.getImageData(0, 0, w, h);
        const mw = mask.width;
        const mh = mask.height;
        for (let y = 0; y < h; y++) {
          const my = Math.floor((y * mh) / h) * mw;
          for (let x = 0; x < w; x++) {
            const c = conf[my + Math.floor((x * mw) / w)] ?? 0;
            // selfie_segmenter: confidence of "person"; soften the edge.
            img.data[(y * w + x) * 4 + 3] = Math.max(0, Math.min(255, (c - 0.35) * 600));
          }
        }
        octx.putImageData(img, 0, 0);
        mask.close();
      }
      res.close?.();
      this.drawMirrored(ctx, off, filterCss);
    } else {
      this.drawMirrored(ctx, v, filterCss);
    }

    // 2. Face filter.
    if (this.opts.face !== 'none' && this.face) {
      const r = this.face.detectForVideo(v, ts);
      const lm = r.faceLandmarks?.[0];
      if (lm) drawFaceFilter(ctx, lm, this.opts.face, w, h);
    }

    // 3. Hands: gestures + magic-wand sparkle on the index fingertip.
    if ((this.opts.gestures || this.opts.wand) && this.gesture) {
      const r = this.gesture.recognizeForVideo(v, ts);
      const hand = r.landmarks?.[0];
      if (hand) {
        const d = (a: number, b: number) => Math.hypot(hand[a]!.x - hand[b]!.x, hand[a]!.y - hand[b]!.y);
        const size = d(0, 9) || 1;
        const cat = r.gestures?.[0]?.[0];
        if (this.opts.gestures)
          this.onHand?.({
            gesture: cat?.categoryName ?? 'None',
            score: cat?.score ?? 0,
            pinch: d(4, 8) / size,
            t: ts,
          });
        if (this.opts.wand) this.trail.push({ x: (1 - hand[8]!.x) * w, y: hand[8]!.y * h, t: ts });
      } else if (this.opts.gestures) this.onHand?.(undefined);
    }
    if (this.opts.wand) this.drawTrail(ctx, ts);
  };

  private drawMirrored(ctx: CanvasRenderingContext2D, src: CanvasImageSource, filter: string) {
    const { width: w, height: h } = this.canvas;
    ctx.save();
    ctx.filter = filter;
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0, w, h);
    ctx.restore();
  }

  private drawTrail(ctx: CanvasRenderingContext2D, now: number) {
    this.trail = this.trail.filter((p) => now - p.t < 500);
    ctx.save();
    for (const p of this.trail) {
      const age = (now - p.t) / 500;
      ctx.globalAlpha = 1 - age;
      ctx.fillStyle = age < 0.3 ? '#fff6c2' : '#ffd34d';
      star(ctx, p.x, p.y, 10 * (1 - age) + 3);
    }
    ctx.restore();
  }
}
