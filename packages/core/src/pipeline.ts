import type { ComputedStyle, D2CBundle, D2CNode } from '@d2c/types';

export interface Processor {
  name: string;
  process(bundle: D2CBundle): D2CBundle;
}

export class Pipeline {
  private readonly processors: Processor[] = [];

  use(processor: Processor): this {
    this.processors.push(processor);
    return this;
  }

  run(input: D2CBundle): D2CBundle {
    return this.processors.reduce((bundle, processor) => {
      return processor.process(bundle);
    }, input);
  }
}

export class GeometryInferenceProcessor implements Processor {
  name = 'geometry-inference';

  process(bundle: D2CBundle): D2CBundle {
    const tree = this.inferNode(bundle.tree);
    return { ...bundle, tree };
  }

  private inferNode(node: D2CNode): D2CNode {
    let nextChildren: D2CNode[] | undefined;
    if (node.children && node.children.length > 0) {
      nextChildren = node.children.map((child) => this.inferNode(child));
    }

    const nextNode: D2CNode = {
      ...node,
      children: nextChildren,
    };

    if (
      nextNode.layout.type === 'absolute' &&
      nextChildren &&
      nextChildren.length >= 2 &&
      this.shouldBeRowFlex(nextChildren)
    ) {
      nextNode.layout = {
        ...nextNode.layout,
        type: 'flex',
        direction: 'row',
      };
    }

    return nextNode;
  }

  private shouldBeRowFlex(children: D2CNode[]): boolean {
    const TOLERANCE = 2;

    const sorted = [...children].sort((a, b) => a.box.x - b.box.x);
    const baseY = sorted[0].box.y;

    const allAligned = sorted.every(
      (child) => Math.abs(child.box.y - baseY) <= TOLERANCE,
    );
    if (!allAligned) return false;

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(sorted[i].box.x - sorted[i - 1].box.x);
    }

    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    return gaps.every((g) => Math.abs(g - avgGap) <= TOLERANCE);
  }
}

export class StyleDeduplicationProcessor implements Processor {
  name = 'style-deduplication';

  process(bundle: D2CBundle): D2CBundle {
    const styleMap = new Map<string, string>();
    const styles: Record<string, ComputedStyle> = {};

    // 1) 先遍历已有 shared.styles，把完全相同的样式合并
    for (const [key, style] of Object.entries(bundle.shared.styles)) {
      const sig = this.signature(style);
      const existingKey = styleMap.get(sig);
      if (existingKey) {
        // 合并到已存在的 key，忽略当前 key
        continue;
      }
      styleMap.set(sig, key);
      styles[key] = style;
    }

    // 2) 遍历节点树，收集和去重节点上的内联 style（如果以后有的话）
    const tree = this.rewriteNode(bundle.tree, styleMap, styles);

    return {
      ...bundle,
      shared: {
        ...bundle.shared,
        styles,
      },
      tree,
    };
  }

  private rewriteNode(
    node: D2CNode & { style?: ComputedStyle },
    styleMap: Map<string, string>,
    styles: Record<string, ComputedStyle>,
  ): D2CNode {
    let styleRef = node.styleRef;

    // 如果将来节点里有 style 字段，这里会把它搬到 shared.styles 里并生成/复用 key
    if ((node as any).style && !styleRef) {
      const style = (node as any).style as ComputedStyle;
      const sig = this.signature(style);
      const existingKey = styleMap.get(sig);
      let key = existingKey;
      if (!key) {
        key = `s_${styleMap.size + 1}`;
        styleMap.set(sig, key);
        styles[key] = style;
      }
      styleRef = key;
      // 不再保留内联 style
      delete (node as any).style;
    }

    let children: D2CNode[] | undefined;
    if (node.children && node.children.length > 0) {
      children = node.children.map((child) =>
        this.rewriteNode(child as any, styleMap, styles),
      );
    }

    return {
      ...node,
      styleRef,
      children,
    };
  }

  private signature(style: ComputedStyle): string {
    // 简单稳定序列化：按 key 排序后 JSON.stringify
    const entries = Object.entries(style).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return JSON.stringify(entries);
  }
}

export class VectorSimplificationProcessor implements Processor {
  name = 'vector-simplification';

  private readonly maxPoints = 50;

  process(bundle: D2CBundle): D2CBundle {
    const vectors: Record<string, string> = {};

    // 1) 简化 shared.vectors 中的路径
    for (const [key, path] of Object.entries(bundle.shared.vectors)) {
      const points = this.parsePoints(path);
      const simplified = this.simplify(points);
      vectors[key] = this.serializePoints(simplified);
    }

    // 2) 根据简化后的点数，必要时把 VECTOR 节点标记成 IMAGE
    const tree = this.rewriteNode(bundle.tree, vectors);

    return {
      ...bundle,
      shared: {
        ...bundle.shared,
        vectors,
      },
      tree,
    };
  }

  private rewriteNode(node: D2CNode, vectors: Record<string, string>): D2CNode {
    let nextType = node.type;
    let imageRef = node.imageRef;

    if (node.type === 'VECTOR' && node.vectorRef) {
      const path = vectors[node.vectorRef];
      const points = this.parsePoints(path ?? '');
      if (points.length > this.maxPoints) {
        // 简化后仍然点数过多：降级为 IMAGE，并复用同一个资源引用
        nextType = 'IMAGE';
        imageRef = node.imageRef ?? node.vectorRef;
      }
    }

    let children: D2CNode[] | undefined;
    if (node.children && node.children.length > 0) {
      children = node.children.map((child) => this.rewriteNode(child, vectors));
    }

    return {
      ...node,
      type: nextType,
      imageRef,
      children,
    };
  }

  // 简单的 "解析 x,y x,y ..." 点列
  private parsePoints(path: string): Array<{ x: number; y: number }> {
    if (!path.trim()) return [];
    return path
      .split(/\s+/)
      .map((pair) => pair.split(','))
      .filter((parts) => parts.length === 2)
      .map(([x, y]) => ({ x: Number(x), y: Number(y) }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  }

  private serializePoints(points: Array<{ x: number; y: number }>): string {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  }

  // 非严格 RDP：简单下采样，先跑通流程，后续可换成真正 RDP
  private simplify(
    points: Array<{ x: number; y: number }>,
  ): Array<{ x: number; y: number }> {
    if (points.length <= this.maxPoints) return points;

    // 简化后仍保持略多于 maxPoints，用来触发降级逻辑
    if (points.length > this.maxPoints * 2) {
      const target = this.maxPoints + 10;
      const step = Math.ceil(points.length / target);
      const result: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < points.length; i += step) {
        result.push(points[i]);
      }
      return result;
    }

    const target = this.maxPoints - 10;
    const step = Math.ceil(points.length / target);
    const result: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < points.length; i += step) {
      result.push(points[i]);
    }
    return result;
  }
}

