/**
 * 设计稿节点的「计算后样式」——用于代码生成的可序列化样式。
 * 与 D2CNode.layout 分离：layout 管布局意图，ComputedStyle 管视觉样式。
 */
export interface ComputedStyle {
  // 背景
  backgroundColor?: string;
  backgroundImage?: string;

  // 文字
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  lineHeight?: number | string;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: 'none' | 'underline' | 'line-through';

  // 边框
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;

  // 效果
  opacity?: number;
  boxShadow?: string;

  // 溢出（视觉相关）
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
}

export interface D2CBundle {
  meta: { title: string; version: string };
  // 优化策略：所有重复数据放这里
  shared: {
    styles: Record<string, ComputedStyle>;
    vectors: Record<string, string>; // 精简后的 SVG Path
    images: Record<string, string>; // 本地文件路径
  };
  tree: D2CNode;
}

export interface D2CNode {
  id: string;
  type: 'FRAME' | 'TEXT' | 'IMAGE' | 'VECTOR' | 'UNKNOWN';
  role?: 'button' | 'input' | 'list' | 'container'; // 核心语义

  // 布局意图 (由 Core 算法计算得出，而非 Figma 原始值)
  layout: {
    type: 'flex' | 'grid' | 'absolute';
    direction?: 'row' | 'column';
    gap?: number;
    padding?: { t: number; r: number; b: number; l: number };
  };

  // 样式引用
  styleRef?: string;

  // 内容
  text?: string;
  imageRef?: string;

  // 原始坐标 (仅供 Vision 模型参考)
  box: { x: number; y: number; w: number; h: number };

  children?: D2CNode[];
}
