const request = require("supertest");
const app = require("../src/app");
const db = require("../src/config/db");

describe("Book Controller", () => {
  let adminToken;

  beforeAll(async () => {
    if (db.initDb) await db.initDb();

    // Login con admin
    const loginRes = await request(app).post("/api/auth/login").send({
      email: process.env.ADMIN_EMAIL || "admin@lib.com",
      password: process.env.ADMIN_PASSWORD || "Admin123",
    });

    adminToken = loginRes.body.token;
  });

  test("createBook - validation error", async () => {
    const res = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ author: "Author Only" });

    expect(res.status).toBe(400);
  });
});
