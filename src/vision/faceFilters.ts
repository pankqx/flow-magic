/** Face filters drawn with canvas paths/emoji at MediaPipe face-landmark positions. */
export type FaceFilter = 'none' | 'wizard' | 'shades' | 'crown' | 'cat' | 'mustache' | 'hearts' | 'nerd';

export const FACE_FILTERS: { id: FaceFilter; label: string; emoji: string }[] = [
  { id: 'none', label: 'No face filter', emoji: '🙂' },
  { id: 'wizard', label: 'Wizard hat', emoji: '🧙' },
  { id: 'shades', label: 'Sunglasses', emoji: '😎' },
  { id: 'nerd', label: 'Round glasses', emoji: '🤓' },
  { id: 'crown', label: 'Crown', emoji: '👑' },
  { id: 'cat', label: 'Cat', emoji: '🐱' },
  { id: 'mustache', label: 'Mustache', emoji: '🥸' },
  { id: 'hearts', label: 'Heart eyes', emoji: '😍' },
];

interface Pt {
  x: number;
  y: number;
}

export function drawFaceFilter(
  ctx: CanvasRenderingContext2D,
  lm: Pt[],
  filter: FaceFilter,
  w: number,
  h: number,
) {
  if (filter === 'none' || lm.length < 400) return;
  // Mirrored video: flip x.
  const P = (i: number): Pt => ({ x: (1 - lm[i]!.x) * w, y: lm[i]!.y * h });
  const eyeR = P(33);
  const eyeL = P(263);
  const eyeRc = mid(P(33), P(133));
  const eyeLc = mid(P(362), P(263));
  const eyeDist = Math.hypot(eyeL.x - eyeR.x, eyeL.y - eyeR.y);
  const angle = Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x);
  const forehead = P(10);
  const bridge = P(168);
  ctx.save();
  switch (filter) {
    case 'shades': {
      ctx.translate(bridge.x, bridge.y);
      ctx.rotate(angle);
      const lw = eyeDist * 0.62;
      const lh = eyeDist * 0.42;
      ctx.fillStyle = 'rgba(12,12,20,0.92)';
      ctx.strokeStyle = '#222';
      ctx.lineWidth = eyeDist * 0.06;
      for (const s of [-1, 1]) {
        roundRect(ctx, s * eyeDist * 0.5 - lw / 2, -lh / 2, lw, lh, lh * 0.35);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(s * eyeDist * 0.5 - lw * 0.32, -lh * 0.3, lw * 0.2, lh * 0.12);
        ctx.fillStyle = 'rgba(12,12,20,0.92)';
      }
      ctx.beginPath();
      ctx.moveTo(-eyeDist * 0.19, -lh * 0.15);
      ctx.lineTo(eyeDist * 0.19, -lh * 0.15);
      ctx.stroke();
      break;
    }
    case 'nerd': {
      ctx.translate(bridge.x, bridge.y);
      ctx.rotate(angle);
      ctx.strokeStyle = '#3b2412';
      ctx.lineWidth = eyeDist * 0.07;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * eyeDist * 0.5, 0, eyeDist * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-eyeDist * 0.2, 0);
      ctx.quadraticCurveTo(0, -eyeDist * 0.12, eyeDist * 0.2, 0);
      ctx.stroke();
      break;
    }
    case 'crown':
      emoji(ctx, '👑', forehead.x, forehead.y - eyeDist * 0.75, eyeDist * 1.5, angle);
      break;
    case 'wizard': {
      ctx.translate(forehead.x, forehead.y);
      ctx.rotate(angle);
      const base = eyeDist * 2.3;
      const tall = eyeDist * 2.6;
      ctx.fillStyle = '#3a2a8c';
      ctx.beginPath();
      ctx.moveTo(-base / 2, -eyeDist * 0.15);
      ctx.quadraticCurveTo(-base * 0.05, -tall * 0.6, base * 0.18, -tall);
      ctx.quadraticCurveTo(base * 0.1, -tall * 0.5, base / 2, -eyeDist * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2b1f6b';
      ctx.beginPath();
      ctx.ellipse(0, -eyeDist * 0.12, base * 0.62, eyeDist * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd34d';
      for (const [sx, sy, r] of [
        [-0.12, -0.45, 0.14],
        [0.08, -0.7, 0.1],
        [-0.02, -0.25, 0.08],
      ] as const)
        star(ctx, sx * base, sy * tall, r * eyeDist);
      break;
    }
    case 'cat': {
      const earY = forehead.y - eyeDist * 0.35;
      ctx.translate(forehead.x, earY);
      ctx.rotate(angle);
      for (const s of [-1, 1]) {
        ctx.fillStyle = '#2d2a2a';
        tri(ctx, s * eyeDist * 0.85, 0, eyeDist * 0.7, eyeDist * 0.95, s);
        ctx.fillStyle = '#f4a6b7';
        tri(ctx, s * eyeDist * 0.85, -eyeDist * 0.05, eyeDist * 0.4, eyeDist * 0.55, s);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const nose = P(1);
      ctx.fillStyle = '#f4a6b7';
      ctx.beginPath();
      ctx.ellipse(nose.x, nose.y, eyeDist * 0.14, eyeDist * 0.1, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = Math.max(2, eyeDist * 0.025);
      for (const s of [-1, 1])
        for (const dy of [-0.1, 0.05, 0.2]) {
          ctx.beginPath();
          ctx.moveTo(nose.x + s * eyeDist * 0.25, nose.y + eyeDist * 0.1);
          ctx.lineTo(nose.x + s * eyeDist * 0.95, nose.y + eyeDist * dy);
          ctx.stroke();
        }
      break;
    }
    case 'mustache': {
      const lip = mid(P(164), P(0));
      ctx.translate(lip.x, lip.y);
      ctx.rotate(angle);
      ctx.fillStyle = '#2a1a10';
      const s = eyeDist * 0.55;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.15);
      ctx.bezierCurveTo(s * 0.5, -s * 0.55, s * 1.1, -s * 0.2, s * 1.2, -s * 0.5);
      ctx.bezierCurveTo(s * 1.2, s * 0.15, s * 0.5, s * 0.3, 0, s * 0.05);
      ctx.bezierCurveTo(-s * 0.5, s * 0.3, -s * 1.2, s * 0.15, -s * 1.2, -s * 0.5);
      ctx.bezierCurveTo(-s * 1.1, -s * 0.2, -s * 0.5, -s * 0.55, 0, -s * 0.15);
      ctx.fill();
      break;
    }
    case 'hearts':
      emoji(ctx, '❤️', eyeRc.x, eyeRc.y, eyeDist * 0.6, angle);
      emoji(ctx, '❤️', eyeLc.x, eyeLc.y, eyeDist * 0.6, angle);
      break;
  }
  ctx.restore();
}

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function emoji(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, size: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, 0, 0);
  ctx.restore();
}
function tri(ctx: CanvasRenderingContext2D, cx: number, by: number, w: number, h: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, by);
  ctx.lineTo(cx + s * w * 0.15, by - h);
  ctx.lineTo(cx + w / 2, by);
  ctx.closePath();
  ctx.fill();
}
export function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
}
