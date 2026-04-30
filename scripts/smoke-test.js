const http = require("node:http");

const targetUrl = process.env.SMOKE_TEST_URL || "http://127.0.0.1:3000";
const expectedText = "DevOps AutoOps App is Running!";

http
  .get(targetUrl, (res) => {
    let body = "";

    res.on("data", (chunk) => {
      body += chunk;
    });

    res.on("end", () => {
      if (res.statusCode !== 200) {
        console.error(`Smoke test failed: expected HTTP 200, got ${res.statusCode}`);
        process.exit(1);
      }

      if (!body.includes(expectedText)) {
        console.error(`Smoke test failed: response did not include "${expectedText}"`);
        process.exit(1);
      }

      console.log(`Smoke test passed for ${targetUrl}`);
    });
  })
  .on("error", (error) => {
    console.error(`Smoke test failed: ${error.message}`);
    process.exit(1);
  });
