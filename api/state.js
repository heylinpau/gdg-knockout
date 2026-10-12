// Global in-memory cache for Vercel edge runtime (with persistent fallback)
let globalState = null;

const defaultState = {
  teams: {
    "1": "Team Alpha", "2": "Team Pixel",
    "3": "Team Sketch", "4": "Team Brush",
    "5": "Team Vector", "6": "Team Canvas",
    "7": "Team Doodle", "8": "Team Ink",
    "9": "Team Palette", "10": "Team Render",
    "11": "Team Shade", "12": "Team Layer",
    "13": "Team Curve", "14": "Team Stroke",
    "15": "Team Trace", "16": "Team Grid"
  },
  matches: {
    "L-QF-1": "---", "L-QF-2": "---", "L-QF-3": "---", "L-QF-4": "---",
    "R-QF-1": "---", "R-QF-2": "---", "R-QF-3": "---", "R-QF-4": "---",
    "L-SF-1": "---", "L-SF-2": "---", "R-SF-1": "---", "R-SF-2": "---",
    "F-1": "TBD", "F-2": "TBD",
    "CHAMPION": "TBD"
  },
  lastUpdated: Date.now()
};

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (!globalState) globalState = defaultState;
  res.status(200).json(globalState);
};