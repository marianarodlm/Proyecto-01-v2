const express = require("express");
const { authRequired, requirePermission } = require("../middleware/auth");
const {
  createBook,
  getBookById,
  getBooks,
  updateBook,
  softDeleteBook
} = require("../controllers/bookController");

const router = express.Router();

router.get("/", getBooks);
router.get("/:id", getBookById);
router.post("/", authRequired, requirePermission("can_create_books"), createBook);
router.put("/:id", authRequired, requirePermission("can_update_books"), updateBook);
router.delete("/:id", authRequired, requirePermission("can_delete_books"), softDeleteBook);

module.exports = router;
