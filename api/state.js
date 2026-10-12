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

const KV_URL = 'https://kvdb.io/A4xQ7wJz8yvE7F9P9qKx7M/gdg_state';

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  try {
    const response = await fetch(KV_URL);
    if (!response.ok) {
      return res.status(200).json(defaultState);
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(200).json(defaultState);
  }
};