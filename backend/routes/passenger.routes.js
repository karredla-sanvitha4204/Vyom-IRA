const express = require("express");
const router = express.Router();
const passengerController = require("../controllers/passenger.controller");

router.get("/", passengerController.getAllPassengers);
router.get("/:id", passengerController.getPassengerById);
router.post("/", passengerController.createPassenger);
router.put("/:id", passengerController.updatePassenger);
router.delete("/:id", passengerController.deletePassenger);
router.get("/:id/bookings", passengerController.getPassengerBookings);

module.exports = router;
