const fs = require("fs");
const path = require("path");

let Pool = null;
try {
  ({ Pool } = require("pg"));
} catch (error) {
  Pool = null;
}

const DEFAULT_STATE = { records: [], ownerProfileId: "" };
const PG_KEY = "default";

function cloneDefaultState() {
  return {
    records: [],
    ownerProfileId: ""
  };
}

class JsonStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async ensure() {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(cloneDefaultState(), null, 2));
    }
  }

  async read() {
    await this.ensure();
    return JSON.parse(fs.readFileSync(this.filePath, "utf8"));
  }

  async write(state) {
    await this.ensure();
    fs.writeFileSync(this.filePath, JSON.stringify(state, null, 2));
  }
}

class PostgresStore {
  constructor(databaseUrl, options = {}) {
    if (!Pool) {
      throw new Error("pg dependency is not installed");
    }
    this.pool = new Pool({
      connectionString: databaseUrl
    });
    this.ready = false;
    this.seedFile = options.seedFile || "";
  }

  loadSeedState() {
    if (!this.seedFile || !fs.existsSync(this.seedFile)) {
      return cloneDefaultState();
    }

    try {
      const raw = JSON.parse(fs.readFileSync(this.seedFile, "utf8"));
      return {
        records: Array.isArray(raw.records) ? raw.records : [],
        ownerProfileId: raw.ownerProfileId || ""
      };
    } catch (error) {
      return cloneDefaultState();
    }
  }

  async ensure() {
    if (this.ready) {
      return;
    }
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        state_key TEXT PRIMARY KEY,
        state JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const existing = await this.pool.query("SELECT state_key FROM app_state WHERE state_key = $1", [PG_KEY]);
    if (existing.rowCount === 0) {
      const seedState = this.loadSeedState();
      await this.pool.query(
        "INSERT INTO app_state (state_key, state) VALUES ($1, $2)",
        [PG_KEY, seedState]
      );
    }
    this.ready = true;
  }

  async read() {
    await this.ensure();
    const result = await this.pool.query("SELECT state FROM app_state WHERE state_key = $1", [PG_KEY]);
    if (!result.rowCount) {
      return cloneDefaultState();
    }
    const state = result.rows[0].state || {};
    return {
      records: Array.isArray(state.records) ? state.records : [],
      ownerProfileId: state.ownerProfileId || ""
    };
  }

  async write(state) {
    await this.ensure();
    const payload = {
      records: Array.isArray(state.records) ? state.records : [],
      ownerProfileId: state.ownerProfileId || ""
    };
    await this.pool.query(
      `
      INSERT INTO app_state (state_key, state, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (state_key)
      DO UPDATE SET state = EXCLUDED.state, updated_at = EXCLUDED.updated_at
      `,
      [PG_KEY, payload]
    );
  }
}

function createStoreBackend({ dataFile, databaseUrl }) {
  if (databaseUrl) {
    return new PostgresStore(databaseUrl, { seedFile: dataFile });
  }
  return new JsonStore(dataFile);
}

module.exports = {
  createStoreBackend,
  cloneDefaultState,
  DEFAULT_STATE
};
