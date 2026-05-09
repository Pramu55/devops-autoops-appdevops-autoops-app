import assert from 'node:assert';
import http from 'node:http';
import { test } from 'node:test';

import { app } from '../src/index';

interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

function request(path: string): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Unexpected server address')));
        return;
      }

      const { port } = address;

      http
        .get(`http://127.0.0.1:${port}${path}`, (res) => {
          let body = '';

          res.on('data', (chunk: Buffer) => {
            body += chunk.toString();
          });

          res.on('end', () => {
            server.close(() => {
              resolve({
                statusCode: res.statusCode ?? 0,
                headers: res.headers as Record<string, string>,
                body,
              });
            });
          });
        })
        .on('error', (error: Error) => {
          server.close(() => reject(error));
        });
    });
  });
}

test('root endpoint returns the application status message', async () => {
  const response = await request('/');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body, 'DevOps AutoOps App is Running!');
});

test('health endpoint returns liveness information', async () => {
  const response = await request('/health');
  const body = JSON.parse(response.body) as { status: string; service: string };

  assert.equal(response.statusCode, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'devops-autoops-platform');
});

test('ready endpoint returns readiness information', async () => {
  const response = await request('/ready');
  const body = JSON.parse(response.body) as { status: string };

  assert.equal(response.statusCode, 200);
  assert.equal(body.status, 'ready');
});

test('metrics endpoint exposes Prometheus-compatible metrics', async () => {
  await request('/');
  const response = await request('/metrics');

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['content-type'], /text\/plain/);
  assert.match(response.body, /http_requests_total/);
  assert.match(response.body, /process_uptime_seconds/);
});
