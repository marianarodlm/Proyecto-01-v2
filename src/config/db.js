const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

// Detecta modo test
const isTest = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

// 1) Toma DATABASE_URL si existe
// 2) En tests (host machine) usa localhost por defecto
// 3) En docker usa db por defecto
let connectionString =
  process.env.DATABASE_URL ||
  (isTest
    ? "postgres://postgres:postgres@localhost:5432/library"
    : "postgres://postgres:postgres@db:5432/library");

// Si estás en test y tu .env trae @db:, lo corregimos a localhost
if (isTest && connectionString.includes("@db:")) {
  connectionString = connectionString.replace("@db:", "@localhost:");
}

const pool = new Pool({ connectionString });

async function initDb() {
  const sql = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    can_create_books BOOLEAN NOT NULL DEFAULT FALSE,
    can_update_books BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete_books BOOLEAN NOT NULL DEFAULT FALSE,
    can_update_users BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete_users BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT,
    publisher TEXT,
    published_at DATE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    book_id INTEGER NOT NULL REFERENCES books(id),
    reserved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    returned_at TIMESTAMP
  );
  `;

  await pool.query(sql);
  console.log("Database initialized");

  await ensureAdminUser(); // seed admin siempre que exista ADMIN_EMAIL/PASSWORD
}

async function ensureAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn("ADMIN_EMAIL/ADMIN_PASSWORD not set. Skipping admin seed.");
    return;
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
  if (existing.rowCount > 0) {
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 10);

  await pool.query(
    `INSERT INTO users (
      name, email, password_hash,
      can_create_books, can_update_books, can_delete_books,
      can_update_users, can_delete_users
    )
    VALUES ($1, $2, $3, TRUE, TRUE, TRUE, TRUE, TRUE)`,
    ["Admin", adminEmail, hash]
  );

  console.log(`Seed admin created: ${adminEmail}`);
}

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { query, initDb };
