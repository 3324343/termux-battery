async function updateBattery() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();

    document.getElementById("percent").textContent =
      (data.percentage ?? "--") + "%";

    document.getElementById("status").textContent =
      "Status: " + (data.status ?? "Unknown");

    document.getElementById("temp").textContent =
      "Temp: " + (data.temperature ?? "--") + "°C";

    document.getElementById("plugged").textContent =
      "Plugged: " + (data.plugged ? "Yes" : "No");

  } catch (e) {
    document.getElementById("status").textContent = "Backend not reachable";
    console.error(e);
  }
}

updateBattery();
setInterval(updateBattery, 3000);
