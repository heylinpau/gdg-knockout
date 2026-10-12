#!/usr/bin/env node

/**
 * GDG Hong Kong - Real-Time Socket Commander
 */

const https = require('https');

const TOPIC = 'gdghk-bracket-channel-2026';

const DEFAULT_TEAMS = {
  "1": "Team Alpha", "2": "Team Pixel",
  "3": "Team Sketch", "4": "Team Brush",
  "5": "Team Vector", "6": "Team Canvas",
  "7": "Team Doodle", "8": "Team Ink",
  "9": "Team Palette", "10": "Team Render",
  "11": "Team Shade", "12": "Team Layer",
  "13": "Team Curve", "14": "Team Stroke",
  "15": "Team Trace", "16": "Team Grid"
};

const R1_MAP = {
  "1": "L-QF-1", "2": "L-QF-1",
  "3": "L-QF-2", "4": "L-QF-2",
  "5": "L-QF-3", "6": "L-QF-3",
  "7": "L-QF-4", "8": "L-QF-4",
  "9": "R-QF-1", "10": "R-QF-1",
  "11": "R-QF-2", "12": "R-QF-2",
  "13": "R-QF-3", "14": "R-QF-3",
  "15": "R-QF-4", "16": "R-QF-4"
};

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

function broadcast(payload) {
  const data = JSON.stringify(payload);
  const options = {
    hostname: 'ntfy.sh',
    port: 443,
    path: `/${TOPIC}`,
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options, (res) => {
    console.log(`\x1b[32m✔ [REAL-TIME SYNC SUCCESS]\x1b[0m Broadcasted instantly to stage screen!`);
  });

  req.on('error', (e) => console.error(`✖ Error: ${e.message}`));
  req.write(data);
  req.end();
}

if (!command) {
  console.log(`
\x1b[36mGDG Live Bracket Commander\x1b[0m
  node control.js win <1-16>            -> Advance Round 1 team to QF
  node control.js sf <L-QF-1..4> "<Name>" -> Advance QF winner to Semi
  node control.js final <L or R> "<Name>" -> Advance Semi winner to Grand Final
  node control.js champ "<Team Name>"   -> Crown Tournament Champion
  node control.js reset                 -> Reset whole tournament
  `);
  process.exit(0);
}

if (command === 'win') {
  const teamNum = args[1];
  const targetSlot = R1_MAP[teamNum];
  const teamName = args[2] || DEFAULT_TEAMS[teamNum];
  if (!targetSlot) {
    console.log('Please specify a team number between 1 and 16');
    process.exit(1);
  }
  console.log(`🏆 Advancing [${teamName}] to ${targetSlot}...`);
  broadcast({ type: 'ADVANCE', targetSlot, winnerName: teamName });
} 
else if (command === 'sf') {
  const fromSlot = args[1]?.toUpperCase(); // e.g. L-QF-1
  const teamName = args.slice(2).join(' ') || 'Winner';
  const targetSlot = fromSlot.startsWith('L') ? (['L-QF-1','L-QF-2'].includes(fromSlot) ? 'L-SF-1' : 'L-SF-2') : (['R-QF-1','R-QF-2'].includes(fromSlot) ? 'R-SF-1' : 'R-SF-2');
  console.log(`🏆 Advancing [${teamName}] to Semi-Finals (${targetSlot})...`);
  broadcast({ type: 'ADVANCE', targetSlot, winnerName: teamName });
}
else if (command === 'final') {
  const side = args[1]?.toUpperCase(); // L or R
  const teamName = args.slice(2).join(' ') || 'Finalist';
  const targetSlot = side === 'L' ? 'F-1' : 'F-2';
  console.log(`🔥 [${teamName}] enters Grand Final (${targetSlot})!`);
  broadcast({ type: 'ADVANCE', targetSlot, winnerName: teamName });
}
else if (command === 'champ') {
  const champName = args.slice(1).join(' ') || 'Champion';
  console.log(`👑 CROWNING CHAMPION: ${champName}`);
  broadcast({ type: 'CHAMPION', winnerName: champName });
}
else if (command === 'reset') {
  console.log(`🔄 Resetting tournament...`);
  broadcast({ type: 'RESET' });
}