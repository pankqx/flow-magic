import type { CycleVisual } from '../domain/types';
import { ArrowDefs, SvgText, anim } from './svgText';

export function CycleRenderer({ v, step, uid }: { v: CycleVisual; step: number; uid: string }) {
  const n = v.nodes.length;
  const R = 230 + n * 12;
  const r = 92;
  const S = (R + r + 60) * 2;
  const c = S / 2;
  const sign = v.direction === 'counterclockwise' ? -1 : 1;
  const pos = (i: number) => {
    const ang = -Math.PI / 2 + sign * ((2 * Math.PI) / n) * i;
    return { x: c + R * Math.cos(ang), y: c + R * Math.sin(ang), ang };
  };
  const marker = `${uid}-arrow`;
  const arcGap = Math.asin((r + 14) / R) * 1.0;
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="fm-svg" role="img" aria-labelledby={`${uid}-t ${uid}-d`}>
      <title id={`${uid}-t`}>{v.title}</title>
      <desc id={`${uid}-d`}>{v.description}</desc>
      <ArrowDefs id={marker} />
      <circle cx={c} cy={c} r={R} className="fm-orbit" />
      {v.nodes.map((node, i) => {
        const next = v.nodes[(i + 1) % n]!;
        if (node.step > step || next.step > step) return null;
        const a0 = pos(i).ang + sign * arcGap;
        const a1 = pos(i + 1).ang - sign * arcGap;
        const p0 = { x: c + R * Math.cos(a0), y: c + R * Math.sin(a0) };
        const p1 = { x: c + R * Math.cos(a1), y: c + R * Math.sin(a1) };
        const a = anim(Math.max(node.step, next.step), step);
        return (
          <path
            key={`arc-${node.id}`}
            d={`M${p0.x},${p0.y} A${R},${R} 0 0,${sign > 0 ? 1 : 0} ${p1.x},${p1.y}`}
            pathLength={1}
            className={`fm-line fm-draw ${a.className}`}
            style={a.style}
            markerEnd={`url(#${marker})`}
          />
        );
      })}
      {v.nodes.map((node, i) => {
        if (node.step > step) return null;
        const p = pos(i);
        const a = anim(node.step, step);
        return (
          <g key={node.id} className={`fm-pop ${a.className}`} style={a.style}>
            <circle cx={p.x} cy={p.y} r={r} className="fm-shape fm-node" />
            <text x={p.x} y={p.y - r + 24} textAnchor="middle" className="fm-step-num">
              {node.step}
            </text>
            <SvgText
              x={p.x}
              y={p.y + (node.detail ? -8 : 4)}
              text={node.label}
              maxChars={13}
              className="fm-label"
              maxLines={2}
            />
            {node.detail && (
              <SvgText
                x={p.x}
                y={p.y + 40}
                text={node.detail}
                maxChars={20}
                lineHeight={18}
                className="fm-detail"
                maxLines={2}
              />
            )}
          </g>
        );
      })}
      <text x={c} y={c} textAnchor="middle" dominantBaseline="central" className="fm-cycle-title">
        {v.title}
      </text>
    </svg>
  );
}
