let accessToken = "";
let currentUser = null;

const consoleEl = document.getElementById("apiConsole");

function logToConsole(title, data) {
  const timestamp = new Date().toLocaleTimeString();
  const formatted = typeof data === "object" ? JSON.stringify(data, null, 2) : data;
  consoleEl.innerText = `[${timestamp}] ${title}\n${formatted}\n\n` + consoleEl.innerText;
}

function updateUI() {
  const authSection = document.getElementById("authSection");
  const dashboardSection = document.getElementById("dashboardSection");

  if (accessToken && currentUser) {
    authSection.style.display = "none";
    dashboardSection.style.display = "block";
    document.getElementById("userNameDisplay").innerText = `Welcome, ${currentUser.name}`;
    document.getElementById("userRoleBadge").innerText = `Role: ${currentUser.role}`;
    document.getElementById("accessTokenDisplay").value = accessToken;
  } else {
    authSection.style.display = "block";
    dashboardSection.style.display = "none";
    document.getElementById("accessTokenDisplay").value = "";
  }
}

// Tab Switching
document.getElementById("tabLoginBtn").addEventListener("click", () => {
  document.getElementById("tabLoginBtn").classList.add("active");
  document.getElementById("tabRegisterBtn").classList.remove("active");
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("registerForm").style.display = "none";
});

document.getElementById("tabRegisterBtn").addEventListener("click", () => {
  document.getElementById("tabRegisterBtn").classList.add("active");
  document.getElementById("tabLoginBtn").classList.remove("active");
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
});

// Clear Logs
document.getElementById("clearConsoleBtn").addEventListener("click", () => {
  consoleEl.innerText = "// Ready. Perform an action to view request & response payload.";
});

// Login Form Submit
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    logToConsole(`POST /api/v1/auth/login (HTTP ${res.status})`, data);

    if (res.ok) {
      accessToken = data.accessToken;
      currentUser = data.user;
      updateUI();
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    logToConsole("Login Network Error", err.message);
  }
});

// Register Form Submit
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("regRole").value;

  try {
    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    logToConsole(`POST /api/v1/auth/register (HTTP ${res.status})`, data);

    if (res.ok) {
      accessToken = data.accessToken;
      currentUser = data.user;
      updateUI();
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (err) {
    logToConsole("Registration Network Error", err.message);
  }
});

// Token Rotation
document.getElementById("refreshTokenBtn").addEventListener("click", async () => {
  try {
    const res = await fetch("/api/v1/auth/refresh", { method: "POST" });
    const data = await res.json();
    logToConsole(`POST /api/v1/auth/refresh (HTTP ${res.status})`, data);

    if (res.ok) {
      accessToken = data.accessToken;
      currentUser = data.user;
      updateUI();
      alert("Token rotated successfully!");
    } else {
      accessToken = "";
      currentUser = null;
      updateUI();
    }
  } catch (err) {
    logToConsole("Refresh Token Error", err.message);
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    const res = await fetch("/api/v1/auth/logout", { method: "POST" });
    const data = await res.json();
    logToConsole("POST /api/v1/auth/logout", data);
  } finally {
    accessToken = "";
    currentUser = null;
    updateUI();
  }
});

// Route Testing
document.getElementById("testProfileBtn").addEventListener("click", async () => {
  const res = await fetch("/api/v1/employee/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  logToConsole(`GET /api/v1/employee/profile (HTTP ${res.status})`, data);
});

document.getElementById("testPayrollBtn").addEventListener("click", async () => {
  const res = await fetch("/api/v1/payroll/approve", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  logToConsole(`POST /api/v1/payroll/approve (HTTP ${res.status})`, data);
});

document.getElementById("testDeleteBtn").addEventListener("click", async () => {
  const userId = prompt("Enter User ID to delete (e.g. 99):", "99");
  if (!userId) return;
  const res = await fetch(`/api/v1/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  logToConsole(`DELETE /api/v1/users/${userId} (HTTP ${res.status})`, data);
});