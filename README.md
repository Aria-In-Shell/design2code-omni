# design2code-omni

[中文](#zh) · [English](#en)

<a id="zh"></a>

## 中文

一个用 TypeScript 编写的设计转代码原型，研究如何把设计节点整理成更便于代码生成器消费的中间数据。例如，三个横向对齐的绝对定位子节点，可以被识别为一行布局。当前可分别体验两个部分：处理设计数据的流水线，以及接收同步请求的 HTTP 服务。

### 使用场景

| 场景 | 可以做什么 |
| --- | --- |
| 推断布局 | 用一组带坐标和尺寸的子节点测试几何推断，检查父节点是否应采用 Flex 行布局。 |
| 清理设计数据 | 让重复样式引用共享定义，简化矢量路径，并检查复杂矢量降级为图片引用的情况。 |
| 调试插件通信 | 向本机发送与 Figma 插件按钮相同的请求，通过终端日志核对收到的内容。 |

### 使用方法

仓库声明 Node.js 18 或更高版本，包管理器为 pnpm 9.0.0。以下直接运行 TypeScript 服务的示例使用 Node.js 24。

```sh
git clone https://github.com/Aria-In-Shell/design2code-omni.git
cd design2code-omni
pnpm install --frozen-lockfile
pnpm exec vitest run
```

**体验流水线。** 从[几何推断测试](packages/core/src/geometry.test.ts)里的输入开始：调整子节点的坐标，运行单个测试，观察断言所描述的布局。核心调用是 `new Pipeline().use(new GeometryInferenceProcessor()).run(input)`，其中 `input` 是包含元信息、共享资源和节点树的 `D2CBundle`。可以继续用 `.use(...)` 添加处理器，它们按注册顺序执行。[类型定义](packages/types/src/index.ts) · [处理器实现](packages/core/src/pipeline.ts)

```sh
pnpm exec vitest run packages/core/src/geometry.test.ts
```

**体验同步服务。** 在项目根目录启动服务，然后在第二个终端发送示例请求：

```sh
node apps/mcp-server/src/index.ts
```

```sh
curl -X POST http://localhost:3000/sync -H "Content-Type: application/json" -d "{}"
```

在 Windows PowerShell 中可以用 `curl.exe`。预期响应是 `{"ok":true}`，服务终端会打印 `Received!` 和请求正文。按 Ctrl+C 停止服务。

### 当前范围

[Figma 插件源码](apps/figma-plugin/src/ui.ts)展示了 Sync 按钮如何发送固定消息。仓库尚缺可直接导入的插件 manifest 和配套 UI HTML。名为 `mcp-server` 的目录当前实现的是 [HTTP 接收端](apps/mcp-server/src/index.ts)；完整 MCP 工具、Figma 节点提取、将同步数据接入流水线及页面代码输出仍待实现。

<a id="en"></a>

## English

A TypeScript design-to-code prototype for turning design nodes into an intermediate representation that a code generator could use. For example, three absolutely positioned children aligned horizontally can be recognized as a row. The repository has two independently usable parts: a design-data processing pipeline and an HTTP receiver for sync requests.

### Use cases

| Scenario | What you can try |
| --- | --- |
| Infer layout | Supply children with positions and dimensions and check whether their parent should use a flex row. |
| Normalize design data | Deduplicate styles into shared definitions, simplify vector paths, and inspect complex vectors that become image references. |
| Debug plugin communication | Send the same kind of request as the Figma Sync button and inspect the payload in the server log. |

### Getting started

The workspace declares Node.js 18 or later and pnpm 9.0.0. The command below that runs the TypeScript server directly uses Node.js 24.

```sh
git clone https://github.com/Aria-In-Shell/design2code-omni.git
cd design2code-omni
pnpm install --frozen-lockfile
pnpm exec vitest run
```

**Try the pipeline.** Start with the fixture in the [geometry test](packages/core/src/geometry.test.ts). Change a child's coordinates and run the test below to explore the layout assertion. The core call is `new Pipeline().use(new GeometryInferenceProcessor()).run(input)`. Its input is a `D2CBundle` with metadata, shared resources and a node tree. Chain additional processors with `.use(...)` to run them in registration order. [Bundle types](packages/types/src/index.ts) · [Processor implementations](packages/core/src/pipeline.ts)

```sh
pnpm exec vitest run packages/core/src/geometry.test.ts
```

**Try the sync receiver.** From the project root, start the server, then send a request from a second terminal:

```sh
node apps/mcp-server/src/index.ts
```

```sh
curl -X POST http://localhost:3000/sync -H "Content-Type: application/json" -d "{}"
```

Use `curl.exe` in Windows PowerShell. Expect `{"ok":true}` in the client and `Received!` followed by the body in the server terminal. Stop the server with Ctrl+C.

### Current scope

The [Figma plugin source](apps/figma-plugin/src/ui.ts) shows how the Sync button sends a fixed message. An importable plugin manifest and its companion UI HTML are still missing. The directory named `mcp-server` currently provides an [HTTP receiver](apps/mcp-server/src/index.ts). MCP tools, extraction of actual Figma nodes, wiring received data into the pipeline, and page-code generation remain future work.
