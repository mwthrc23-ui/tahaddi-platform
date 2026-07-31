import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const removedDemoArtifacts = [
  './demo',
  '../components/demo',
  '../data/demo-questions.ts',
  '../lib/session-store.ts',
];

describe('legacy demo cleanup', () => {
  it.each(removedDemoArtifacts)('removes %s from the source tree', (relativePath) => {
    expect(existsSync(fileURLToPath(new URL(relativePath, import.meta.url)))).toBe(false);
  });
});
