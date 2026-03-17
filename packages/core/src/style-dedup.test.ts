import { describe, it, expect } from 'vitest';
import type { ComputedStyle, D2CBundle, D2CNode } from '@d2c/types';
import { Pipeline, StyleDeduplicationProcessor } from './index';

function makeNode(id: string, style?: ComputedStyle): D2CNode & {
  style?: ComputedStyle;
} {
  const base: D2CNode & { style?: ComputedStyle } = {
    id,
    type: 'FRAME',
    layout: {
      type: 'flex',
      direction: 'row',
      gap: 0,
      padding: { t: 0, r: 0, b: 0, l: 0 },
    },
    box: { x: 0, y: 0, w: 100, h: 20 },
    children: [],
  };
  if (style) base.style = style;
  return base;
}

function makeBundleWithInlineStyles(): D2CBundle {
  const styleA: ComputedStyle = { color: '#000000', fontSize: 14 };
  const styleB: ComputedStyle = { color: '#000000', fontSize: 14 };
  const styleC: ComputedStyle = { color: '#ff0000', fontSize: 16 };

  const child1 = makeNode('n1', styleA);
  const child2 = makeNode('n2', styleB);
  const child3 = makeNode('n3', styleC);

  return {
    meta: { title: 'style-test', version: '0.1.0' },
    shared: {
      styles: {},
      vectors: {},
      images: {},
    },
    tree: {
      id: 'root',
      type: 'FRAME',
      layout: {
        type: 'flex',
        direction: 'row',
        gap: 0,
        padding: { t: 0, r: 0, b: 0, l: 0 },
      },
      box: { x: 0, y: 0, w: 300, h: 20 },
      children: [child1, child2, child3],
    },
  };
}

describe('StyleDeduplicationProcessor', () => {
  it('should deduplicate identical styles and move them into shared.styles', () => {
    const input = makeBundleWithInlineStyles();
    const pipeline = new Pipeline().use(new StyleDeduplicationProcessor());

    const output = pipeline.run(input);

    // shared.styles 中只应有 2 条记录：一种黑色 14px，一种红色 16px
    const styleEntries = Object.entries(output.shared.styles);
    expect(styleEntries.length).toBe(2);

    // 三个子节点都应该只保留 styleRef，没有 inline style
    const children = output.tree.children ?? [];
    expect(children.length).toBe(3);

    const [c1, c2, c3] = children as Array<
      D2CNode & { style?: ComputedStyle }
    >;

    expect(c1.styleRef).toBeTruthy();
    expect(c2.styleRef).toBeTruthy();
    expect(c3.styleRef).toBeTruthy();

    expect(c1.style).toBeUndefined();
    expect(c2.style).toBeUndefined();
    expect(c3.style).toBeUndefined();

    // c1 和 c2 的 styleRef 应该相同（样式完全一致）
    expect(c1.styleRef).toBe(c2.styleRef);
    // c3 应该是另一种样式
    expect(c3.styleRef).not.toBe(c1.styleRef);
  });
});

