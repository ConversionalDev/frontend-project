let counter = 0;

export const generateId = (prefix = 'line'): string =>
  `${prefix}-${Date.now()}-${++counter}`;
