const express = require("express");
const { exchangeCodeForToken, fetchGitHubUser, syncOAuthUser } = require("../services/githubOAuth");
const { sendTokens } = require("../services/tokenService");

const router = express.Router();

router.get("/github", (req, res) => {
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:email`;
  res.redirect(redirectUri);
});

router.get("/github/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("No authorization code provided.");

  try {
    const tokenData = await exchangeCodeForToken(code);
    if (!tokenData.access_token) return res.status(401).send("OAuth exchange failed.");

    const gitHubUser = await fetchGitHubUser(tokenData.access_token);
    const user = await syncOAuthUser(gitHubUser);

    return sendTokens(res, user, 200);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;