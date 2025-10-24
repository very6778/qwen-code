/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock metrics system to replace OpenTelemetry API metrics
import { metrics as mockMetrics } from './index.js';
import type { Counter, Histogram, Gauge } from './types.js';

// Mock OpenTelemetry API metrics
export const metrics = mockMetrics;

// Mock metric classes
export class MockCounter implements Counter {
  constructor(private name: string) {}

  add(value: number, attributes?: Record<string, any>): void {
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[Counter] ${this.name}: +${value}`, attributes);
    }
  }
}

export class MockHistogram implements Histogram {
  constructor(private name: string) {}

  record(value: number, attributes?: Record<string, any>): void {
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[Histogram] ${this.name}: ${value}`, attributes);
    }
  }
}

export class MockGauge implements Gauge {
  constructor(private name: string) {}

  record(value: number, attributes?: Record<string, any>): void {
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[Gauge] ${this.name}: ${value}`, attributes);
    }
  }
}

// Mock metric factory functions
export function createCounter(name: string): Counter {
  return new MockCounter(name);
}

export function createHistogram(name: string): Histogram {
  return new MockHistogram(name);
}

export function createGauge(name: string): Gauge {
  return new MockGauge(name);
}

// Mock missing metric types
export const FileOperation = {
  name: 'file-operation',
  description: 'File operation metric'
};

// Mock metric factories
export function createFileOperationMetric(): Counter {
  return createCounter('file-operation');
}