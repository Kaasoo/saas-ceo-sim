'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SAVES = path.join(__dirname, 'saves');
if (!fs.existsSync(SAVES)) fs.mkdirSync(SAVES);

app.post('/api/save/:slot', (req, res) => {
  try {
    fs.writeFileSync(path.join(SAVES, `slot${req.params.slot}.json`), JSON.stringify(req.body));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/save/:slot', (req, res) => {
  const f = path.join(SAVES, `slot${req.params.slot}.json`);
  if (!fs.existsSync(f)) return res.json({ ok: false });
  res.json({ ok: true, state: JSON.parse(fs.readFileSync(f)) });
});

app.get('/api/saves', (req, res) => {
  const slots = [1, 2, 3].map(i => {
    const f = path.join(SAVES, `slot${i}.json`);
    if (!fs.existsSync(f)) return { slot: i, empty: true };
    const s = JSON.parse(fs.readFileSync(f));
    return { slot: i, name: s.name, year: s.year, quarter: s.quarter, cash: s.cash };
  });
  res.json(slots);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const locals = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) locals.push(net.address);
    }
  }
  console.log(`\n🎮 CEO 시뮬레이터 1980-2050`);
  console.log(`   PC:     http://localhost:${PORT}`);
  locals.forEach(ip => console.log(`   모바일: http://${ip}:${PORT}  ← 같은 WiFi에서 접속`));
  console.log('');
});
