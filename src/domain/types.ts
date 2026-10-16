import type { z } from 'zod';
import type * as s from './schema';

export type ConceptEntry = z.infer<typeof s.conceptEntry>;
export type Category = ConceptEntry['category'];
export type FlowVisual = z.infer<typeof s.flowVisual>;
export type SequenceVisual = z.infer<typeof s.sequenceVisual>;
export type CycleVisual = z.infer<typeof s.cycleVisual>;
export type LayersVisual = z.infer<typeof s.layersVisual>;
export type ListVisual = z.infer<typeof s.listVisual>;
export type MindmapVisual = z.infer<typeof s.mindmapVisual>;
export type Visual = z.infer<typeof s.anyVisual>;

export type MatchResult =
  | { status: 'match'; conceptId: string; tier: 1 | 2 }
  | { status: 'ambiguous'; candidates: string[] }
  | { status: 'none'; suggestions: string[] }
  | { status: 'invalid'; reason: 'empty' | 'too_long' | 'no_content' };

export interface Picture {
  title: string;
  imageUrl: string;
  caption: string;
  credit: string;
  pageUrl?: string;
}

/** One thing that can be on stage. */
export type StageItem =
  | { kind: 'visual'; id: string; visual: Visual; origin: 'curated' | 'ai'; conceptId?: string }
  | { kind: 'picture'; id: string; picture: Picture };

export type ItemSource = 'typed' | 'library' | 'suggestion' | 'speech' | 'gesture' | 'ai';
