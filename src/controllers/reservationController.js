const db = require("../config/db");

async function createReservation(req, res, next) {
  try {
    const userId = req.user.id;
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: "bookId is required" });
    }

    const bookResult = await db.query(
      `SELECT id, is_available, is_active FROM books WHERE id = $1`,
      [bookId]
    );

    if (bookResult.rowCount === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    const book = bookResult.rows[0];

    if (!book.is_active) {
      return res.status(400).json({ message: "Book is inactive" });
    }

    if (!book.is_available) {
      return res.status(400).json({ message: "Book is not available" });
    }

    const reservationResult = await db.query(
      `INSERT INTO reservations (user_id, book_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, bookId]
    );

    await db.query(
      `UPDATE books SET is_available = FALSE, updated_at = NOW() WHERE id = $1`,
      [bookId]
    );

    res.status(201).json(reservationResult.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function getReservationsByBook(req, res, next) {
  try {
    const { bookId } = req.params;

    const result = await db.query(
      `SELECT r.id, r.reserved_at, r.returned_at,
              u.id AS user_id, u.name AS user_name, u.email AS user_email
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.book_id = $1
       ORDER BY r.reserved_at DESC`,
      [bookId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function getReservationsByUser(req, res, next) {
  try {
    const { userId } = req.params;
    const requester = req.user;

    if (parseInt(userId, 10) !== requester.id && !requester.can_update_users && !requester.can_delete_users) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await db.query(
      `SELECT r.id, r.reserved_at, r.returned_at,
              b.id AS book_id, b.title AS book_title, b.author AS book_author
       FROM reservations r
       JOIN books b ON r.book_id = b.id
       WHERE r.user_id = $1
       ORDER BY r.reserved_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReservation,
  getReservationsByBook,
  getReservationsByUser
};
