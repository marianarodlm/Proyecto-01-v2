const express = require("express");
const { authRequired } = require("../middleware/auth");
const {
  createReservation,
  getReservationsByBook,
  getReservationsByUser
} = require("../controllers/reservationController");

const router = express.Router();

router.post("/", authRequired, createReservation);
router.get("/book/:bookId", authRequired, getReservationsByBook);
router.get("/user/:userId", authRequired, getReservationsByUser);

module.exports = router;
