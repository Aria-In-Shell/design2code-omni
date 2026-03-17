import { describe, it, expect } from 'vitest';
import type { D2CBundle, D2CNode } from '@d2c/types';
import { Pipeline, VectorSimplificationProcessor } from './index';

function makeVectorPath(pointCount: number): string {
  const points: string[] = [];
  for (let i = 0; i < pointCount; i++) {
    points.push(`${i},${i}`);
  }
  return points.join(' ');
}

function makeBundleWithVector(pointCount: number): D2CBundle {
  const tree: D2CNode = {
    id: 'v-root',
    type: 'VECTOR',
    vectorRef: 'v1',
    layout: {
      type: 'absolute',
      direction: 'row',
      gap: 0,
      padding: { t: 0, r: 0, b: 0, l: 0 },
    },
    box: { x: 0, y: 0, w: 100, h: 100 },
    children: [],
  };

  return {
    meta: { title: 'vector-test', version: '0.1.0' },
    shared: {
      styles: {},
      vectors: {
        v1: makeVectorPath(pointCount),
      },
      images: {},
    },
    tree,
  };
}

describe('VectorSimplificationProcessor', () => {
  it('should keep small vectors as VECTOR', () => {
    const input = makeBundleWithVector(20);
    const pipeline = new Pipeline().use(new VectorSimplificationProcessor());

    const output = pipeline.run(input);

    expect(output.tree.type).toBe('VECTOR');
    const path = output.shared.vectors['v1'];
    expect(path.split(/\s+/).length).toBeLessThanOrEqual(50);
  });

  it('should downgrade very complex vectors to IMAGE', () => {
    const input = makeBundleWithVector(120);
    const pipeline = new Pipeline().use(new VectorSimplificationProcessor());

    const output = pipeline.run(input);

    expect(output.tree.type).toBe('IMAGE');
    expect(output.tree.imageRef).toBe('v1');

    const path = output.shared.vectors['v1'];
    expect(path.split(/\s+/).length).toBeLessThan(120);
  });
});

