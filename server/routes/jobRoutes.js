const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const {
  getJobs,
  createJob,
  deleteJob,
  updateJob,
} = require("../controllers/jobController");
router.put("/:id", authenticate, updateJob);
router.get("/", authenticate, getJobs);
router.post("/", authenticate, createJob);
router.delete("/:id", authenticate, deleteJob);

module.exports = router;
