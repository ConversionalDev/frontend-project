import type { Dispatch } from 'react';
import { NudgeRow } from './NudgeRow';
import { Section } from './Section';
import type { EditorAction } from '../types';

type Props = {
  count: number;
  selectedIds: string[];
  dispatch: Dispatch<EditorAction>;
};

export const MultiLinePanel = ({ count, selectedIds, dispatch }: Props) => (
  <>
    <p className="text-sm font-medium">{count} lines selected</p>
    <Section label="Nudge all">
      <NudgeRow
        onNudge={(deltaMs) =>
          dispatch({
            type: 'SEGMENTS_NUDGED',
            payload: { lineIds: selectedIds, deltaMs },
          })
        }
      />
    </Section>
  </>
);
