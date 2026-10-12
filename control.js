#!/usr/bin/env node

/**
 * GDG Hong Kong - Live Stage Commander CLI
 */

const https = require('https');
const http = require('http');

// 👉 Hardcoded live domain (No need to ever run "export VERCEL_URL" again!)
const LIVE_DOMAIN = "gdg-knockout-pvk353gco-heylinpaus-projects.vercel.app";

let rawHost = process.env.VERCEL_URL || LIVE_DOMAIN;
const TARGET_HOST = rawHost
  .replace(/^https?:\/\//i, '')
  .replace(/\/.*$/, '')
  .trim();

const ADMIN_KEY = 'gdghk2026';

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

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

async function sendUpdate(payload) {
  const isLocal = TARGET_HOST.includes('localhost');
  const client = isLocal ? http : https;
  const data = JSON.stringify(payload);

  const options = {
    hostname: TARGET_HOST.split(':')[0],
    port: isLocal ? 3000 : 443,
    path: '/api/update',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'x-admin-key': ADMIN_KEY
    }
  };

  const req = client.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`\x1b[32m✔ [LIVE BROADCAST SUCCESS]\x1b[0m Screen updated in real-time!`);
    });
  });

  req.on('error', (e) => console.error(`\x1b[31m✖ Sync Error:\x1b[0m ${e.message}`));
  req.write(data);
  req.end();
}

async function getState() {
  return new Promise((resolve, reject) => {
    const isLocal = TARGET_HOST.includes('localhost');
    const client = isLocal ? http : https;
    const url = `${isLocal ? 'http' : 'https'}://${TARGET_HOST}/api/state`;

    client.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error("Could not parse server response"));
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  if (!command) {
    console.log(`
\x1b[36mGDG Live Bracket Commander\x1b[0m
  node control.js win <1-16>            -> Advance Round 1 team
  node control.js sf <L-QF-1..4>        -> Advance QF winner to Semi
  node control.js final <L-SF-1 or 2>   -> Advance Semi winner to Grand Final
  node control.js champ "<Team Name>"   -> Crown Tournament Champion
  node control.js reset                 -> Reset Tournament
    `);
    return;
  }

  try {
    if (command === 'win') {
      const teamNum = args[1];
      const targetSlot = R1_MAP[teamNum];
      if (!targetSlot) return console.log('Specify team number 1-16');
      const state = await getState();
      const teamName = state.teams[teamNum];
      console.log(`🏆 Advancing [${teamName}] to ${targetSlot}...`);
      sendUpdate({ targetSlot, winnerName: teamName });
    } 
    else if (command === 'sf') {
      const fromSlot = args[1]?.toUpperCase();
      const state = await getState();
      const winnerName = state.matches[fromSlot];
      const targetSlot = fromSlot.startsWith('L') ? (['L-QF-1','L-QF-2'].includes(fromSlot) ? 'L-SF-1' : 'L-SF-2') : (['R-QF-1','R-QF-2'].includes(fromSlot) ? 'R-SF-1' : 'R-SF-2');
      console.log(`🏆 Advancing [${winnerName}] to Semi-Finals (${targetSlot})...`);
      sendUpdate({ targetSlot, winnerName });
    }
    else if (command === 'final') {
      const fromSlot = args[1]?.toUpperCase();
      const state = await getState();
      const winnerName = state.matches[fromSlot];
      const targetSlot = fromSlot.startsWith('L') ? 'F-1' : 'F-2';
      console.log(`🔥 [${winnerName}] enters the GRAND FINAL (${targetSlot})!`);
      sendUpdate({ targetSlot, winnerName });
    }
    else if (command === 'champ') {
      const champName = args.slice(1).join(' ');
      console.log(`👑 CROWNING CHAMPION: ${champName}`);
      sendUpdate({ targetSlot: 'CHAMPION', winnerName: champName });
    }
    else if (command === 'reset') {
      console.log(`🔄 Resetting bracket...`);
      sendUpdate({ reset: true });
    }
  } catch (err) {
    console.error(`\x1b[31mError:\x1b[0m ${err.message}`);
  }
}

run();