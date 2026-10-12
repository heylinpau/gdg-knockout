module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-key");

  if (req.method === "OPTIONS") return res.status(200).end();

  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== "gdghk2026") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { targetSlot, winnerName, teams, reset } = req.body;
  const stateReq = require("./state.js");

  // Reset functionality
  if (reset) {
    stateReq.globalState = null;
    return res.status(200).json({ success: true, message: "Bracket Reset" });
  }

  // State update
  const current = stateReq.globalState || {};
  if (!current.matches) current.matches = {};
  if (!current.teams) current.teams = {};

  if (teams) current.teams = { ...current.teams, ...teams };
  if (targetSlot && winnerName) {
    current.matches[targetSlot] = winnerName;
  }
  current.lastUpdated = Date.now();
  stateReq.globalState = current;

  return res.status(200).json({ success: true, state: current });
};