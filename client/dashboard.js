document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  let editingJobId = null;
  let jobs = [];

  if (!token) {
    alert("You are not logged in!");
    window.location.href = "login.html";
    return;
  }

  const jobForm = document.getElementById("jobForm");
  const jobsGrid = document.getElementById("jobsGrid");
  const logoutBtn = document.getElementById("logoutBtn");
  const statusChartCtx = document
    .getElementById("statusChart")
    .getContext("2d");
  let statusChart;

  // Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });

  // Form submit handler (CREATE or EDIT JOB)
  jobForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const jobData = {
      company: document.getElementById("company").value.trim(),
      position: document.getElementById("position").value.trim(),
      status: document.getElementById("status").value.trim(),
    };

    try {
      let res, data;
      if (editingJobId) {
        // EDIT FLOW (update job)
        res = await fetch(`http://localhost:5000/api/jobs/${editingJobId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(jobData),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update job");
        alert("✅ Job updated!");
        editingJobId = null;
        jobForm.querySelector("button[type=submit]").innerText = "➕ Add Job";
      } else {
        // ADD FLOW (create job)
        res = await fetch("http://localhost:5000/api/jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(jobData),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.message || "Something went wrong");
        alert("✅ Job added!");
      }
      jobForm.reset();
      loadJobs();
    } catch (err) {
      alert("Error: " + err.message);
    }
  });

  // Load jobs and render cards
  async function loadJobs() {
    try {
      const res = await fetch("http://localhost:5000/api/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      jobs = await res.json();

      if (!res.ok) throw new Error(jobs.message || "Failed to fetch jobs");

      jobsGrid.innerHTML = "";

      if (!Array.isArray(jobs) || jobs.length === 0) {
        jobsGrid.innerHTML = `<div class="col-span-2 text-center text-gray-500">No jobs yet.</div>`;
        updateChart([]);
        return;
      }

      jobs.forEach((job) => {
        const card = document.createElement("div");
        card.className =
          "bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col gap-3 border border-gray-100 dark:border-gray-700";

        let statusColor = "bg-blue-100 text-blue-800";
        if (job.status === "offer") statusColor = "bg-green-100 text-green-800";
        if (job.status === "rejected") statusColor = "bg-red-100 text-red-800";
        if (job.status === "interview")
          statusColor = "bg-yellow-100 text-yellow-800";

        card.innerHTML = `
          <div class="text-lg font-extrabold text-gray-900 dark:text-white">${
            job.company
          }</div>
          <div><span class="font-semibold">Position:</span> ${
            job.position
          }</div>
          <div>
            <span class="font-semibold">Status:</span>
            <span class="px-3 py-1 rounded-full text-xs font-bold ${statusColor}">
              ${job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>
          <div class="text-sm text-gray-500">Date: ${new Date(
            job.created_at
          ).toLocaleDateString()}</div>
          <div class="flex gap-3 mt-3">
            <button class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs rounded shadow font-semibold"
              onclick="deleteJob('${job.id}')">
              Delete
            </button>
            <button class="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs rounded shadow font-semibold"
              onclick="editJob('${job.id}')">
              Edit
            </button>
          </div>
        `;

        jobsGrid.appendChild(card);
      });

      updateChart(jobs);
    } catch (err) {
      console.error("❌ Load jobs error:", err.message);
      jobsGrid.innerHTML = `<div class="col-span-2 text-red-500">Failed to load jobs</div>`;
    }
  }

  // Delete Job function
  window.deleteJob = async function (id) {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not delete job");
      loadJobs();
    } catch (err) {
      alert("Error deleting job: " + err.message);
    }
  };

  // Edit Job function (global so buttons work)
  window.editJob = function (id) {
    const job = jobs.find((j) => j.id == id);
    if (job) {
      document.getElementById("company").value = job.company;
      document.getElementById("position").value = job.position;
      document.getElementById("status").value = job.status;
      editingJobId = job.id;
      jobForm.querySelector("button[type=submit]").innerText = "Save Changes";
    }
  };

  // Chart rendering
  function updateChart(jobs) {
    const statusCounts = { applied: 0, interview: 0, offer: 0, rejected: 0 };

    jobs.forEach((job) => {
      if (statusCounts[job.status] !== undefined) {
        statusCounts[job.status]++;
      }
    });

    const data = {
      labels: ["Applied", "Interview", "Offer", "Rejected"],
      datasets: [
        {
          label: "Job Status",
          data: Object.values(statusCounts),
          backgroundColor: ["#6366f1", "#f59e0b", "#10b981", "#ef4444"],
        },
      ],
    };

    if (statusChart) {
      statusChart.destroy();
    }

    statusChart = new Chart(statusChartCtx, {
      type: "doughnut",
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 20, padding: 20, font: { size: 16 } },
          },
          tooltip: { enabled: true },
        },
        cutout: "60%",
        layout: { padding: 16 },
        animation: { animateRotate: true, animateScale: true },
      },
    });
  }

  // Initialize
  loadJobs();
});
