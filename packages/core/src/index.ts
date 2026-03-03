import type { D2CBundle, D2CNode } from '@d2c/types';

// 占位函数：后续会被真正的 Pipeline 实现替换
export function createEmptyBundle(title: string): D2CBundle {
  const emptyRoot: D2CNode = {
    id: 'root',
    type: 'FRAME',
    layout: {
      type: 'flex',
      direction: 'column',
      gap: 0,
      padding: { t: 0, r: 0, b: 0, l: 0 }
    },
    box: { x: 0, y: 0, w: 0, h: 0 },
    children: []
  };

  return {
    meta: { title, version: '0.1.0' },
    shared: {
      styles: {},
      vectors: {},
      images: {}
    },
    tree: emptyRoot
  };
}
