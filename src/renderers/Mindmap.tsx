import type { MindmapVisual } from '../domain/types';
import { SvgText, anim } from './svgText';

export function MindmapRenderer({ v, step, uid }: { v: MindmapVisual; step: number; uid: string }) {
  const W = 1400;
  const H = 900;
  const cx = W / 2;
  const cy = H / 2;
  const n = v.branches.length;
  const RX = 400;
  const RY = 270;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fm-svg" role="img" aria-labelledby={`${uid}-t ${uid}-d`}>
      <title id={`${uid}-t`}>{v.title}</title>
      <desc id={`${uid}-d`}>{v.description}</desc>
      {v.branches.map((b, i) => {
        if (b.step > step) return null;
        const ang = -Math.PI / 2 + ((2 * Math.PI) / n) * i;
        const bx = cx + RX * Math.cos(ang);
        const by = cy + RY * Math.sin(ang);
        const a = anim(b.step, step);
        const kids = b.children ?? [];
        return (
          <g key={b.id} className={a.className} style={a.style}>
            <path
              d={`M${cx},${cy} Q${(cx + bx) / 2 + 40 * Math.sin(ang)},${(cy + by) / 2 - 40 * Math.cos(ang)} ${bx},${by}`}
              pathLength={1}
              className="fm-line fm-line-thick fm-draw"
            />
            {kids.map((k, j) => {
              const spread = (j - (kids.length - 1) / 2) * 0.32;
              const kx = bx + 175 * Math.cos(ang + spread);
              const ky = by + 120 * Math.sin(ang + spread);
              return (
                <g key={j} className="fm-pop fm-delay">
                  <path
                    d={`M${bx},${by} L${kx},${ky}`}
                    pathLength={1}
                    className="fm-line fm-line-thin fm-draw"
                  />
                  <rect x={kx - 80} y={ky - 20} width={160} height={40} rx={20} className="fm-chip" />
                  <SvgText x={kx} y={ky} text={k} maxChars={18} maxLines={1} className="fm-chip-text" />
                </g>
              );
            })}
            <g className="fm-pop">
              <rect x={bx - 115} y={by - 38} width={230} height={76} rx={38} className="fm-shape fm-node" />
              <SvgText
                x={bx}
                y={by}
                text={b.label}
                maxChars={18}
                maxLines={2}
                lineHeight={24}
                className="fm-label"
              />
            </g>
          </g>
        );
      })}
      <g className="fm-pop">
        <circle cx={cx} cy={cy} r={110} className="fm-shape fm-node fm-center" />
        <SvgText x={cx} y={cy} text={v.center} maxChars={12} maxLines={3} className="fm-label fm-label-big" />
      </g>
    </svg>
  );
}
