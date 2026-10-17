import { createContext, useContext, useState, type ReactNode } from 'react';

type TimeContextValue = {
  currentTimeMs: number;
  setCurrentTimeMs: (ms: number) => void;
};

const TimeContext = createContext<TimeContextValue | null>(null);

export const TimeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  return (
    <TimeContext.Provider value={{ currentTimeMs, setCurrentTimeMs }}>
      {children}
    </TimeContext.Provider>
  );
};

export const useTime = (): TimeContextValue => {
  const ctx = useContext(TimeContext);
  if (!ctx) throw new Error('useTime must be used inside TimeProvider');
  return ctx;
};
