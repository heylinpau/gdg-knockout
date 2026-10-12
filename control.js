#!/usr/bin/env node

/**
 * GDGoC PolyU - Interactive Tournament REPL Shell
 */

const https = require('https');
const readline = require('readline');

const TOPIC = 'gdghk-bracket-channel-2026';

const TEAMS = {
  1:  { name: 'Google Docs',     category: 'Document & Productivity Tools', color: 'tag-blue',   qf: 'L-QF-1', sf: 'L-SF-1', final: 'F-1' },
  2:  { name: 'Google Sheets',   category: 'Document & Productivity Tools', color: 'tag-green',  qf: 'L-QF-1', sf: 'L-SF-1', final: 'F-1' },
  3:  { name: 'Google Slides',   category: 'Document & Productivity Tools', color: 'tag-yellow', qf: 'L-QF-2', sf: 'L-SF-1', final: 'F-1' },
  4:  { name: 'Google Forms',    category: 'Document & Productivity Tools', color: 'tag-purple', qf: 'L-QF-2', sf: 'L-SF-1', final: 'F-1' },
  5:  { name: 'YouTube',         category: 'Media & Entertainment',         color: 'tag-red',    qf: 'L-QF-3', sf: 'L-SF-2', final: 'F-1' },
  6:  { name: 'Google TV',       category: 'Media & Entertainment',         color: 'tag-blue',   qf: 'L-QF-3', sf: 'L-SF-2', final: 'F-1' },
  7:  { name: 'Google Podcasts', category: 'Media & Entertainment',         color: 'tag-yellow', qf: 'L-QF-4', sf: 'L-SF-2', final: 'F-1' },
  8:  { name: 'Google Books',    category: 'Media & Entertainment',         color: 'tag-blue',   qf: 'L-QF-4', sf: 'L-SF-2', final: 'F-1' },
  9:  { name: 'Gmail',           category: 'Communication & Organization',  color: 'tag-red',    qf: 'R-QF-1', sf: 'R-SF-1', final: 'F-2' },
  10: { name: 'Google Calendar', category: 'Communication & Organization',  color: 'tag-blue',   qf: 'R-QF-1', sf: 'R-SF-1', final: 'F-2' },
  11: { name: 'Google Meet',     category: 'Communication & Organization',  color: 'tag-green',  qf: 'R-QF-2', sf: 'R-SF-1', final: 'F-2' },
  12: { name: 'Google Drive',    category: 'Communication & Organization',  color: 'tag-yellow', qf: 'R-QF-2', sf: 'R-SF-1', final: 'F-2' },
  13: { name: 'Android',         category: 'Hardware & Operating Systems',  color: 'tag-green',  qf: 'R-QF-3', sf: 'R-SF-2', final: 'F-2' },
  14: { name: 'Google Pixel',    category: 'Hardware & Operating Systems',  color: 'tag-blue',   qf: 'R-QF-3', sf: 'R-SF-2', final: 'F-2' },
  15: { name: 'Chromebook',      category: 'Hardware & Operating Systems',  color: 'tag-yellow', qf: 'R-QF-4', sf: 'R-SF-2', final: 'F-2' },
  16: { name: 'Google Nest',     category: 'Hardware & Operating Systems',  color: 'tag-blue',   qf: 'R-QF-4', sf: 'R-SF-2', final: 'F-2' },
};

function broadcast(payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'ntfy.sh',
      port: 443,
      path: `/${TOPIC}`,
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = https.request(options, () => {
      console.log(`\x1b[32m✔ [BROADCAST SUCCESS]\x1b[0m Live screen updated!`);
      resolve();
    });
    req.on('error', (e) => {
      console.error(`✖ Error: ${e.message}`);
      resolve();
    });
    req.write(data);
    req.end();
  });
}

async function getTeamCurrentWins(teamNum) {
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
  const q = query.toLowerCase().trim().replace(/^advance\s+/, '').replace(/^move\s+/, '');
  if (!isNaN(q) && TEAMS[Number(q)]) return Number(q);
  
  for (const [id, team] of Object.entries(TEAMS)) {
    const cleanName = team.name.toLowerCase();
    const shortName = cleanName.replace('google ', '');
    if (cleanName.includes(q) || shortName.includes(q) || q.includes(shortName)) {
      return Number(id);
    }
  }
  return null;
}

async function handleCommand(input) {
  const line = input.trim();
  if (!line) return;

  const lower = line.toLowerCase();

  if (lower === 'exit' || lower === 'quit') {
    console.log('Goodbye! 👋');
    process.exit(0);
  }

  if (lower === 'reset') {
    console.log(`🔄 Resetting tournament bracket...`);
    await broadcast({ type: 'RESET' });
    return;
  }

  if (lower === 'list') {
    console.log('\n\x1b[36m--- GDGoC PolyU 16 Teams ---\x1b[0m');
    for (const [id, team] of Object.entries(TEAMS)) {
      console.log(` #${id.padStart(2)}: ${team.name} (${team.category})`);
    }
    console.log('');
    return;
  }

  // Handle advance command (supports: "advance slides", "slides", "advance 3", "3")
  const teamNum = findTeamNum(line);
  if (!teamNum) {
    console.log(`\x1b[31m✖ Unknown team or command:\x1b[0m "${line}". (Type 'list' or e.g. "slides", "3", "reset")`);
    return;
  }

  const team = TEAMS[teamNum];
  const currentWins = await getTeamCurrentWins(teamNum);

  if (currentWins === 0) {
    console.log(`🏆 Advancing [#${teamNum} ${team.name}] to QUARTER-FINALS...`);
    await broadcast({
      type: 'ADVANCE_SLOT',
      teamNum,
      teamName: team.name,
      tagClass: team.color,
      targetSlot: team.qf
    });
  } 
  else if (currentWins === 1) {
    console.log(`🏆 Advancing [#${teamNum} ${team.name}] to SEMI-FINALS...`);
    await broadcast({
      type: 'ADVANCE_SLOT',
      teamNum,
      teamName: team.name,
      tagClass: team.color,
      targetSlot: team.sf
    });
  } 
  else if (currentWins === 2) {
    console.log(`🔥 [#${teamNum} ${team.name}] enters the GRAND FINAL!`);
    await broadcast({
      type: 'ADVANCE_SLOT',
      teamNum,
      teamName: team.name,
      tagClass: team.color,
      targetSlot: team.final
    });
  } 
  else if (currentWins === 3) {
    console.log(`👑 CROWNING GRAND CHAMPION: [#${teamNum} ${team.name}]!`);
    await broadcast({
      type: 'CHAMPION',
      teamNum,
      teamName: team.name,
      tagClass: team.color,
      category: team.category
    });
  } 
  else {
    console.log(`\x1b[33mℹ [#${teamNum} ${team.name}] is already the Grand Champion!\x1b[0m`);
  }
}

// START INTERACTIVE REPL
console.clear();
console.log(`
\x1b[32m╔══════════════════════════════════════════════════════════════╗
║        GDGoC PolyU - LIVE DRAWING GAME COMMAND CENTER        ║
╚══════════════════════════════════════════════════════════════╝\x1b[0m

\x1b[33mCommands:\x1b[0m
  • Type any team name or number to advance: \x1b[36mslides\x1b[0m, \x1b[36mdocs\x1b[0m, \x1b[36m3\x1b[0m, \x1b[36m10\x1b[0m
  • Type \x1b[36mreset\x1b[0m to clear bracket
  • Type \x1b[36mlist\x1b[0m to view all 16 teams
  • Type \x1b[36mexit\x1b[0m to quit
`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\x1b[35mGDGoC PolyU > \x1b[0m'
});

rl.prompt();

rl.on('line', async (line) => {
  await handleCommand(line);
  rl.prompt();
});