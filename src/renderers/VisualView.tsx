import { Component, type ReactNode } from 'react';
import type { Visual } from '../domain/types';
import { FlowRenderer } from './Flow';
import { SequenceRenderer } from './Sequence';
import { CycleRenderer } from './Cycle';
import { LayersRenderer, ListRenderer } from './Layers';
import { MindmapRenderer } from './Mindmap';

/** Pure function of (descriptor, step). */
export function VisualView({ v, step, uid }: { v: Visual; step: number; uid: string }) {
  switch (v.type) {
    case 'flow':
      return <FlowRenderer v={v} step={step} uid={uid} />;
    case 'sequence':
      return <SequenceRenderer v={v} step={step} uid={uid} />;
    case 'cycle':
      return <CycleRenderer v={v} step={step} uid={uid} />;
    case 'layers':
      return <LayersRenderer v={v} step={step} uid={uid} />;
    case 'list':
      return <ListRenderer v={v} step={step} uid={uid} />;
    case 'mindmap':
      return <MindmapRenderer v={v} step={step} uid={uid} />;
  }
}

export class RenderBoundary extends Component<
  { onError: () => void; resetKey: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
