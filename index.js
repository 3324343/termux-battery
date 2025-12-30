const express = require("express");
const { exec } = require("child_process");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 33243;

// const WEBHOOK_URL = "PASTE_YOUR_WEBHOOK_TOKEN_HERE";

let lastBattery = null;
let latestBattery = null;

function getBattery() {
  return new Promise((resolve, reject) => {
    exec("termux-battery-status", (err, stdout) => {
      if (err) return reject(err);
      resolve(JSON.parse(stdout));
    });
  });
}


function isChanged(now, prev) {
  if (!prev) return true;
  return (
    now.percentage !== prev.percentage ||
    now.status !== prev.status ||
    now.plugged !== prev.plugged
  );
}


async function sendWebhook(b) {
  await axios.post(WEBHOOK_URL, {
    embeds: [{
      title: "🔋 Battery Status",
      color: b.percentage <= 20 ? 0xff0000 : 0x00ff88,
      fields: [
        { name: "Percentage", value: `${b.percentage}%`, inline: true },
        { name: "Status", value: b.status, inline: true },
        { name: "Plugged", value: b.plugged ? "Yes" : "No", inline: true },
        { name: "Temperature", value: `${b.temperature}°C`, inline: true }
      ],
      timestamp: new Date().toISOString()
    }]
  });
}

async function monitor() {
  try {
    const b = await getBattery();
    latestBattery = b;

    if (isChanged(b, lastBattery)) {
      lastBattery = b;
      await sendWebhook(b);

      if (b.percentage <= 20) {
        exec("termux-brightness 1");
      }

      console.log("Battery update sent");
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}


app.get("/api/status", (_, res) => {
  if (!latestBattery) return res.json({ loading: true });
  res.json(latestBattery);
});


app.use("/", express.static(path.join(__dirname, "web")));

app.listen(PORT, () => {
  console.log(`[+] Web GUI running at http://localhost:${PORT}`);
});

monitor();
setInterval(monitor, 5000);
