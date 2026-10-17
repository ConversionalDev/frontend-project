import { useState } from 'react';
import { api, ApiError } from '../../../api';
import { ErrorMessage } from '../../../shared/components';
import { CustomTrackForm, WaveformDecor } from '../components';
import { apiTrackToPayload, payloadToInitialState } from '../utils';
import type { ApiTrack, EditorState, TrackLoadedPayload } from '../types';

type Tab = 'seeded' | 'custom';

type Props = {
  onLoad: (state: EditorState) => void;
};

export const LoadScreen = ({ onLoad }: Props) => {
  const [tab, setTab] = useState<Tab>('seeded');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSeeded = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<ApiTrack>('/api/v1/track');
      onLoad(payloadToInitialState(apiTrackToPayload(data)));
    } catch (err) {
      const body =
        err instanceof ApiError ? (err.body as Record<string, unknown>) : null;
      setError(
        String(
          body?.hint ??
            body?.error ??
            (err instanceof Error ? err.message : err),
        ),
      );
      setLoading(false);
    }
  };

  const handleCustomLoad = (payload: TrackLoadedPayload) =>
    onLoad(payloadToInitialState(payload));

  const tabClass = (t: Tab) =>
    `flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
      tab === t
        ? 'bg-accent text-accent-contrast'
        : 'text-muted hover:text-text'
    }`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-8">
      <div className="text-center mb-10">
        <div className="text-3xl mb-3 text-accent">♫</div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Lyric Alignment Editor
        </h1>
        <p className="text-muted text-sm mt-1">
          Stamp lyrics to audio in real time
        </p>
      </div>

      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 flex flex-col gap-6">
        <div className="flex gap-1 p-1 bg-bg rounded-lg border border-border">
          <button
            className={tabClass('seeded')}
            onClick={() => setTab('seeded')}
          >
            Seeded track
          </button>
          <button
            className={tabClass('custom')}
            onClick={() => setTab('custom')}
          >
            Your own
          </button>
        </div>

        {tab === 'seeded' && (
          <div className="flex flex-col gap-5">
            <WaveformDecor />
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">You Verse You</h2>
              <p className="text-sm text-muted">
                AI Generated · 2:05 · 28 lines
              </p>
            </div>
            {error && <ErrorMessage message={error} />}
            <button
              onClick={loadSeeded}
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-accent text-accent-contrast font-medium text-sm border-transparent hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Loading…' : 'Open track →'}
            </button>
          </div>
        )}

        {tab === 'custom' && <CustomTrackForm onLoad={handleCustomLoad} />}
      </div>
    </div>
  );
};
