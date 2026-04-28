/* ===================================================
   CHARTS.JS – Canvas charts + bar builders (white theme)
   =================================================== */

/* ---------- Scene 1: Hook Line Chart ---------- */
function drawHookLineChart() {
  const container = document.getElementById('hookLineChart');
  if (!container) return;
  container.innerHTML = '';

  const width = container.clientWidth;
  const height = container.clientHeight;
  const margin = { top: 40, right: 50, bottom: 40, left: 50 };

  const svg = d3.select("#hookLineChart").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  if (typeof indonesiaNasional === 'undefined') return;
  const data = [
    { year: 2021, value: indonesiaNasional.y2021 },
    { year: 2022, value: indonesiaNasional.y2022 },
    { year: 2023, value: indonesiaNasional.y2023 },
    { year: 2024, value: indonesiaNasional.y2024 }
  ];

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([0, width - margin.left - margin.right]);

  const y = d3.scaleLinear()
    .domain([50, 80])
    .range([height - margin.top - margin.bottom, 0]);

  // Grid Lines
  svg.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)
      .tickSize(-(width - margin.left - margin.right))
      .tickFormat("")
      .ticks(4)
    )
    .style("stroke-dasharray", "3,3")
    .style("opacity", 0.1);

  // X Axis
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format("d")))
    .call(g => g.select(".domain").remove())
    .selectAll("text")
    .style("color", "#94a3b8")
    .style("font-size", "12px");

  // Y Axis (Percentage)
  svg.append("g")
    .call(d3.axisLeft(y).ticks(4).tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove())
    .selectAll("text")
    .style("color", "#94a3b8")
    .style("font-size", "11px");

  // Area under line
  const area = d3.area()
    .x(d => x(d.year))
    .y0(height - margin.top - margin.bottom)
    .y1(d => y(d.value))
    .curve(d3.curveMonotoneX);

  svg.append("path")
    .datum(data)
    .attr("fill", "url(#hookGradient)")
    .attr("d", area)
    .style("opacity", 0)
    .transition()
    .duration(2000)
    .style("opacity", 0.4);

  const grad = svg.append("defs")
    .append("linearGradient")
    .attr("id", "hookGradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "0%").attr("y2", "100%");
  grad.append("stop").attr("offset", "0%").attr("stop-color", "#2563eb").attr("stop-opacity", 0.3);
  grad.append("stop").attr("offset", "100%").attr("stop-color", "#2563eb").attr("stop-opacity", 0);

  // Line
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  const path = svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#2563eb")
    .attr("stroke-width", 4)
    .attr("d", line);

  const totalLength = path.node().getTotalLength();
  path
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(4000) // 4 seconds
    .ease(d3.easeCubicOut)
    .attr("stroke-dashoffset", 0)
    .on("end", () => {
      // Callback to app.js if needed
      if (window.onHookChartComplete) window.onHookChartComplete();
    });

  // Dots & Labels (adjust delays to match 4s)
  const dots = svg.selectAll(".dot")
    .data(data)
    .enter().append("g");

  dots.append("circle")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.value))
    .attr("r", 6)
    .attr("fill", "#fff")
    .attr("stroke", "#2563eb")
    .attr("stroke-width", 3)
    .style("opacity", 0)
    .transition()
    .delay((d, i) => (i / (data.length - 1)) * 4000)
    .duration(500)
    .style("opacity", 1);

  dots.append("text")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.value) - 15)
    .attr("text-anchor", "middle")
    .text(d => d.value.toFixed(2).replace('.', ',') + "%")
    .style("font-size", "14px")
    .style("font-weight", "800")
    .style("fill", "#1d4ed8")
    .style("font-family", "'Space Grotesk', sans-serif")
    .style("opacity", 0)
    .transition()
    .delay((d, i) => (i / (data.length - 1)) * 4000 + 300)
    .duration(500)
    .style("opacity", 1);
}

/* ---------- Scene 6: Expenditure Bar Chart ---------- */
/* ---------- Scene 6: Packed Bubble Chart ---------- */
function drawExpenditureBarChart() {
  const container = document.getElementById('expenditureChart');
  if (!container) return;
  container.innerHTML = '';

  const width = container.clientWidth || 600;
  const height = container.clientHeight || 450;
  const margin = { top: 60, right: 30, bottom: 40, left: 60 };

  const svg = d3.select("#expenditureChart").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  if (typeof telekomData === 'undefined') return;
  const data = telekomData;

  const x0 = d3.scaleBand()
    .domain(data.years.map(String))
    .rangeRound([0, width - margin.left - margin.right])
    .paddingInner(0.3);

  const categories = ["perkotaan", "nasional", "perdesaan"];
  const colors = { perkotaan: "#2563eb", nasional: "#f59e0b", perdesaan: "#10b981" };

  const x1 = d3.scaleBand()
    .domain(categories)
    .rangeRound([0, x0.bandwidth()])
    .padding(0.15);

  const y = d3.scaleLinear()
    .domain([0, 280000])
    .range([height - margin.top - margin.bottom, 0]);

  // Grid Lines
  svg.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)
      .tickSize(-(width - margin.left - margin.right))
      .tickFormat("")
      .ticks(5)
    )
    .style("stroke-dasharray", "3,3")
    .style("opacity", 0.1);

  // X Axis
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x0))
    .call(g => g.select(".domain").remove())
    .selectAll("text")
    .style("color", "#64748b")
    .style("font-size", "12px");

  // Y Axis
  svg.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `Rp${d/1000}K`))
    .call(g => g.select(".domain").remove())
    .selectAll("text")
    .style("color", "#94a3b8")
    .style("font-size", "11px");

  // Bars
  const yearGroup = svg.selectAll(".year-group")
    .data(data.years)
    .enter().append("g")
    .attr("transform", d => `translate(${x0(String(d))},0)`);

  yearGroup.selectAll("rect")
    .data(year => categories.map(cat => ({ key: cat, value: data[cat][data.years.indexOf(year)], year: year })))
    .enter().append("rect")
    .attr("x", d => x1(d.key))
    .attr("y", height - margin.top - margin.bottom)
    .attr("width", x1.bandwidth())
    .attr("height", 0)
    .attr("fill", d => colors[d.key])
    .attr("rx", 4)
    .style("opacity", 0.9)
    .transition()
    .duration(1000)
    .delay((d, i) => i * 100)
    .attr("y", d => y(d.value))
    .attr("height", d => height - margin.top - margin.bottom - y(d.value));

  // Labels for 2024
  yearGroup.filter(d => d === 2024)
    .selectAll(".bar-label")
    .data(year => categories.map(cat => ({ key: cat, value: data[cat][data.years.indexOf(year)] })))
    .enter().append("text")
    .attr("class", "bar-label")
    .attr("x", d => x1(d.key) + x1.bandwidth() / 2)
    .attr("y", d => y(d.value) - 10)
    .attr("text-anchor", "middle")
    .text(d => `Rp${Math.round(d.value/1000)}K`)
    .style("font-size", "9px")
    .style("font-weight", "700")
    .style("fill", d => colors[d.key])
    .style("opacity", 0)
    .transition()
    .delay(1200)
    .duration(500)
    .style("opacity", 1);

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(0, -40)`);

  const legendItems = legend.selectAll(".legend-item")
    .data(categories)
    .enter().append("g")
    .attr("transform", (d, i) => `translate(${i * 120}, 0)`);

  legendItems.append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("rx", 3)
    .attr("fill", d => colors[d]);

  legendItems.append("text")
    .attr("x", 18)
    .attr("y", 10)
    .text(d => d.charAt(0).toUpperCase() + d.slice(1))
    .style("font-size", "12px")
    .style("font-weight", "600")
    .style("fill", "#64748b");
}

/* ---------- Build media bars ---------- */
function buildMediaBars() {
  const container = document.getElementById('mediaBarsContainer');
  if (!container) return;
  container.innerHTML = '';
  mediaData.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'usage-row media-bar-row';
    row.id = `bar${item.id}`;
    row.innerHTML = `
      <span class="usage-label" title="${item.label}">${item.label}</span>
      <div class="media-bar-bg">
        <div class="media-bar-fill media-fill" id="fill${item.id}" data-width="${item.value}" style="background:${item.color}"></div>
      </div>
      <span class="usage-val media-val" data-val="${item.value}">0%</span>`;
    container.appendChild(row);
  });
}

/* ---------- Build usage bars ---------- */
function buildUsageBars() {
  const container = document.getElementById('usageBarsContainer');
  if (!container) return;
  container.innerHTML = '';
  const sorted = [...usageData].sort((a, b) => b.value - a.value);
  const colorMap = {
    konsumsi: 'linear-gradient(90deg,#f97316,#fb923c)',
    info:     'linear-gradient(90deg,#2563eb,#60a5fa)',
    ecommerce:'linear-gradient(90deg,#7c3aed,#a78bfa)',
    produktif:'linear-gradient(90deg,#059669,#34d399)',
  };
  sorted.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'usage-row';
    row.innerHTML = `
      <span class="usage-label" title="${item.label}">${item.label}</span>
      <div class="media-bar-bg">
        <div class="media-bar-fill usage-fill" data-width="${item.value}" style="background:${colorMap[item.category]}"></div>
      </div>
      <span class="usage-val" data-val="${item.value}">0%</span>`;
    container.appendChild(row);
  });
}

/* ---------- Animate bars ---------- */
function animateBars(container) {
  if (!container) return;
  container.querySelectorAll('[data-w]').forEach(el => {
    el.style.width = el.dataset.w + '%';
  });
}

/* ---------- Tooltip helpers ---------- */
const tooltip = document.getElementById('tooltip');
function showTooltip(e, html) {
  tooltip.innerHTML = html;
  tooltip.classList.add('visible');
  moveTooltip(e);
}
function moveTooltip(e) {
  let x = e.clientX + 14, y = e.clientY - 10;
  if (x + 220 > window.innerWidth) x = e.clientX - 230;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}
function hideTooltip() { tooltip.classList.remove('visible'); }
document.addEventListener('mousemove', e => { if (tooltip.classList.contains('visible')) moveTooltip(e); });

/* ---------- roundRect polyfill ---------- */
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2*r) r = w/2; if (h < 2*r) r = h/2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y, x+w, y+h, r);
    this.arcTo(x+w, y+h, x, y+h, r);
    this.arcTo(x, y+h, x, y, r);
    this.arcTo(x, y, x+w, y, r);
    this.closePath(); return this;
  };
}
