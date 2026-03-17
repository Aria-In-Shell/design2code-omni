// Figma 插件沙箱线程入口（不能直接发网络请求）

// 展示一个简单的 UI，里面只有一个 “Sync” 按钮
figma.showUI(__html__, {
  width: 240,
  height: 80,
});

// 这里可以监听来自 UI 的消息（例如同步完成的通知）
figma.ui.onmessage = (msg) => {
  if (msg.type === 'sync-complete') {
    figma.notify('Sync request sent to local server');
  }
};

