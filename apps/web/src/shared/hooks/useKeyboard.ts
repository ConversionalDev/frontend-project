import { useEffect, useRef } from 'react';

type Handlers = Partial<Record<string, (e: KeyboardEvent) => void>>;

type Options = {
  ignoreElements?: string[];
};

const DEFAULT_IGNORE: string[] = ['INPUT', 'TEXTAREA', 'SELECT'];

export const useKeyboard = (handlers: Handlers, options: Options = {}) => {
  const { ignoreElements = DEFAULT_IGNORE } = options;
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (ignoreElements.includes(tag)) return;
      handlersRef.current[e.code]?.(e);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ignoreElements]);
};
