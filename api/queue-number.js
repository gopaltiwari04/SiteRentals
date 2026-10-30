/**
 * Vercel Serverless Function: GET /api/queue-number
 * Returns current queue position
 */

const fs = require('fs');
const path = require('path');

const QUEUE_FILE = process.env.VERCEL
  ? path.join('/tmp', 'queue_state.json')
  : path.join(__dirname, '..', 'queue_state.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let queueNum = 13;
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      const data = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8') || '{}');
      if (data.currentQueueNumber) {
        queueNum = data.currentQueueNumber;
      }
    } else {
      fs.writeFileSync(QUEUE_FILE, JSON.stringify({ currentQueueNumber: 13, totalSubmissions: 0 }, null, 2), 'utf8');
    }
  } catch (e) {
    // Fallback in-memory / default
  }

  return res.status(200).json({ currentQueueNumber: queueNum });
};
