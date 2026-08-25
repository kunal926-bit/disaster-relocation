// GeoSentinel frontend prototype
// This version runs entirely in the browser so it is easy to demo from a PPT link.
// Replace the demo calculations with Flask/API calls when the backend is ready.

let map;
let hazardLayer;
let routeLayer;
let markersLayer;

const state = {
  rainfall: 30,
  river: 55,
  risk: 0.76,
  households: 245,
  critical: 61,
  capacity: 120
};

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initMap();
  renderPriority();
  renderRainChart();
  renderShelters();
  renderVulnerability();
  initSimulation();
  updateDashboard();
});

function initNavigation() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.view;

      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".view").forEach(v => v.classList.remove("active-view"));
      document.getElementById(target).classList.add("active-view");

      const titles = {
        dashboard: "Disaster Relocation Command Center",
        hazard: "Multi-Hazard Risk Engine",
        vulnerability: "Household Vulnerability",
        relocation: "AI Relocation Planner",
        shelters: "Shelter Capacity & Assignment",
        simulation: "Disaster What‑If Laboratory",
        reports: "Operational Report"
      };
      document.getElementById("pageTitle").textContent = titles[target];

      // Leaflet needs a resize after switching from display:none.
      if (target === "dashboard" && map) {
        setTimeout(() => map.invalidateSize(), 100);
      }
    });
  });

  document.getElementById("simulateBtn").addEventListener("click", () => {
    document.querySelector('[data-view="simulation"]').click();
  });

  document.getElementById("alertBtn").addEventListener("click", () => {
    alert("3 active alerts:\n1. Flood risk increasing\n2. Road R7 has high blockage probability\n3. Shelter B recommended for P1 households");
  });
}

function initMap() {
  map = L.map("map", { zoomControl: true }).setView([23.2599, 77.4126], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  hazardLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);

  drawHazardMap();
}

function drawHazardMap() {
  hazardLayer.clearLayers();
  markersLayer.clearLayers();
  routeLayer.clearLayers();

  // Demo hazard polygons. In production these should come from GIS/GeoJSON.
  const criticalZone = [
    [23.29,77.37],[23.32,77.41],[23.30,77.47],[23.25,77.49],
    [23.22,77.44],[23.24,77.38]
  ];

  const warningZone = [
    [23.34,77.34],[23.38,77.42],[23.34,77.51],[23.27,77.54],
    [23.20,77.48],[23.20,77.35]
  ];

  L.polygon(warningZone, {
    color:"#f2a33a", fillColor:"#f2a33a", fillOpacity:.16, weight:2
  }).bindPopup("<b>Warning Zone</b><br>Moderate hazard exposure").addTo(hazardLayer);

  L.polygon(criticalZone, {
    color:"#e53950", fillColor:"#e53950", fillOpacity:.27, weight:2
  }).bindPopup("<b>Dynamic Critical Zone</b><br>Risk index: " + state.risk.toFixed(2)).addTo(hazardLayer);

  const houses = [
    [23.255,77.402,"H001","Priority P1","94"],
    [23.272,77.421,"H002","Priority P1","91"],
    [23.287,77.446,"H003","Priority P2","78"],
    [23.235,77.398,"H004","Priority P3","52"],
    [23.305,77.461,"H005","Priority P2","72"]
  ];

  houses.forEach(h => {
    const score = Number(h[4]);
    const color = score >= 85 ? "#e53950" : score >= 65 ? "#f2a33a" : "#2d9b67";
    L.circleMarker([h[0],h[1]], {
      radius:7, color:"#fff", weight:2, fillColor:color, fillOpacity:1
    }).bindPopup(`<b>${h[2]}</b><br>${h[3]}<br>Risk score: ${score}/100`).addTo(markersLayer);
  });

  const shelters = [
    [23.216,77.432,"Shelter A",100,90],
    [23.245,77.482,"Shelter B",300,180],
    [23.310,77.385,"Shelter C",150,140]
  ];

  shelters.forEach(s => {
    L.marker([s[0],s[1]], {
      title:s[2]
    }).bindPopup(`<b>${s[2]}</b><br>Capacity: ${s[3]}<br>Occupied: ${s[4]}`).addTo(markersLayer);
  });

  // Demo recommended route: longer but lower hazard.
  const route = [
    [23.255,77.402],[23.248,77.414],[23.241,77.428],
    [23.245,77.446],[23.245,77.482]
  ];
  L.polyline(route, {color:"#1f6fd1", weight:6, opacity:.9}).addTo(routeLayer)
    .bindPopup("<b>Recommended Route B</b><br>Low hazard exposure • ETA 17 min");
}

function renderPriority() {
  const data = [
    ["H001","Elderly + children","94"],
    ["H002","Weak house + high exposure","91"],
    ["H003","High exposure","78"],
    ["H005","Road access difficulty","72"]
  ];

  document.getElementById("priorityList").innerHTML = data.map((x,i) => `
    <div class="priority-item">
      <div class="priority-number">P${i < 2 ? 1 : 2}</div>
      <div><strong>${x[0]}</strong><small>${x[1]}</small></div>
      <div class="priority-score">${x[2]}</div>
    </div>
  `).join("");
}

function renderRainChart() {
  const values = [42,55,48,72,66,81,59,96,88,110];
  const max = Math.max(...values);
  document.getElementById("rainChart").innerHTML = values.map((v,i) => `
    <div class="bar" style="height:${Math.max(12,(v/max)*130)}px">
      <span>${i+1}</span>
    </div>
  `).join("");
}

function renderVulnerability() {
  const rows = [
    ["H001","95","94","~35 min","P1"],
    ["H002","91","89","~48 min","P1"],
    ["H003","78","73","~1.2 hr","P2"],
    ["H005","72","68","~1.5 hr","P2"],
    ["H004","40","32","~3.1 hr","P3"]
  ];

  document.getElementById("vulnerabilityTable").innerHTML = rows.map(r => `
    <tr>
      <td><b>${r[0]}</b></td>
      <td>${r[1]}%</td>
      <td>${r[2]}%</td>
      <td>${r[3]}</td>
      <td><b class="${r[4] === "P1" ? "danger-text" : ""}">${r[4]}</b></td>
    </tr>
  `).join("");
}

function renderShelters() {
  const shelters = [
    ["Shelter A",100,90,"10% available","Medium"],
    ["Shelter B",300,180,"40% available","Low"],
    ["Shelter C",150,140,"7% available","High"]
  ];

  document.getElementById("shelterGrid").innerHTML = shelters.map(s => {
    const percent = Math.round((s[2]/s[1])*100);
    const fill = Math.max(5,100-percent);
    return `
      <div class="shelter">
        <h4>${s[0]}</h4>
        <p class="muted">${s[2]} / ${s[1]} occupied</p>
        <div class="capacity-bar"><div class="capacity-fill" style="width:${percent}%"></div></div>
        <p class="muted" style="margin-top:8px">Hazard exposure: <b>${s[3]}</b></p>
        <p class="muted">Status: <b>${s[4]}</b></p>
      </div>
    `;
  }).join("");
}

function initSimulation() {
  const rain = document.getElementById("rainSlider");
  const river = document.getElementById("riverSlider");

  rain.addEventListener("input", () => {
    state.rainfall = Number(rain.value);
    document.getElementById("rainValue").textContent = rain.value + "%";
  });

  river.addEventListener("input", () => {
    state.river = Number(river.value);
    document.getElementById("riverValue").textContent = river.value + "%";
  });

  document.getElementById("runSimulation").addEventListener("click", runSimulation);
}

function runSimulation() {
  const rain = state.rainfall;
  const river = state.river;

  // Transparent prototype scoring formula.
  // Replace with a trained model/API when backend is connected.
  const severity = Math.min(100, Math.round(rain * .65 + river * .55));
  const risk = Math.min(.99, .45 + severity / 180);

  const households = Math.round(110 + severity * 4.5);
  const critical = Math.round(20 + severity * .65);
  const shelters = Math.max(2, Math.ceil(households / 70));
  const roads = Math.max(1, Math.round(severity / 25));
  const eta = Math.round(16 + severity * .18);

  state.risk = risk;
  state.households = households;
  state.critical = critical;

  document.getElementById("simHouseholds").textContent = households;
  document.getElementById("simCritical").textContent = critical;
  document.getElementById("simShelters").textContent = shelters;
  document.getElementById("simRoads").textContent = roads;
  document.getElementById("simEta").textContent = eta + " min";

  document.getElementById("simulationLog").innerHTML =
    `<strong>Simulation completed.</strong> ` +
    `Rainfall +${rain}% and river stress ${river}% produce a risk index of ` +
    `<b>${risk.toFixed(2)}</b>. GeoSentinel recalculated household priority, shelter demand and safer evacuation routes.`;

  updateDashboard();
  drawHazardMap();
}

function updateDashboard() {
  document.getElementById("riskIndex").textContent = state.risk.toFixed(2);
  document.getElementById("riskLabel").textContent =
    state.risk >= .75 ? "High" : state.risk >= .5 ? "Moderate" : "Low";
  document.getElementById("households").textContent = state.households;
  document.getElementById("critical").textContent = state.critical;

  document.getElementById("decisionText").textContent =
    `${state.critical} critical households should move toward Shelter B using the low-risk route.`;

  document.getElementById("reportCritical").textContent = state.critical;

  if (map) drawHazardMap();
}
