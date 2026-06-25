const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const MODE = process.env.SMOKE_MODE || "json";
const PORT = Number(process.env.SMOKE_PORT || process.env.PORT || 4100);
const HOST = process.env.SMOKE_HOST || "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const BACKEND_DIR = path.resolve(__dirname, "..");
const TEMP_DATA_FILE = path.join(os.tmpdir(), `ziwei-smoke-${process.pid}-${Date.now()}.json`);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }
  return data;
}

function startServer() {
  const env = {
    ...process.env,
    HOST,
    PORT: String(PORT),
    DATA_FILE: TEMP_DATA_FILE
  };

  if (MODE === "postgres") {
    if (!process.env.DATABASE_URL) {
      throw new Error("SMOKE_MODE=postgres requires DATABASE_URL");
    }
    env.DATABASE_URL = process.env.DATABASE_URL;
  } else {
    delete env.DATABASE_URL;
  }

  try {
    fs.rmSync(TEMP_DATA_FILE, { force: true });
  } catch (error) {
    // ignore
  }

  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: BACKEND_DIR,
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  let output = "";
  let exited = false;
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.on("exit", () => {
    exited = true;
  });

  return {
    child,
    getOutput: () => output,
    hasExited: () => exited
  };
}

async function waitForHealth(getOutput, hasExited) {
  for (let i = 0; i < 60; i += 1) {
    if (hasExited()) {
      throw new Error(`Backend exited before becoming healthy:\n${getOutput()}`);
    }
    try {
      const health = await fetchJson(`${BASE_URL}/health`);
      if (health && health.ok) {
        return health;
      }
    } catch (error) {
      // keep trying
    }
    await sleep(500);
  }
  throw new Error(`Backend did not become healthy:\n${getOutput()}`);
}

async function main() {
  const server = startServer();

  try {
    await waitForHealth(server.getOutput, server.hasExited);

    const homeBefore = await fetchJson(`${BASE_URL}/api/home`);
    assert.equal(typeof homeBefore.ownerReady, "boolean");
    assert.ok(Array.isArray(homeBefore.recentRecords));

    const natal = await fetchJson(`${BASE_URL}/api/charts`, {
      method: "POST",
      body: JSON.stringify({
        name: "Smoke User",
        birthDate: "1994-10-14",
        calendarType: "solar",
        gender: "female",
        hourBranch: "wu",
        mode: "natal"
      })
    });
    assert.ok(natal.record && natal.record.id);

    const earlyBirth = await fetchJson(`${BASE_URL}/api/charts`, {
      method: "POST",
      body: JSON.stringify({
        name: "Early User",
        birthDate: "1968-01-07",
        calendarType: "solar",
        gender: "male",
        hourBranch: "zi",
        mode: "natal"
      })
    });
    assert.ok(earlyBirth.record && earlyBirth.record.id);

    const annual = await fetchJson(`${BASE_URL}/api/charts`, {
      method: "POST",
      body: JSON.stringify({
        mode: "annual"
      })
    });
    assert.equal(annual.record.mode, "annual");

    const relationship = await fetchJson(`${BASE_URL}/api/charts`, {
      method: "POST",
      body: JSON.stringify({
        name: "Partner",
        birthDate: "1992-03-08",
        calendarType: "solar",
        gender: "male",
        hourBranch: "wu",
        mode: "relationship"
      })
    });
    assert.equal(relationship.record.mode, "relationship");

    const profile = await fetchJson(`${BASE_URL}/api/profile`);
    assert.ok(profile.owner && profile.owner.id);

    const daily = await fetchJson(`${BASE_URL}/api/daily`);
    assert.equal(daily.hasOwner, true);

    const records = await fetchJson(`${BASE_URL}/api/records`);
    assert.ok(Array.isArray(records.records));
    assert.ok(records.records.length >= 4);

    const chart = await fetchJson(`${BASE_URL}/api/charts/${natal.record.id}`);
    assert.equal(chart.record.id, natal.record.id);

    const homeAfter = await fetchJson(`${BASE_URL}/api/home`);
    assert.equal(homeAfter.ownerReady, true);
    assert.ok(homeAfter.recentRecords.length >= 1);

    process.stdout.write(`Smoke test passed in ${MODE} mode.\n`);
  } finally {
    if (server.child && !server.child.killed) {
      server.child.kill("SIGTERM");
      await sleep(500);
      if (!server.hasExited()) {
        server.child.kill("SIGKILL");
      }
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message || String(error)}\n`);
  process.exit(1);
});
