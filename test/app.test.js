const assert = require("node:assert");
const http = require("node:http");
const test = require("node:test");
const { app } = require("../app");

function request(path) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();

      http
        .get(`http://127.0.0.1:${port}${path}`, (res) => {
          let body = "";

          res.on("data", (chunk) => {
            body += chunk;
          });

          res.on("end", () => {
            server.close(() => {
              resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                body,
              });
            });
          });
        })
        .on("error", (error) => {
          server.close(() => reject(error));
        });
    });
  });
}

test("root endpoint returns the application status message", async () => {
  const response = await request("/");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body, "DevOps AutoOps App is Running!");
});

test("health endpoint returns liveness information", async () => {
  const response = await request("/health");
  const body = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "devops-autoops-platform");
});

test("ready endpoint returns readiness information", async () => {
  const response = await request("/ready");
  const body = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(body.status, "ready");
});

test("metrics endpoint exposes Prometheus-compatible metrics", async () => {
  await request("/");
  const response = await request("/metrics");

  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"], /text\/plain/);
  assert.match(response.body, /http_requests_total/);
  assert.match(response.body, /process_uptime_seconds/);
});
