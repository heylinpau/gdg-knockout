#!/usr/bin/env node

/**
 * GDG Hong Kong - Smart Auto-Advancing Bracket Commander
 */

const https = require('https');

const TOPIC = 'gdghk-bracket-channel-2026';

const TEAMS = {
  1:  { name: 'Team Alpha',  color: 'tag-blue',   qf: 'L-QF-1', sf: 'L-SF-1', final: 'F-1' },
  2:  { name: 'Team Pixel',  color: 'tag-blue',   qf: 'L-QF-1', sf: 'L-SF-1', final: 'F-1' },
  3:  { name: 'Team Sketch', color: 'tag-red',    qf: 'L-QF-2', sf: 'L-SF-1', final: 'F-1' },
  4:  { name: 'Team Brush',  color: 'tag-red',    qf: 'L-QF-2', sf: 'L-SF-1', final: 'F-1' },
  5:  { name: 'Team Vector', color: 'tag-yellow', qf: 'L-QF-3', sf: 'L-SF-2', final: 'F-1' },
  6:  { name: 'Team Canvas', color: 'tag-yellow', qf: 'L-QF-3', sf: 'L-SF-2', final: 'F-1' },
  7:  { name: 'Team Doodle', color: 'tag-green',  qf: 'L-QF-4', sf: 'L-SF-2', final: 'F-1' },
  8:  { name: 'Team Ink',    color: 'tag-green',  qf: 'L-QF-4', sf: 'L-SF-2', final: 'F-1' },
  9:  { name: 'Team Palette',color: 'tag-blue',   qf: 'R-QF-1', sf: 'R-SF-1', final: 'F-2' },
  10: { name: 'Team Render', color: 'tag-blue',   qf: 'R-QF-1', sf: 'R-SF-1', final: 'F-2' },
  11: { name: 'Team Shade',  color: 'tag-red',    qf: 'R-QF-2', sf: 'R-SF-1', final: 'F-2' },
  12: { name: 'Team Layer',  color: 'tag-red',    qf: 'R-QF-2', sf: 'R-SF-1', final: 'F-2' },
  13: { name: 'Team Curve',  color: 'tag-yellow', qf: 'R-QF-3', sf: 'R-SF-2', final: 'F-2' },
  14: { name: 'Team Stroke', color: 'tag-yellow', qf: 'R-QF-3', sf: 'R-SF-2', final: 'F-2' },
  15: { name: 'Team Trace',  color: 'tag-green',  qf: 'R-QF-4', sf: 'R-SF-2', final: 'F-2' },
  16: { name: 'Team Grid',   color: 'tag-green',  qf: 'R-QF-4', sf: 'R-SF-2', final: 'F-2' },
};

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();
const targetInput = args.slice(1).join(' ').toLowerCase().trim();

function broadcast(payload) {
  const data = JSON.stringify(payload);
  const options = {
    hostname: 'ntfy.sh',
    port: 443,
    path: `/${TOPIC}`,
    method: 'POST',
    headers: { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(data) }
  };
  const req = https.request(options, () => {
    console.log(`\x1b[32m✔ [SUCCESS]\x1b[0m Screen updated in real-time!`);
  });
  req.on('error', (e) => console.error(`✖ Error: ${e.message}`));
  req.write(data);
  req.end();
}

async function getTeamCurrentRound(teamNum) {
  return new Promise((resolve) => {
    https.get(`https://ntfy.sh/${TOPIC}/json?poll=1&since=8h`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let count = 0;
        body.trim().split('\n').forEach(line => {
          try {
            const msg = JSON.parse(line);
            const data = JSON.parse(msg.message);
            if (data.type === 'RESET') {
              count = 0;
            } else if (data.teamNum === Number(teamNum)) {
              count++;
            }
          } catch(e) {}
        });
        resolve(count);
      });
    }).on('error', () => resolve(0));
  });
}

function findTeamNum(query) {
  if (!query) return null;
  // Direct number 1-16
  if (!isNaN(query) && TEAMS[Number(query)]) return Number(query);
  
  // Name match
  for (const [id, team] of Object.entries(TEAMS)) {
    const cleanName = team.name.toLowerCase();
    if (cleanName.includes(query) || query.includes(cleanName.replace('team ', ''))) {
      return Number(id);
    }
  }
  return null;
}

async function run() {
  if (!command || command === 'help') {
    console.log(`
\x1b[36mGDG Smart Auto-Bracket Commander\x1b[0m
  node control.js advance <name or number>  -> Moves team to next round automatically!
  node control.js reset                    -> Resets tournament

\x1b[33mExamples:\x1b[0m
  node control.js advance alpha    (Moves Alpha to Quarter-Finals)
  node control.js advance alpha    (Moves Alpha to Semi-Finals)
  node control.js advance alpha    (Moves Alpha to Grand Final)
  node control.js advance alpha    (👑 Crowns Alpha Champion!)
  node control.js advance 4        (Moves Team 4)
    `);
    process.exit(0);
  }

  if (command === 'reset') {
    console.log(`🔄 Resetting tournament...`);
    broadcast({ type: 'RESET' });
    return;
  }

  if (['advance', 'move', 'win'].includes(command)) {
    const teamNum = findTeamNum(targetInput);
    if (!teamNum) {
      console.log(`\x1b[31m✖ Team not found:\x1b[0m "${targetInput}". Try a number 1-16 or name (e.g. alpha, pixel, sketch).`);
      process.exit(1);
    }

    const team = TEAMS[teamNum];
    const currentWins = await getTeamCurrentRound(teamNum);

    if (currentWins === 0) {
      // Round of 16 -> Quarter-Finals
      console.log(`🏆 Advancing [#${teamNum} ${team.name}] to QUARTER-FINALS (${team.qf})...`);
      broadcast({
        type: 'ADVANCE_SLOT',
        teamNum,
        teamName: team.name,
        tagClass: team.color,
        targetSlot: team.qf
      });
    } 
    else if (currentWins === 1) {
      // Quarter-Finals -> Semi-Finals
      console.log(`🏆 Advancing [#${teamNum} ${team.name}] to SEMI-FINALS (${team.sf})...`);
      broadcast({
        type: 'ADVANCE_SLOT',
        teamNum,
        teamName: team.name,
        tagClass: team.color,
        targetSlot: team.sf
      });
    } 
    else if (currentWins === 2) {
      // Semi-Finals -> Grand Final
      console.log(`🔥 [#${teamNum} ${team.name}] enters the GRAND FINAL (${team.final})!`);
      broadcast({
        type: 'ADVANCE_SLOT',
        teamNum,
        teamName: team.name,
        tagClass: team.color,
        targetSlot: team.final
      });
    } 
    else if (currentWins === 3) {
      // Grand Final -> Champion
      console.log(`👑 CROWNING CHAMPION: [#${teamNum} ${team.name}]!`);
      broadcast({
        type: 'CHAMPION',
        teamNum,
        teamName: team.name,
        tagClass: team.color
      });
    } 
    else {
      console.log(`\x1b[33mℹ [#${teamNum} ${team.name}] is already the Grand Champion!\x1b[0m`);
    }
  }
}

run();