const db = require("../config/db");

const exchangeCodeForToken = async (code) => {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  return await response.json();
};

const fetchGitHubUser = async (accessToken) => {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userData = await userResponse.json();

  let email = userData.email;
  if (!email) {
    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const emails = await emailRes.json();
    const primary = emails.find((e) => e.primary && e.verified);
    email = primary ? primary.email : `${userData.login}@users.noreply.github.com`;
  }

  return {
    githubId: String(userData.id),
    name: userData.name || userData.login,
    email,
  };
};

const syncOAuthUser = async (profile) => {
  let userResult = await db.query(
    "SELECT * FROM users WHERE github_id = $1 OR email = $2",
    [profile.githubId, profile.email]
  );

  let user;
  if (userResult.rows.length > 0) {
    user = userResult.rows[0];
    if (!user.github_id) {
      await db.query("UPDATE users SET github_id = $1 WHERE id = $2", [
        profile.githubId,
        user.id,
      ]);
    }
  } else {
    const insertResult = await db.query(
      "INSERT INTO users (name, email, role, github_id) VALUES ($1, $2, 'Employee', $3) RETURNING *",
      [profile.name, profile.email, profile.githubId]
    );
    user = insertResult.rows[0];
  }
  return user;
};

module.exports = { exchangeCodeForToken, fetchGitHubUser, syncOAuthUser };