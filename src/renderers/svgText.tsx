/** Greedy word wrap for SVG labels (SVG has no automatic wrapping). */
export function wrap(text: string, maxChars: number, maxLines = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1]!.replace(/.{0,1}$/, '…');
    return kept;
  }
  return lines;
}

interface Props {
  x: number;
  y: number;
  text: string;
  maxChars: number;
  lineHeight?: number;
  className?: string;
  maxLines?: number;
  anchor?: 'start' | 'middle' | 'end';
}

/** Multi-line text vertically centred on (x, y). Text is always rendered as text, never as markup. */
export function SvgText({
  x,
  y,
  text,
  maxChars,
  lineHeight = 26,
  className,
  maxLines,
  anchor = 'middle',
}: Props) {
  const lines = wrap(text, maxChars, maxLines);
  const top = y - ((lines.length - 1) * lineHeight) / 2;
  return (
    <text x={x} y={top} className={className} textAnchor={anchor} dominantBaseline="central">
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : lineHeight}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

/** Arrowhead marker; each SVG defines its own so ids never collide between stage and thumbnails. */
export function ArrowDefs({ id }: { id: string }) {
  return (
    <defs>
      <marker
        id={id}
        viewBox="0 0 12 12"
        refX="10"
        refY="6"
        markerWidth="9"
        markerHeight="9"
        orient="auto-start-reverse"
      >
        <path d="M1,1 L11,6 L1,11 z" className="fm-arrowhead" />
      </marker>
      <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** Animation helper: elements revealed at the current step get the "enter" class; --d staggers them. */
export function anim(
  step: number,
  current: number,
  delayIndex = 0,
): { className: string; style?: React.CSSProperties } {
  return step === current
    ? { className: 'fm-enter', style: { ['--d' as string]: `${delayIndex * 110}ms` } as React.CSSProperties }
    : { className: '' };
}
