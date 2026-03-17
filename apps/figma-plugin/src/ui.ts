// Figma 插件 UI 线程入口
// 这里可以发网络请求到本地 Node Server

const button = document.getElementById('sync');

if (button) {
  button.addEventListener('click', async () => {
    try {
      await fetch('http://localhost:3000/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'figma-plugin', action: 'sync' }),
      });

      // 通知 main.ts：同步请求已发送
      parent.postMessage(
        { pluginMessage: { type: 'sync-complete' } },
        '*',
      );
    } catch (error) {
      console.error('Sync request failed', error);
    }
  });
}

