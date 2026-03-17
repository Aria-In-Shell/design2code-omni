import http from 'http';

const PORT = 3000;

const server = http.createServer((req, res) => {
  // 处理预检请求，避免 CORS 报错
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/sync') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      console.log('Received!', body || '(empty body)');

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ ok: true }));
    });

    return;
  }

  res.writeHead(404, {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*',
  });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

