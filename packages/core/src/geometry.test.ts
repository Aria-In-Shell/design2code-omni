import { describe, it, expect } from 'vitest';
import type { D2CBundle, D2CNode } from '@d2c/types';
import { GeometryInferenceProcessor, Pipeline } from './index';

function makeTestBundle(children: D2CNode[]): D2CBundle {
  return {
    meta: { title: 'test', version: '0.1.0' },
    shared: {
      styles: {},
      vectors: {},
      images: {},
    },
    tree: {
      id: 'root',
      type: 'FRAME',
      layout: {
        type: 'absolute',
        direction: 'row',
        gap: 0,
        padding: { t: 0, r: 0, b: 0, l: 0 },
      },
      box: { x: 0, y: 0, w: 1000, h: 100 },
      children,
    },
  };
}

describe('GeometryInferenceProcessor', () => {
  it('should convert aligned absolute children to flex row layout on parent', () => {
    const children: D2CNode[] = [
      {
        id: 'c1',
        type: 'FRAME',
        layout: {
          type: 'absolute',
          direction: 'row',
          gap: 0,
          padding: { t: 0, r: 0, b: 0, l: 0 },
        },
        box: { x: 0, y: 10, w: 100, h: 20 },
        children: [],
      },
      {
        id: 'c2',
        type: 'FRAME',
        layout: {
          type: 'absolute',
          direction: 'row',
          gap: 0,
          padding: { t: 0, r: 0, b: 0, l: 0 },
        },
        box: { x: 120, y: 11, w: 100, h: 20 },
        children: [],
      },
      {
        id: 'c3',
        type: 'FRAME',
        layout: {
          type: 'absolute',
          direction: 'row',
          gap: 0,
          padding: { t: 0, r: 0, b: 0, l: 0 },
        },
        box: { x: 240, y: 9, w: 100, h: 20 },
        children: [],
      },
    ];

    const input = makeTestBundle(children);
    const pipeline = new Pipeline().use(new GeometryInferenceProcessor());

    const output = pipeline.run(input);

    expect(output.tree.layout.type).toBe('flex');
    expect(output.tree.layout.direction).toBe('row');
  });
});

