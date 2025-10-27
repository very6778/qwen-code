/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  getFriendlyToolName,
  getBatchedToolTarget,
} from './toolDisplayNames.js';

describe('toolDisplayNames helpers', () => {
  describe('getFriendlyToolName', () => {
    it('returns aliases when defined', () => {
      expect(getFriendlyToolName('ReadFile')).toBe('Read');
      expect(getFriendlyToolName('readManyFiles')).toBe('Read');
    });

    it('falls back to the raw name', () => {
      expect(getFriendlyToolName('CustomTool')).toBe('CustomTool');
    });
  });

  describe('getBatchedToolTarget', () => {
    it('returns the full description as-is', () => {
      expect(getBatchedToolTarget('packages/core/package.json')).toBe(
        'packages/core/package.json',
      );
      expect(getBatchedToolTarget('src\\index.ts')).toBe('src\\index.ts');
      expect(getBatchedToolTarget('README.md')).toBe('README.md');
      expect(getBatchedToolTarget('List todo')).toBe('List todo');
    });

    it('handles quotes and whitespace', () => {
      expect(getBatchedToolTarget("'packages/core/package.json'")).toBe(
        'packages/core/package.json',
      );
      expect(getBatchedToolTarget('"packages/core/package.json"')).toBe(
        'packages/core/package.json',
      );
      expect(getBatchedToolTarget('  packages/core/package.json  ')).toBe(
        'packages/core/package.json',
      );
    });

    it('falls back to a generic label when empty', () => {
      expect(getBatchedToolTarget(undefined)).toBe('item');
      expect(getBatchedToolTarget('')).toBe('item');
      expect(getBatchedToolTarget('""')).toBe('item');
      expect(getBatchedToolTarget("''")).toBe('item');
    });
  });
});
