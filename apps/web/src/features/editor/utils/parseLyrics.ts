import { generateId } from '../../../shared/utils';
import type { Line } from '../types';

export const parseLyrics = (raw: string): Line[] =>
  raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((text, index) => ({ id: generateId(), index, text }));
