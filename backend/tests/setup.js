const { sql } = require('../src/config/db');

afterAll(async () => {
  await sql.close();
});