import type { LayersVisual, ListVisual } from '../domain/types';
import { SvgText, anim } from './svgText';

export function LayersRenderer({ v, step, uid }: { v: LayersVisual; step: number; uid: string }) {
  const W = 1100;
  const BH = 70;
  const GAP = 14;
  const H = 40 + v.layers.length * (BH + GAP);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fm-svg" role="img" aria-labelledby={`${uid}-t ${uid}-d`}>
      <title id={`${uid}-t`}>{v.title}</title>
      <desc id={`${uid}-d`}>{v.description}</desc>
      {v.layers.map((l, i) => {
        if (l.step > step) return null;
        const y = 20 + i * (BH + GAP);
        const inset = i * 10;
        const a = anim(l.step, step);
        return (
          <g key={l.id} className={`fm-slide ${a.className}`} style={a.style}>
            <rect
              x={60 + inset}
              y={y}
              width={W - 120 - inset * 2}
              height={BH}
              rx={14}
              className="fm-shape fm-node"
            />
            <rect x={60 + inset} y={y} width={10} height={BH} rx={5} className="fm-accent-bar" />
            <text
              x={100 + inset}
              y={y + BH / 2}
              dominantBaseline="central"
              className="fm-label fm-label-left"
            >
              {l.label}
            </text>
            {l.detail && (
              <text
                x={W - 90 - inset}
                y={y + BH / 2}
                dominantBaseline="central"
                textAnchor="end"
                className="fm-detail"
              >
                {l.detail}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function ListRenderer({ v, step, uid }: { v: ListVisual; step: number; uid: string }) {
  const W = 1100;
  const BH = 86;
  const GAP = 18;
  const H = 30 + v.items.length * (BH + GAP);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fm-svg" role="img" aria-labelledby={`${uid}-t ${uid}-d`}>
      <title id={`${uid}-t`}>{v.title}</title>
      <desc id={`${uid}-d`}>{v.description}</desc>
      {v.items.map((it, i) => {
        if (it.step > step) return null;
        const y = 15 + i * (BH + GAP);
        const a = anim(it.step, step);
        return (
          <g key={it.id} className={`fm-slide ${a.className}`} style={a.style}>
            <rect x={40} y={y} width={W - 80} height={BH} rx={18} className="fm-shape fm-node" />
            <circle cx={95} cy={y + BH / 2} r={26} className="fm-badge" />
            <text
              x={95}
              y={y + BH / 2}
              textAnchor="middle"
              dominantBaseline="central"
              className="fm-badge-text"
            >
              {v.ordered === false ? '•' : i + 1}
            </text>
            <text
              x={145}
              y={y + (it.detail ? BH / 2 - 14 : BH / 2)}
              dominantBaseline="central"
              className="fm-label fm-label-left"
            >
              {it.label}
            </text>
            {it.detail && (
              <SvgText
                x={145}
                y={y + BH / 2 + 18}
                text={it.detail}
                maxChars={80}
                anchor="start"
                lineHeight={20}
                maxLines={1}
                className="fm-detail"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
