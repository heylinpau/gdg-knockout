#!/usr/bin/env node

/**
 * GDGoC PolyU - Google Products Tournament Commander
 */

const https = require('https');

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
    console.log(`\x1b[32m✔ [GDGoC PolyU SYNC]\x1b[0m Stage screen updated in real-time!`);
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
  if (!isNaN(query) && TEAMS[Number(query)]) return Number(query);
  
  for (const [id, team] of Object.entries(TEAMS)) {
    const cleanName = team.name.toLowerCase();
    const shortName = cleanName.replace('google ', '');
    if (cleanName.includes(query) || shortName.includes(query) || query.includes(shortName)) {
      return Number(id);
    }
  }
  return null;
}

async function run() {
  if (!command || command === 'help') {
    console.log(`
\x1b[36mGDGoC PolyU - Google Tournament Commander\x1b[0m
  node control.js advance <product name or #>  -> Automatically advances team to next round
  node control.js reset                        -> Resets whole tournament

\x1b[33mExamples:\x1b[0m
  node control.js advance docs       (Advances Google Docs)
  node control.js advance slides     (Advances Google Slides)
  node control.js advance youtube    (Advances YouTube)
  node control.js advance meet       (Advances Google Meet)
  node control.js advance 10         (Advances Team 10 - Calendar)
    `);
    process.exit(0);
  }

  if (command === 'reset') {
    console.log(`🔄 Resetting tournament bracket...`);
    broadcast({ type: 'RESET' });
    return;
  }

  if (['advance', 'move', 'win'].includes(command)) {
    const teamNum = findTeamNum(targetInput);
    if (!teamNum) {
      console.log(`\x1b[31m✖ Team not found:\x1b[0m "${targetInput}". Try: docs, sheets, slides, youtube, meet, pixel, etc.`);
      process.exit(1);
    }

    const team = TEAMS[teamNum];
    const currentWins = await getTeamCurrentRound(teamNum);

    if (currentWins === 0) {
      console.log(`🏆 Advancing [#${teamNum} ${team.name}] to QUARTER-FINALS...`);
      broadcast({
        type: 'ADVANCE_SLOT',
        teamNum,
        teamName: team.name,
        tagClass: team.color,
        targetSlot: team.qf
      });
    } 
    else if (currentWins === 1) {
      console.log(`🏆 Advancing [#${teamNum} ${team.name}] to SEMI-FINALS...`);
      broadcast({
        type: 'ADVANCE_SLOT',
        teamNum,
        teamName: team.name,
        tagClass: team.color,
        targetSlot: team.sf
      });
    } 
    else if (currentWins === 2) {
      console.log(`🔥 [#${teamNum} ${team.name}] enters the GRAND FINAL!`);
      broadcast({
        type: 'ADVANCE_SLOT',
        teamNum,
        teamName: team.name,
        tagClass: team.color,
        targetSlot: team.final
      });
    } 
    else if (currentWins === 3) {
      console.log(`👑 CROWNING GRAND CHAMPION: [#${teamNum} ${team.name}]!`);
      broadcast({
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
}

run();