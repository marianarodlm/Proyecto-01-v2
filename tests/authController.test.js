const request = require("supertest");
const app = require("../src/app");
const db = require("../src/config/db");

jest.mock("../src/config/db");

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("register - success", async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // no existe email
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 1, name: "Test", email: "test@example.com", is_active: true }]
      });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "test@example.com", password: "123456" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("test@example.com");
  });

  test("register - missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(400);
  });
});
