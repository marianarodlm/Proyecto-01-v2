const express = require("express");
const { authRequired } = require("../middleware/auth");
const {
  getMe,
  getUserById,
  updateUser,
  softDeleteUser
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", authRequired, getMe);
router.get("/:id", getUserById);              
router.put("/:id", authRequired, updateUser);
router.delete("/:id", authRequired, softDeleteUser);

module.exports = router;
