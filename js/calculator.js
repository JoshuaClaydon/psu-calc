// PSU Calc — calculator.js
// All calculator logic. Component data is loaded from /components/*.json

const PSU_TIERS = [450, 550, 650, 750, 850, 1000, 1200, 1600];
const HEADROOM_FACTOR = 1.20; // 20% headroom

const PER_UNIT = {
  fan:   3,
  ram:   5,
  nvme:  10,
  hdd:   10,
};

let cpuData = [];
let gpuData = [];

// ─── Data loading ────────────────────────────────────────────────────────────

async function loadData() {
  try {
    const [cpuRes, gpuRes] = await Promise.all([
      fetch('/components/cpus.json'),
      fetch('/components/gpus.json'),
    ]);
    cpuData = await cpuRes.json();
    gpuData = await gpuRes.json();
    populateDropdowns();
  } catch (err) {
    console.error('Failed to load component data:', err);
    showLoadError();
  }
}

function showLoadError() {
  document.getElementById('result-card').innerHTML =
    '<p class="error">Failed to load component data. Please refresh the page.</p>';
}

// ─── Dropdowns ───────────────────────────────────────────────────────────────

function populateDropdowns() {
  const cpuSelect = document.getElementById('cpu-select');
  const gpuSelect = document.getElementById('gpu-select');

  cpuData.forEach(cpu => {
    const opt = document.createElement('option');
    opt.value = cpu.id;
    opt.textContent = `${cpu.name} (${cpu.tdp}W)`;
    cpuSelect.appendChild(opt);
  });

  gpuData.forEach(gpu => {
    const opt = document.createElement('option');
    opt.value = gpu.id;
    opt.textContent = gpu.tdp > 0 ? `${gpu.name} (${gpu.tdp}W)` : gpu.name;
    gpuSelect.appendChild(opt);
  });

  // Default selections
  cpuSelect.value = 'i5-14600k';
  gpuSelect.value = 'rtx4070';

  calculate();
}

// ─── Core calculation ─────────────────────────────────────────────────────────

function getComponentWattage() {
  const cpuId  = document.getElementById('cpu-select').value;
  const gpuId  = document.getElementById('gpu-select').value;
  const fans   = parseInt(document.getElementById('fans').value, 10)  || 0;
  const ram    = parseInt(document.getElementById('ram').value, 10)   || 0;
  const nvme   = parseInt(document.getElementById('nvme').value, 10)  || 0;
  const hdd    = parseInt(document.getElementById('hdd').value, 10)   || 0;

  const cpu = cpuData.find(c => c.id === cpuId) || { name: 'CPU', tdp: 0 };
  const gpu = gpuData.find(g => g.id === gpuId) || { name: 'GPU', tdp: 0 };

  return [
    { label: cpu.name,        category: 'CPU',      watts: cpu.tdp },
    { label: gpu.name,        category: 'GPU',      watts: gpu.tdp },
    { label: `${fans}× Case Fan`,  category: 'Fans',     watts: fans  * PER_UNIT.fan  },
    { label: `${ram}× RAM Stick`,  category: 'RAM',      watts: ram   * PER_UNIT.ram  },
    { label: `${nvme}× NVMe SSD`,  category: 'Storage',  watts: nvme  * PER_UNIT.nvme },
    { label: `${hdd}× HDD`,        category: 'Storage',  watts: hdd   * PER_UNIT.hdd  },
  ];
}

function recommendPSU(totalDraw) {
  const withHeadroom = totalDraw * HEADROOM_FACTOR;
  const recommended = PSU_TIERS.find(t => t >= withHeadroom) || PSU_TIERS[PSU_TIERS.length - 1];
  const actualHeadroom = Math.round(((recommended / totalDraw) - 1) * 100);
  return { recommended, withHeadroom: Math.round(withHeadroom), actualHeadroom };
}

// ─── Render ──────────────────────────────────────────────────────────────────

function calculate() {
  const components = getComponentWattage();
  const totalDraw  = components.reduce((sum, c) => sum + c.watts, 0);

  if (totalDraw === 0) {
    document.getElementById('result-card').classList.add('hidden');
    return;
  }

  const { recommended, withHeadroom, actualHeadroom } = recommendPSU(totalDraw);

  renderResult(recommended, totalDraw, withHeadroom, actualHeadroom);
  renderBreakdown(components, totalDraw);

  document.getElementById('result-card').classList.remove('hidden');
  document.getElementById('breakdown-section').classList.remove('hidden');
  document.getElementById('headroom-explainer').classList.remove('hidden');
}

function renderResult(recommended, totalDraw, withHeadroom, actualHeadroom) {
  document.getElementById('recommended-wattage').textContent = `${recommended}W`;
  document.getElementById('total-draw').textContent   = `${totalDraw}W`;
  document.getElementById('draw-headroom').textContent = `${withHeadroom}W`;
  document.getElementById('headroom-pct').textContent  = `${actualHeadroom}%`;

  // Colour-code the headroom badge
  const badge = document.getElementById('headroom-badge');
  badge.className = 'headroom-badge';
  if (actualHeadroom >= 40) {
    badge.classList.add('headroom-great');
    badge.title = 'Plenty of headroom — very efficient operating range';
  } else if (actualHeadroom >= 20) {
    badge.classList.add('headroom-good');
    badge.title = 'Good headroom — PSU will run efficiently';
  } else {
    badge.classList.add('headroom-tight');
    badge.title = 'Tight headroom — consider the next tier up';
  }
}

function renderBreakdown(components, totalDraw) {
  const tbody = document.getElementById('breakdown-body');
  tbody.innerHTML = '';

  components.forEach(c => {
    if (c.watts === 0) return;
    const pct = Math.round((c.watts / totalDraw) * 100);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.label}</td>
      <td class="text-right">${c.watts}W</td>
      <td class="text-right">${pct}%</td>
      <td class="bar-cell">
        <div class="bar-bg">
          <div class="bar-fill" style="width:${pct}%"></div>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  // Totals row
  const tr = document.createElement('tr');
  tr.classList.add('totals-row');
  tr.innerHTML = `<td><strong>Total</strong></td><td class="text-right"><strong>${totalDraw}W</strong></td><td colspan="2"></td>`;
  tbody.appendChild(tr);
}

// ─── Event listeners ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadData();

  ['cpu-select','gpu-select','fans','ram','nvme','hdd'].forEach(id => {
    document.getElementById(id).addEventListener('change', calculate);
    document.getElementById(id).addEventListener('input',  calculate);
  });
});
