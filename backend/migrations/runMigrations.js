const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "pos_restaurant_pool",
  });

  const sqlFilePath = path.join(__dirname, "test.sql");
  const sql = fs.readFileSync(sqlFilePath, "utf-8");

  console.log(`Running migration: test.sql`);
  await connection.query(sql);

  await connection.end();
}

module.exports = { runMigrations };
