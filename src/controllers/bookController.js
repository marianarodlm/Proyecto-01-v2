const db = require("../config/db");

async function createBook(req, res, next) {
  try {
    const user = req.user;
    if (!user.can_create_books) {
      return res.status(403).json({ message: "Forbidden: cannot create books" });
    }

    const { title, author, genre, publisher, published_at } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: "title and author are required" });
    }

    const result = await db.query(
      `INSERT INTO books (title, author, genre, publisher, published_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, author, genre || null, publisher || null, published_at || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function getBookById(req, res, next) {
  try {
    const { id } = req.params;
    const includeInactive = req.query.includeInactive === "true";

    let query = `SELECT * FROM books WHERE id = $1`;
    const params = [id];

    if (!includeInactive) {
      query += ` AND is_active = TRUE`;
    }

    const result = await db.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function getBooks(req, res, next) {
  try {
    const {
      genre,
      author,
      publisher,
      title,
      available,
      startDate,
      endDate,
      page = 1,
      pageSize = 10,
      includeInactive
    } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (!includeInactive || includeInactive !== "true") {
      conditions.push(`is_active = TRUE`);
    }

    if (genre) {
      conditions.push(`genre ILIKE $${idx++}`);
      values.push(`%${genre}%`);
    }
    if (author) {
      conditions.push(`author ILIKE $${idx++}`);
      values.push(`%${author}%`);
    }
    if (publisher) {
      conditions.push(`publisher ILIKE $${idx++}`);
      values.push(`%${publisher}%`);
    }
    if (title) {
      conditions.push(`title ILIKE $${idx++}`);
      values.push(`%${title}%`);
    }
    if (available === "true") {
      conditions.push(`is_available = TRUE`);
    } else if (available === "false") {
      conditions.push(`is_available = FALSE`);
    }
    if (startDate) {
      conditions.push(`published_at >= $${idx++}`);
      values.push(startDate);
    }
    if (endDate) {
      conditions.push(`published_at <= $${idx++}`);
      values.push(endDate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const limit = parseInt(pageSize, 10) || 10;
    const currentPage = parseInt(page, 10) || 1;
    const offset = (currentPage - 1) * limit;

    const countQuery = `SELECT COUNT(*) AS total FROM books ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit) || 1;

    const dataQuery = `
      SELECT id, title
      FROM books
      ${whereClause}
      ORDER BY id
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    const dataValues = [...values, limit, offset];
    const dataResult = await db.query(dataQuery, dataValues);

    res.json({
      items: dataResult.rows,
      pagination: {
        currentPage,
        totalPages,
        pageSize: limit,
        totalItems: total
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateBook(req, res, next) {
  try {
    const user = req.user;
    if (!user.can_update_books) {
      return res.status(403).json({ message: "Forbidden: cannot update books" });
    }

    const { id } = req.params;
    const { title, author, genre, publisher, published_at, is_available } = req.body;

    const updates = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(title);
    }
    if (author !== undefined) {
      updates.push(`author = $${idx++}`);
      values.push(author);
    }
    if (genre !== undefined) {
      updates.push(`genre = $${idx++}`);
      values.push(genre);
    }
    if (publisher !== undefined) {
      updates.push(`publisher = $${idx++}`);
      values.push(publisher);
    }
    if (published_at !== undefined) {
      updates.push(`published_at = $${idx++}`);
      values.push(published_at);
    }
    if (is_available !== undefined) {
      updates.push(`is_available = $${idx++}`);
      values.push(is_available);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE books
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      RETURNING *
    `;
    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function softDeleteBook(req, res, next) {
  try {
    const user = req.user;
    if (!user.can_delete_books) {
      return res.status(403).json({ message: "Forbidden: cannot delete books" });
    }

    const { id } = req.params;

    const result = await db.query(
      `UPDATE books
       SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Book not found or already inactive" });
    }

    res.json({ message: "Book disabled", book: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBook,
  getBookById,
  getBooks,
  updateBook,
  softDeleteBook
};
