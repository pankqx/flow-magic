import type { FlowVisual } from '../domain/types';
import { ArrowDefs, SvgText, anim } from './svgText';

const COL_W = 330;
const ROW_H = 170;
const NW = 220;
const NH = 84;
const PAD = 60;

type Node = FlowVisual['nodes'][number];

function center(n: Node) {
  return { x: PAD + (n.col - 1) * COL_W + NW / 2, y: PAD + (n.row - 1) * ROW_H + NH / 2 };
}

/** Point where the ray from the box centre toward (tx,ty) leaves the box. */
function boxExit(cx: number, cy: number, tx: number, ty: number, w = NW / 2 + 6, h = NH / 2 + 6) {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const s = Math.min(dx === 0 ? Infinity : w / Math.abs(dx), dy === 0 ? Infinity : h / Math.abs(dy));
  return { x: cx + dx * s, y: cy + dy * s };
}

function Shape({ n, id }: { n: Node; id: string }) {
  const x = PAD + (n.col - 1) * COL_W;
  const y = PAD + (n.row - 1) * ROW_H;
  const kind = n.kind ?? 'process';
  switch (kind) {
    case 'store': // cylinder
      return (
        <g className="fm-node fm-node-store">
          <path
            d={`M${x},${y + 14} a${NW / 2},14 0 0,0 ${NW},0 v${NH - 28} a${NW / 2},14 0 0,1 ${-NW},0 z`}
            className="fm-shape"
          />
          <ellipse cx={x + NW / 2} cy={y + 14} rx={NW / 2} ry={14} className="fm-shape fm-shape-cap" />
        </g>
      );
    case 'external': // parallelogram
      return (
        <polygon
          className="fm-node fm-shape fm-node-external"
          points={`${x + 18},${y} ${x + NW},${y} ${x + NW - 18},${y + NH} ${x},${y + NH}`}
        />
      );
    case 'output': // pill with double border
      return (
        <g className="fm-node fm-node-output">
          <rect
            x={x}
            y={y}
            width={NW}
            height={NH}
            rx={NH / 2}
            className="fm-shape"
            filter={`url(#${id}-glow)`}
          />
          <rect
            x={x + 6}
            y={y + 6}
            width={NW - 12}
            height={NH - 12}
            rx={(NH - 12) / 2}
            className="fm-shape-inner"
          />
        </g>
      );
    default:
      return <rect className="fm-node fm-shape fm-node-process" x={x} y={y} width={NW} height={NH} rx={14} />;
  }
}

export function FlowRenderer({ v, step, uid }: { v: FlowVisual; step: number; uid: string }) {
  const byId = new Map(v.nodes.map((n) => [n.id, n]));
  const maxCol = Math.max(...v.nodes.map((n) => n.col));
  const maxRow = Math.max(...v.nodes.map((n) => n.row));
  const W = PAD * 2 + (maxCol - 1) * COL_W + NW;
  const H = PAD * 2 + (maxRow - 1) * ROW_H + NH + 20;
  const visibleNodes = v.nodes.filter((n) => n.step <= step);
  const edges = v.edges
    .map((e) => {
      const a = byId.get(e.from)!;
      const b = byId.get(e.to)!;
      return { e, a, b, at: Math.max(e.step, a.step, b.step) };
    })
    .filter((x) => x.at <= step);
  const marker = `${uid}-arrow`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fm-svg" role="img" aria-labelledby={`${uid}-t ${uid}-d`}>
      <title id={`${uid}-t`}>{v.title}</title>
      <desc id={`${uid}-d`}>{v.description}</desc>
      <ArrowDefs id={marker} />
      {edges.map(({ e, a, b, at }, i) => {
        const ca = center(a);
        const cb = center(b);
        const p1 = boxExit(ca.x, ca.y, cb.x, cb.y);
        const p2 = boxExit(cb.x, cb.y, ca.x, ca.y);
        const horizontal = Math.abs(p2.x - p1.x) >= Math.abs(p2.y - p1.y);
        const k = horizontal ? (p2.x - p1.x) * 0.4 : (p2.y - p1.y) * 0.4;
        const d = horizontal
          ? `M${p1.x},${p1.y} C${p1.x + k},${p1.y} ${p2.x - k},${p2.y} ${p2.x},${p2.y}`
          : `M${p1.x},${p1.y} C${p1.x},${p1.y + k} ${p2.x},${p2.y - k} ${p2.x},${p2.y}`;
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const a2 = anim(at, step, i);
        return (
          <g key={e.id} className={`fm-edge ${a2.className}`} style={a2.style}>
            <path d={d} pathLength={1} className="fm-line fm-draw" markerEnd={`url(#${marker})`} />
            {e.label && (
              <g className="fm-edge-label">
                <rect
                  x={mx - e.label.length * 5.4 - 10}
                  y={my - 16}
                  width={e.label.length * 10.8 + 20}
                  height={30}
                  rx={15}
                />
                <text x={mx} y={my} textAnchor="middle" dominantBaseline="central">
                  {e.label}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {visibleNodes.map((n, i) => {
        const c = center(n);
        const a = anim(n.step, step, i);
        return (
          <g key={n.id} className={`fm-pop ${a.className}`} style={a.style}>
            <Shape n={n} id={marker} />
            <SvgText x={c.x} y={c.y} text={n.label} maxChars={18} className="fm-label" />
          </g>
        );
      })}
    </svg>
  );
}
