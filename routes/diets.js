const express = require("express");
const router = express.Router();
const dietController = require("../controllers/dietController");
const auth = require("../middleware/auth");

// All routes require authentication
router.use(auth);

router.get("/", dietController.getDiets);
router.get("/stats", dietController.getStats);
router.post("/", dietController.createDiet);
router.put("/:id", dietController.updateDiet);
router.delete("/:id", dietController.deleteDiet);
router.post("/:id/complete", dietController.completeDiet);
router.patch("/:id/toggle", dietController.toggleDiet);

module.exports = router;
