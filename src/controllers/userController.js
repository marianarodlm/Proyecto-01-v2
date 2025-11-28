const db = require("../config/db");
const bcrypt = require("bcryptjs");

async function getMe(req, res, next) {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, name, email, is_active,
              can_create_books, can_update_books, can_delete_books,
              can_update_users, can_delete_users
       FROM users
       WHERE id = $1 AND is_active = TRUE`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found or inactive" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;

    // By default, exclude inactive users (soft deleted)
    const includeInactive = String(req.query.includeInactive).toLowerCase() === "true";

    const result = await db.query(
      `SELECT id, name
       FROM users
       WHERE id = $1 ${includeInactive ? "" : "AND is_active = TRUE"}`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // "Secure" public view: no password_hash, no permissions.
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}


async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const requester = req.user;

    if (parseInt(id, 10) !== requester.id && !requester.can_update_users) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name, password } = req.body;

    if (!name && !password) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    let updates = [];
    let values = [];
    let index = 1;

    if (name) {
      updates.push(`name = $${index++}`);
      values.push(name);
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${index++}`);
      values.push(hash);
    }

    updates.push(`updated_at = NOW()`);

    values.push(id);
    const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $${index}
      RETURNING id, name, email, is_active
    `;

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function softDeleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const requester = req.user;

    if (parseInt(id, 10) !== requester.id && !requester.can_delete_users) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await db.query(
      `UPDATE users
       SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE
       RETURNING id, name, email, is_active`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found or already inactive" });
    }

    res.json({ message: "User disabled", user: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  getUserById,
  updateUser,
  softDeleteUser
};
