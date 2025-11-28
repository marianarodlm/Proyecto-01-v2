require("dotenv").config();
const app = require("./app");
const { initDb } = require("./config/db");

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Error initializing database:", err);
    process.exit(1);
  }
})();
