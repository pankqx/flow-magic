import { useCallback, useEffect, useRef, useState } from 'react';

/* Minimal typings for the Web Speech API (not in lib.dom for all TS versions). */
interface SRAlternative {
  transcript: string;
}
interface SRResult {
  isFinal: boolean;
  0: SRAlternative;
}
interface SREvent {
  resultIndex: number;
  results: ArrayLike<SRResult>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function ctor(): (new () => SpeechRecognitionLike) | undefined {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => SpeechRecognitionLike) | undefined;
}

export const speechSupported = () => typeof window !== 'undefined' && !!ctor();

export type SpeechStatus = 'off' | 'listening' | 'error' | 'unsupported';

/**
 * Continuous speech recognition via the browser (Chrome/Edge). Starts only when `enabled`
 * becomes true (an explicit click); restarts itself when the browser ends a session.
 */
export function useSpeech(enabled: boolean, lang: string, onFinal: (text: string) => void) {
  const [status, setStatus] = useState<SpeechStatus>(speechSupported() ? 'off' : 'unsupported');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string>();
  const finalRef = useRef(onFinal);
  finalRef.current = onFinal;
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const stop = useCallback(() => {
    const r = recRef.current;
    recRef.current = null;
    if (r) {
      r.onend = null;
      r.abort();
    }
    setInterim('');
  }, []);

  useEffect(() => {
    const C = ctor();
    if (!C) return;
    if (!enabled) {
      stop();
      setStatus('off');
      return;
    }
    let cancelled = false;
    let failures = 0;
    const start = () => {
      if (cancelled) return;
      const r = new C();
      r.lang = lang;
      r.continuous = true;
      r.interimResults = true;
      r.onresult = (e) => {
        failures = 0;
        let live = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i]!;
          const t = res[0].transcript;
          if (res.isFinal) {
            if (t.trim()) finalRef.current(t.trim());
          } else live += t;
        }
        setInterim(live.trim());
      };
      r.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        failures++;
        const msg =
          e.error === 'not-allowed' || e.error === 'service-not-allowed'
            ? 'Microphone permission was blocked. Allow it in the address bar and turn Listen on again.'
            : e.error === 'network'
              ? 'Speech recognition needs an internet connection (Chrome sends audio to Google to transcribe it).'
              : `Speech recognition error: ${e.error}`;
        setError(msg);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || failures > 3) {
          cancelled = true;
          setStatus('error');
        }
      };
      r.onend = () => {
        // Chrome ends sessions after silence; keep listening until the user turns it off.
        if (!cancelled) setTimeout(start, 250);
      };
      recRef.current = r;
      try {
        r.start();
        setStatus('listening');
        setError(undefined);
      } catch {
        /* already started */
      }
    };
    start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [enabled, lang, stop]);

  return { status, interim, error };
}
