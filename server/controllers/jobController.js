const pool = require("../db");

// 📌 Get all jobs for the logged-in user
exports.getJobs = async (req, res) => {
  try {
    console.log("➡️ getJobs triggered");
    console.log("🧠 req.user:", req.user); // should contain id or userId

    const userId = req.user.id || req.user.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }

    const jobs = await pool.query(
      "SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.status(200).json(jobs.rows); // ✅ send array directly
  } catch (err) {
    console.error("❌ Error in getJobs:", err.message);
    res.status(500).json({ message: "Error fetching jobs" });
  }
};

// 📌 Create a new job for the logged-in user
exports.createJob = async (req, res) => {
  const { company, position, status, notes } = req.body;
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }

    const result = await pool.query(
      "INSERT INTO jobs (company, position, status, notes, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [company, position, status || "Applied", notes || "", userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error in createJob:", err.message);
    res.status(500).json({ error: err.message });
  }
};
// 📌 Delete a job for the logged-in user
exports.deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }

    // Only allow deleting jobs belonging to user
    const result = await pool.query(
      "DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING *",
      [jobId, userId]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Job not found or not authorized" });
    }

    res.json({ message: "Job deleted successfully!" });
  } catch (err) {
    console.error("❌ Error in deleteJob:", err.message);
    res.status(500).json({ error: "Failed to delete job" });
  }
};
exports.updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;
    const { company, position, status } = req.body;
    const result = await pool.query(
      "UPDATE jobs SET company = $1, position = $2, status = $3 WHERE id = $4 AND user_id = $5 RETURNING *",
      [company, position, status, jobId, userId]
    );
    if (result.rowCount === 0)
      return res
        .status(404)
        .json({ message: "Job not found or not authorized" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update job" });
  }
};
