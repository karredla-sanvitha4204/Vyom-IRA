const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { verifyToken, requireRole } = require("../middleware/auth");

// All admin routes strictly require role: 'admin'
router.use(verifyToken, requireRole("admin"));

router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);
router.post("/users", adminController.createUser);
router.delete("/users/:id", adminController.deleteUser);
router.get("/notifications", adminController.getNotifications);
router.patch("/notifications/:id/read", adminController.markNotificationRead);
router.patch("/notifications/mark-all-read", adminController.markAllNotificationsRead);

module.exports = router;
