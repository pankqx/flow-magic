import { useEffect, useRef, useState, type RefObject } from 'react';
import { CameraEngine, type CameraOptions } from '../vision/camera';
import { GestureInterpreter, type GestureAction } from '../vision/gestures';

export type CameraStatus = { state: 'off' | 'starting' | 'loading' | 'on' | 'error'; message?: string };

/**
 * Starts the webcam only while `enabled` is true (an explicit click), forwards option changes
 * to the engine and turns hand frames into gesture actions.
 */
export function useCamera(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
  opts: CameraOptions,
  onGesture: (a: GestureAction) => void,
) {
  const [status, setStatus] = useState<CameraStatus>({ state: 'off' });
  const [hand, setHand] = useState<string>();
  const engineRef = useRef<CameraEngine | undefined>(undefined);
  const gestureRef = useRef(onGesture);
  gestureRef.current = onGesture;
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;
    const engine = new CameraEngine(canvas);
    const interp = new GestureInterpreter();
    let lastHand = '';
    engine.setOptions(optsRef.current);
    engine.onStatus = setStatus;
    engine.onHand = (f) => {
      const label = f ? f.gesture : '';
      if (label !== lastHand) {
        lastHand = label;
        setHand(label || undefined);
      }
      const a = interp.push(f);
      if (a) gestureRef.current(a);
    };
    engineRef.current = engine;
    engine.start().catch(() => {
      /* status already reports the error */
    });
    return () => {
      engine.stop();
      engineRef.current = undefined;
      setHand(undefined);
    };
  }, [enabled, canvasRef]);

  useEffect(() => {
    engineRef.current?.setOptions(opts);
  }, [opts]);

  return { status: enabled ? status : ({ state: 'off' } as CameraStatus), hand };
}
