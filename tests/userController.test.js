const request = require("supertest");
const app = require("../src/app");
const db = require("../src/config/db");

describe("User Controller", () => {
  let token;

  beforeAll(async () => {
    if (db.initDb) await db.initDb();

    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "testuser@lib.com",
      password: "Test123"
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "testuser@lib.com",
      password: "Test123"
    });

    token = loginRes.body.token;
  });

  test("getMe - success", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("testuser@lib.com");
  });
});
