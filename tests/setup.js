require("dotenv").config();

// Fuerza NODE_ENV test para que db.js use localhost
process.env.NODE_ENV = "test";

// Si el .env tiene host db, cámbialo para correr tests desde la PC
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("@db:")) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace("@db:", "@localhost:");
}

// Defaults por si no están en .env (no hardcodea en producción)
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@lib.com";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123";
