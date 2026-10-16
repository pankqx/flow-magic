import type { SequenceVisual } from '../domain/types';
import { ArrowDefs, SvgText, anim } from './svgText';

const LANE = 300;
const TOP = 40;
const HEAD_H = 70;
const MSG_GAP = 92;

export function SequenceRenderer({ v, step, uid }: { v: SequenceVisual; step: number; uid: string }) {
  const n = v.actors.length;
  const W = Math.max(n * LANE, 720);
  const lane = W / n;
  const x = new Map(v.actors.map((a, i) => [a.id, lane * i + lane / 2]));
  const H = TOP + HEAD_H + 50 + v.messages.length * MSG_GAP + 30;
  const marker = `${uid}-arrow`;
  const shown = v.messages.filter((m) => m.step <= step);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fm-svg" role="img" aria-labelledby={`${uid}-t ${uid}-d`}>
      <title id={`${uid}-t`}>{v.title}</title>
      <desc id={`${uid}-d`}>{v.description}</desc>
      <ArrowDefs id={marker} />
      {v.actors.map((a) => {
        const cx = x.get(a.id)!;
        return (
          <g key={a.id} className="fm-actor">
            <line x1={cx} x2={cx} y1={TOP + HEAD_H} y2={H - 10} className="fm-lifeline" />
            <rect x={cx - 110} y={TOP} width={220} height={HEAD_H} rx={16} className="fm-shape fm-node" />
            <SvgText
              x={cx}
              y={TOP + HEAD_H / 2}
              text={a.label}
              maxChars={18}
              className="fm-label"
              maxLines={2}
            />
          </g>
        );
      })}
      {shown.map((m, i) => {
        const y = TOP + HEAD_H + 60 + i * MSG_GAP;
        const x1 = x.get(m.from)!;
        const x2 = x.get(m.to)!;
        const dir = Math.sign(x2 - x1);
        const a = anim(m.step, step);
        return (
          <g key={m.id} className={`fm-msg ${a.className}`} style={a.style}>
            <circle cx={x1} cy={y} r={7} className="fm-dot" />
            <path
              d={`M${x1 + dir * 10},${y} L${x2 - dir * 6},${y}`}
              pathLength={1}
              className="fm-line fm-draw"
              markerEnd={`url(#${marker})`}
            />
            <text x={(x1 + x2) / 2} y={y - 18} textAnchor="middle" className="fm-msg-label fm-fade">
              {m.label}
            </text>
            <text
              x={Math.min(x1, x2) - 0}
              y={y + 4}
              className="fm-step-num fm-fade"
              textAnchor="end"
              dx={-18}
            >
              {m.step}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
