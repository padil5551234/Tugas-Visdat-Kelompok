

let currentMapMode = 'penetrasi';
let mapPaths = {};
let tooltipEl, overlayPanelEl, mapLegendEl, mapTitleEl;
let svg, g, path, projection, width, height, zoom;
let selectedMapProvince = null;
let mapContainer = null;
let isDetailOpen = false;
let mapInteractive = false;
let wasMapFullScreen = false;
let mapGeoJSONData = null; 

const PROVINCE_MAP = {
  "Daerah Istimewa Yogyakarta": "DI Yogyakarta",
  "Nusa Tenggara Barat": "NTB",
  "Nusa Tenggara Timur": "NTT",
  "Kepulauan Riau": "Kep. Riau",
  "Kepulauan Bangka Belitung": "Kep. Bangka Belitung"
};
function normalizeProvName(n) { return PROVINCE_MAP[n] || n; }

function getMapColor(value, mode) {
  if (value === null || value === undefined) return '#f1f5f9';
  if (mode === 'penetrasi') {
    // Hijau (Tinggi) ke Putih-ish (Rendah)
    if (value >= 87) return '#064e3b';
    if (value >= 82) return '#059669';
    if (value >= 77) return '#10b981';
    if (value >= 72) return '#34d399';
    if (value >= 67) return '#6ee7b7';
    if (value >= 60) return '#a7f3d0';
    if (value >= 50) return '#d1fae5';
    return '#f0fdf4'; // Light green-white
  } else { // blankspot — Putih (0) ke Merah (Tinggi)
    if (value >= 500) return '#7f1d1d';
    if (value >= 200) return '#b91c1c';
    if (value >= 100) return '#dc2626';
    if (value >= 50)  return '#ef4444';
    if (value >= 30)  return '#f87171';
    if (value >= 20)  return '#fca5a5';
    if (value >= 5)   return '#fecaca';
    if (value > 0)    return '#fee2e2';
    return '#ffffff'; // 0 = putih (aman)
  }
}

/* ── Legend config ── */
const LEGEND_CONFIG = {
  penetrasi: {
    title: 'Penetrasi Internet 2024',
    items: [
      { color: '#064e3b', label: '≥ 87%' },
      { color: '#059669', label: '82–86%' },
      { color: '#10b981', label: '77–81%' },
      { color: '#34d399', label: '72–76%' },
      { color: '#6ee7b7', label: '67–71%' },
      { color: '#a7f3d0', label: '60–66%' },
      { color: '#d1fae5', label: '50–59%' },
      { color: '#f0fdf4', label: '< 50%' },
    ]
  },
  blankspot: {
    title: 'Desa Tanpa Sinyal',
    items: [
      { color: '#7f1d1d', label: '≥ 500 desa' },
      { color: '#b91c1c', label: '200–499' },
      { color: '#dc2626', label: '100–199' },
      { color: '#ef4444', label: '50–99' },
      { color: '#f87171', label: '30–49' },
      { color: '#fca5a5', label: '20–29' },
      { color: '#fecaca', label: '5–19' },
      { color: '#fee2e2', label: '1–4' },
      { color: '#ffffff', label: '0 (aman)' },
    ]
  }
};

/* ── Lookups ── */
function buildLookups() {
  const penetrasiLookup = {}, blankSpotLookup = {}, blankSpotTotal = {};
  if (typeof provinsiData !== 'undefined')
    provinsiData.forEach(d => { penetrasiLookup[d.provinsi] = d.y2024; });
  if (typeof blankSpotData !== 'undefined')
    blankSpotData.forEach(d => {
      blankSpotLookup[d.provinsi] = d.blankSpot;
      blankSpotTotal[d.provinsi]  = d.total;
    });
  return { penetrasiLookup, blankSpotLookup, blankSpotTotal };
}

/* ═══════════════════════════════════════
   BUILD MAP
   ═══════════════════════════════════════ */
function buildIndonesiaMap() {
  mapContainer = document.getElementById('indonesiaMap');
  if (!mapContainer) return;
  mapContainer.innerHTML = '';
  mapContainer.style.position = 'relative';

  /* Pulse CSS */
  if (!document.getElementById('mapPulseStyle')) {
    const s = document.createElement('style');
    s.id = 'mapPulseStyle';
    s.textContent = `
      @keyframes mapProvPulse {
        0%,100% { stroke:#facc15; stroke-width:1.5px; }
        50%      { stroke:#fef08a; stroke-width:3.5px; filter:drop-shadow(0 0 8px #facc15); }
      }
      .prov-pulse { animation: mapProvPulse 1.4s ease-in-out infinite; }
    `;
    document.head.appendChild(s);
  }

  /* Tooltip */
  tooltipEl = document.getElementById('mapTooltip') || (() => {
    const el = document.createElement('div');
    el.id = 'mapTooltip';
    Object.assign(el.style, {
      position:'fixed', pointerEvents:'none', opacity:'0',
      background:'none', // Seamless
      padding:'0',
      fontFamily:"'Plus Jakarta Sans',sans-serif",
      fontSize:'12px', color:'#111827',
      transform:'translate(-50%,calc(-100% - 20px))',
      transition:'opacity .15s ease', zIndex:'9999',
      boxShadow:'none', maxWidth:'250px',
      textAlign: 'center',
      textShadow: '0 0 10px rgba(255,255,255,1), 0 0 5px rgba(255,255,255,0.8)'
    });
    document.body.appendChild(el);
    return el;
  })();

  /* Interactive Interpretation Panel (Positioned on the left, matching scrolly-text-col) */
  overlayPanelEl = document.getElementById('mapOverlayPanel') || (() => {
    const el = document.createElement('div');
    el.id = 'mapOverlayPanel';
    Object.assign(el.style, {
      position: 'fixed', top: '50%', right: '5%', left: 'auto',
      transform: 'translateY(-50%)',
      width: '35%', maxWidth: '500px',
      textAlign: 'left',
      fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#111827',
      zIndex: '1000', opacity: '0', pointerEvents: 'none',
      transition: 'opacity .35s ease, transform .4s cubic-bezier(.16,1,.3,1)',
      background: 'none', border: 'none', boxShadow: 'none'
    });
    document.body.appendChild(el);
    return el;
  })();

  /* Map Mode Title (Hapus sesuai permintaan user) */
  mapTitleEl = document.getElementById('mapModeTitle') || (() => {
    const el = document.createElement('div');
    el.id = 'mapModeTitle';
    el.style.display = 'none'; // Sembunyikan
    mapContainer.appendChild(el);
    return el;
  })();

  /* Legend (Floating text, no container) */
  mapLegendEl = document.getElementById('mapLegend') || (() => {
    const el = document.createElement('div');
    el.id = 'mapLegend';
    Object.assign(el.style, {
      position:'absolute', bottom:'15vh', left:'50%', transform:'translateX(-50%)',
      fontFamily:"'Plus Jakarta Sans',sans-serif",
      fontSize:'11px', color:'#64748b', zIndex:'998',
      background: 'none',
      width: '100%', display: 'flex', justifyContent: 'center'
    });
    mapContainer.appendChild(el);
    return el;
  })();

  /* SVG */
  width  = mapContainer.clientWidth  || window.innerWidth;
  height = mapContainer.clientHeight || window.innerHeight;

  zoom = d3.zoom().scaleExtent([1, 12])
    .on('zoom', ev => g.attr('transform', ev.transform));

  svg = d3.select('#indonesiaMap').append('svg')
    .attr('width','100%').attr('height','100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio','xMidYMid meet')
    .call(zoom)
    .on('click', function(event) {
      // Klik pada background (laut/area kosong) akan zoom out
      if (event.target === this) closeOverlay();
    });

  /* Glow filter */
  const defs   = svg.append('defs');
  const filter = defs.append('filter')
    .attr('id','mapGlow').attr('x','-40%').attr('y','-40%')
    .attr('width','180%').attr('height','180%');
  filter.append('feGaussianBlur').attr('stdDeviation','4').attr('result','blur');
  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode').attr('in','blur');
  feMerge.append('feMergeNode').attr('in','SourceGraphic');

  g = svg.append('g');

  try {
    const geojson = (typeof indonesiaGeoJSON !== 'undefined') ? indonesiaGeoJSON : null;
    if (!geojson) { console.error('indonesiaGeoJSON not found'); return; }
    mapGeoJSONData = geojson;

    const pad = Math.min(width, height) * 0.05;
    projection = d3.geoMercator()
      .fitExtent([[pad, pad], [width - pad, height - pad]], geojson);
    path = d3.geoPath().projection(projection);

    const { penetrasiLookup, blankSpotLookup, blankSpotTotal } = buildLookups();

    g.selectAll('path')
      .data(geojson.features)
      .enter().append('path')
      .attr('d', path)
      .attr('class', 'provinsi-path')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 0.7)
      .attr('fill', d => {
        const n = normalizeProvName(d.properties.Propinsi || d.properties.PROVINSI);
        return getMapColor(penetrasiLookup[n], 'penetrasi');
      })
      .style('cursor','pointer')
      .each(function(d) {
        mapPaths[normalizeProvName(d.properties.Propinsi || d.properties.PROVINSI)] = d3.select(this);
      })
      .on('mouseenter', function(event, d) {
        if (!mapInteractive || isDetailOpen) return;
        const n = normalizeProvName(d.properties.Propinsi || d.properties.PROVINSI);
        const penVal = penetrasiLookup[n];
        const bsVal  = blankSpotLookup[n];

        d3.select(this).raise()
          .transition().duration(120)
          .attr('stroke','#111827').attr('stroke-width', 1.5 / d3.zoomTransform(svg.node()).k);

        let valStr = '', sub = '';
        if (currentMapMode === 'penetrasi') {
          valStr = penVal != null ? penVal.toFixed(2) + '%' : 'N/A';
          sub = 'Penetrasi Internet 2024';
        } else {
          valStr = bsVal != null ? bsVal.toLocaleString('id-ID') + ' desa' : '0 desa';
          sub = 'Desa Tanpa Sinyal';
        }
        tooltipEl.innerHTML = `
          <div style="font-size:11px;letter-spacing:0.05em;color:#64748b;margin-bottom:2px;font-weight:600">${sub}</div>
          <div style="font-weight:800;font-size:16px;margin-bottom:2px;color:#111827">${n}</div>
          <div style="font-size:24px;font-weight:900;color:var(--accent-blue)">${valStr}</div>`;
        tooltipEl.style.opacity = '1';
      })
      .on('mousemove', function(event) {
        let x = event.clientX;
        let y = event.clientY;
        
        // Prevent tooltip from going off-screen
        if (x + 200 > window.innerWidth) x = window.innerWidth - 200;
        if (y + 150 > window.innerHeight) y = window.innerHeight - 150;
        
        tooltipEl.style.left = x + 'px';
        tooltipEl.style.top  = y + 'px';
      })
      .on('mouseleave', function() {
        if (!mapInteractive || isDetailOpen) return;
        d3.select(this).transition().duration(120)
          .attr('stroke','#0f172a')
          .attr('stroke-width', 0.7 / d3.zoomTransform(svg.node()).k);
        tooltipEl.style.opacity = '0';
      })
      .on('click', function(event, d) {
        // Cek level zoom saat ini (hanya boleh buka panel jika zoom out penuh / k=1)
        const transform = d3.zoomTransform(svg.node());
        const isZoomedIn = transform.k > 1.05; // Menggunakan threshold kecil untuk toleransi

        if (isZoomedIn) {
          // Jika sedang zoom in, klik di mana saja pada peta akan zoom out kembali
          closeOverlay();
          return;
        }

        if (!mapInteractive) return;

        const n = normalizeProvName(d.properties.Propinsi || d.properties.PROVINSI);
        tooltipEl.style.opacity = '0';
        if (selectedMapProvince === n && isDetailOpen) {
          // Klik kedua pada provinsi yang sama → tutup + zoom out
          closeOverlay();
        } else {
          zoomToProvince(d);
          showOverlay(n, penetrasiLookup, blankSpotLookup, blankSpotTotal);
        }
      });

    const overlayPanelEl_init = document.getElementById('mapOverlayPanel');
    if (overlayPanelEl_init) {
      // Ensure overlay panel starts hidden
      overlayPanelEl_init.style.opacity = '0';
      overlayPanelEl_init.style.pointerEvents = 'none';
    }

    updateMapTitle('penetrasi');
    renderLegend('penetrasi');

  } catch (err) { console.error('Map build error:', err); }
}

/* ═══════════════════════════════════════
   OVERLAY PANEL (centered, on click)
   ═══════════════════════════════════════ */
function showOverlay(provName, penetrasiLookup, blankSpotLookup, blankSpotTotal) {
  if (!overlayPanelEl) return;
  isDetailOpen = true;
  selectedMapProvince = provName;

  const penVal = penetrasiLookup[provName];
  const bsVal  = blankSpotLookup[provName];
  const bsTotal= blankSpotTotal[provName];
  const isBs   = currentMapMode === 'blankspot';

  const accentColor  = isBs ? '#f87171' : '#4ade80';
  const accentColor2 = isBs ? '#fca5a5' : '#86efac';

  const mainVal   = isBs
    ? (bsVal != null ? bsVal.toLocaleString('id-ID') + ' desa' : '0 desa')
    : (penVal != null ? penVal.toFixed(2) + '%' : 'N/A');
  const mainLabel = isBs ? 'Desa Tanpa Sinyal' : 'Penetrasi Internet 2024';

  const interpretasi = isBs
    ? (typeof getSinyalInterpretasi !== 'undefined' ? getSinyalInterpretasi(provName) : '')
    : (typeof getPenetrasiInterpretasi !== 'undefined' ? getPenetrasiInterpretasi(provName) : '');

  let extraHtml = '';
  if (isBs && bsTotal) {
    const pct = ((bsVal || 0) / bsTotal * 100).toFixed(1);
    extraHtml = `<div style="margin-top:6px;font-size:11px;color:rgba(255,255,255,.45)">
      dari <b style="color:rgba(255,255,255,.7)">${bsTotal.toLocaleString('id-ID')}</b> total desa
      &nbsp;·&nbsp; <b style="color:${accentColor}">${pct}%</b> tanpa sinyal
    </div>`;
  }

  // ── No background container ──
  Object.assign(overlayPanelEl.style, {
    background: 'none',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    border: 'none',
    boxShadow: 'none'
  });

  const closeBtn = mapInteractive
    ? `<button onclick="closeOverlay()" style="background:none;border:none;color:rgba(0,0,0,.4);font-size:24px;cursor:pointer;line-height:1;padding:0;position:absolute;top:-10px;right:0">&times;</button>`
    : '';

  overlayPanelEl.innerHTML = `
    <div style="position:relative;">
      ${closeBtn}
      <span class="card-badge" style="background:rgba(37,99,235,0.1);color:#2563eb;border:1px solid rgba(37,99,235,0.2)">${provName}</span>
      <h3 style="font-family:'Space Grotesk',sans-serif;font-size:2.5rem;font-weight:700;color:#111827;letter-spacing:-.02em;line-height:1.2;margin:1rem 0 0.5rem 0">${mainVal}</h3>
      <div style="font-size:1.1rem;color:#64748b;margin-bottom:1.5rem;font-weight:600">${mainLabel}</div>
      ${interpretasi ? `<p style="font-size:1.125rem;line-height:1.7;color:#475569;margin:0">${interpretasi}</p>` : ''}
      ${extraHtml}
    </div>
  `;

  // Handle Layout Transition (if map is full screen, move to split view)
  const mapLayer = document.getElementById('mapLayer');
  if (mapLayer) {
    const isFull = mapLayer.offsetWidth > window.innerWidth * 0.9;
    if (isFull) {
      wasMapFullScreen = true;
      gsap.to(mapLayer, { width: '60%', left: '0%', duration: 0.7, ease: 'power2.out' });
    } else {
      wasMapFullScreen = false;
    }
  }

  // Hide all narrative cards to prevent overlap
  document.querySelectorAll('.step-card').forEach(c => {
    c.style.opacity = '0';
    c.style.pointerEvents = 'none';
  });

  overlayPanelEl.style.opacity = '1';
  overlayPanelEl.style.pointerEvents = 'auto';
  overlayPanelEl.style.transform = 'translateY(-50%)';
}

function closeOverlay(instant = false) {
  isDetailOpen = false;
  selectedMapProvince = null;
  if (overlayPanelEl) {
    overlayPanelEl.style.opacity = '0';
    overlayPanelEl.style.pointerEvents = 'none';
  }
  
  // Restore narrative cards (GSAP will handle visibility based on scroll position)
  document.querySelectorAll('.step-card').forEach(c => {
    c.style.opacity = '';
    c.style.pointerEvents = '';
  });

  if (g) {
    if (instant) {
      g.selectAll('path')
        .style('opacity', 1)
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 0.7);
    } else {
      g.selectAll('path').transition().duration(400)
        .style('opacity', 1)
        .attr('stroke','#0f172a')
        .attr('stroke-width', 0.7);
    }
  }
  // Restore Layout if was full screen
  const mapLayer = document.getElementById('mapLayer');
  if (mapLayer && wasMapFullScreen) {
    gsap.to(mapLayer, { width: '100%', duration: 0.8, ease: 'power2.inOut' });
    wasMapFullScreen = false;
  }

  // Zoom out ke overview
  if (svg && zoom && !instant) {
    svg.transition().duration(1400).ease(d3.easeSinInOut)
      .call(zoom.transform, d3.zoomIdentity)
      .on('end', () => { if (g) g.selectAll('path').style('opacity', 1); });
  } else if (svg && zoom && instant) {
    svg.call(zoom.transform, d3.zoomIdentity);
    if (g) g.selectAll('path').style('opacity', 1);
  }
}

/* ── Legend & Title ── */
function renderLegend(mode) {
  if (!mapLegendEl) return;
  const cfg = LEGEND_CONFIG[mode] || LEGEND_CONFIG.penetrasi;
  mapLegendEl.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; width:100%;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#64748b;margin-bottom:8px">${cfg.title}</div>
      <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">
      ${cfg.items.map(i => `
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="width:11px;height:11px;border-radius:3px;background:${i.color};border:1px solid rgba(255,255,255,.12);flex-shrink:0"></div>
          <span style="font-size:10px">${i.label}</span>
        </div>`).join('')}
      </div>
    </div>`;
}

function updateMapTitle(mode) {
  // Fungsi ini dikosongkan karena kita menggunakan showMapSceneTitle sebagai gantinya
}

/* ═══════════════════════════════════════
   ZOOM
   ═══════════════════════════════════════ */
function zoomToProvince(d) {
  if (!svg || !path) return;
  const provName = normalizeProvName(d.properties.Propinsi || d.properties.PROVINSI);
  selectedMapProvince = provName;

  const [[x0, y0], [x1, y1]] = path.bounds(d);
  const dx = x1 - x0, dy = y1 - y0;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const scale = Math.max(1, Math.min(9, 0.82 / Math.max(dx / width, dy / height)));
  const tx = width / 2 - scale * cx;
  const ty = height / 2 - scale * cy;

  svg.transition().duration(800).ease(d3.easeSinInOut)
    .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
    .on('end', () => {
      g.selectAll('path')
        .transition().duration(300)
        .attr('stroke', feat => normalizeProvName(feat.properties.Propinsi || feat.properties.PROVINSI) === provName ? '#000000' : '#0f172a')
        .attr('stroke-width', feat => normalizeProvName(feat.properties.Propinsi || feat.properties.PROVINSI) === provName ? 2.5 / scale : 0.5 / scale);
    });

  g.selectAll('path').transition().duration(400)
    .style('opacity', feat =>
      normalizeProvName(feat.properties.Propinsi || feat.properties.PROVINSI) === provName ? 1 : 0.2);
}

/* ── Floating Hint ── */
function showMapHint(msg) {
  let hint = document.getElementById('mapHint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'mapHint';
    Object.assign(hint.style, {
      position: 'absolute', bottom: '15%', left: '50%',
      transform: 'translateX(-50%) translateY(0)',
      background: 'rgba(15, 23, 42, 0.9)', color: '#f8fafc',
      padding: '10px 20px', borderRadius: '30px',
      fontSize: '13px', fontWeight: '600', pointerEvents: 'none',
      opacity: '0', transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      zIndex: '3000', backdropFilter: 'blur(8px)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    });
    mapContainer.appendChild(hint);
  }
  
  hint.textContent = msg;
  hint.style.opacity = '1';
  hint.style.transform = 'translateX(-50%) translateY(-20px)';
  
  clearTimeout(hint.timeout);
  hint.timeout = setTimeout(() => {
    hint.style.opacity = '0';
    hint.style.transform = 'translateX(-50%) translateY(0)';
  }, 3000);
}

/* ── Highlight multiple provinces (seolah hover) ── */
function mapHighlightHighBlankspot() {
  // Provinsi dengan > 20 desa tanpa sinyal — warna solid, yang lain samar
  const { blankSpotLookup } = buildLookups();
  g.selectAll('path')
    .transition().duration(500)
    .each(function(d) {
      const n   = normalizeProvName(d.properties.Propinsi || d.properties.PROVINSI);
      const val = blankSpotLookup[n] || 0;
      const el  = d3.select(this);
      if (val > 20) {
        el.attr('fill', getMapColor(val, 'blankspot'))
          .attr('stroke', '#111827').attr('stroke-width', 0.8)
          .style('opacity', 1);
      } else {
        el.style('opacity', 0.15);
      }
    });
}

function mapHighlightLowBlankspot() {
  // Provinsi dengan 0 < desa tanpa sinyal < 20 — warna solid, yang lain samar
  const { blankSpotLookup } = buildLookups();
  g.selectAll('path')
    .transition().duration(500)
    .each(function(d) {
      const n   = normalizeProvName(d.properties.Propinsi || d.properties.PROVINSI);
      const val = blankSpotLookup[n];
      const el  = d3.select(this);
      const isLow = val != null && val > 0 && val < 20;
      if (isLow) {
        el.attr('fill', getMapColor(val, 'blankspot'))
          .attr('stroke', '#111827').attr('stroke-width', 0.8)
          .style('opacity', 1);
      } else {
        el.style('opacity', 0.15);
      }
    });
}

function clearHighlights(instant = false) {
  if (!g) return;
  if (instant) {
    g.selectAll('path')
      .style('opacity', 1)
      .attr('stroke','#111827')
      .attr('stroke-width', 0.7);
  } else {
    g.selectAll('path')
      .transition().duration(600)
      .style('opacity', 1)
      .attr('stroke','#111827')
      .attr('stroke-width', 0.7);
  }
}

/* ═══════════════════════════════════════
   SCROLLYTELLING FUNCTIONS
   ═══════════════════════════════════════ */
mapGeoJSONData = (typeof indonesiaGeoJSON !== 'undefined') ? indonesiaGeoJSON : null;

function mapGoToOverview(instant = false) {
  if (!svg) return;
  closeOverlay(instant);
  clearHighlights(instant);
  selectedMapProvince = null;
  if (instant) {
    svg.call(zoom.transform, d3.zoomIdentity);
    if (g) g.selectAll('path').attr('stroke-width', 0.7).style('opacity', 1);
  } else {
    svg.transition().duration(800).ease(d3.easeSinInOut)
      .call(zoom.transform, d3.zoomIdentity)
      .on('end', () => { if (g) g.selectAll('path').attr('stroke-width', 0.7); });
    g.selectAll('path').transition().duration(400).style('opacity', 1);
  }
}

// Aktifkan warna penetrasi (dipanggil setelah Kep.Riau & Papua)
function mapActivatePenetrasiColors() {
  if (!g) return;
  const { penetrasiLookup } = buildLookups();
  g.selectAll('path').transition().duration(800)
    .attr('fill', d => {
      const n = normalizeProvName(d.properties.Propinsi || d.properties.PROVINSI);
      return getMapColor(penetrasiLookup[n], 'penetrasi');
    });
}

function mapGoToKepRiau() {
  const data = mapGeoJSONData || (typeof indonesiaGeoJSON !== 'undefined' ? indonesiaGeoJSON : null);
  if (!data) return;
  const feat = data.features.find(f => {
    const n = (f.properties.Propinsi || f.properties.PROVINSI || "").toLowerCase();
    return n.includes("riau") && n.includes("kepulauan");
  });
  if (!feat) return;
  zoomToProvince(feat);
}

function mapGoToPapua() {
  const data = mapGeoJSONData || (typeof indonesiaGeoJSON !== 'undefined' ? indonesiaGeoJSON : null);
  if (!data) return;
  const feat = data.features.find(f => {
    const n = (f.properties.Propinsi || f.properties.PROVINSI || "").toLowerCase();
    return n.includes("papua") && n.includes("pegunungan");
  });
  if (!feat) return;
  zoomToProvince(feat);
}

function mapZoomOutPenetrasi() {
  closeOverlay(); clearHighlights();
  mapGoToOverview();
  // Aktifkan interaksi setelah zoom out selesai
  setTimeout(() => { mapInteractive = true; }, 900);
  // Aktifkan warna penetrasi setelah interaksi aktif
  setTimeout(() => mapActivatePenetrasiColors(), 1000);
}

function showMapSceneTitle(title, pill) {
  const container = document.getElementById('mapSceneTitle');
  const pillEl = document.getElementById('mapPill');
  const mainTitleEl = document.getElementById('mapMainTitle');
  if (!container || !mainTitleEl) return;

  gsap.to(container, { autoAlpha: 0, y: -20, duration: 0.3, onComplete: () => {
    mainTitleEl.textContent = title;
    if (pillEl) pillEl.textContent = pill || 'Digital Landscape';
    gsap.to(container, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
  }});
}

function mapSwitchToBlankSpot(direction = 'forward') {
  closeOverlay(true); 
  clearHighlights(true);
  mapGoToOverview(true); // Instant reset before cloning
  
  const targetMode = direction === 'backward' ? 'penetrasi' : 'blankspot';
  if (currentMapMode === targetMode) return;

  const container = document.getElementById('indonesiaMap');
  const mainSvg = container.querySelector('svg');
  if (!mainSvg) return;

  // 1. Clone dengan efek bayangan pada tepi wipe
  const clone = mainSvg.cloneNode(true);
  Object.assign(clone.style, {
    position: 'absolute',
    top: '0', left: '0', zIndex: '10',
    pointerEvents: 'none',
    boxShadow: direction === 'backward' ? '0 10px 30px rgba(0,0,0,0.3)' : '0 -10px 30px rgba(0,0,0,0.3)'
  });
  container.style.position = 'relative'; 
  container.appendChild(clone);

  // 2. Update state utama
  currentMapMode = targetMode;
  updateMapTitle(currentMapMode);
  renderLegend(currentMapMode);
  
  // Update Scene Title
  if (targetMode === 'blankspot') {
    showMapSceneTitle('Penerimaan Sinyal Seluler', 'Kesenjangan Infrastruktur');
  } else {
    showMapSceneTitle('Jangkauan Internet', 'Penetrasi Digital');
  }

  const { penetrasiLookup, blankSpotLookup } = buildLookups();
  g.selectAll('path').attr('fill', d => {
    const n = normalizeProvName(d.properties.Propinsi || d.properties.PROVINSI);
    return getMapColor(currentMapMode === 'blankspot' ? (blankSpotLookup[n] || 0) : penetrasiLookup[n], currentMapMode);
  });

  // 3. Rolling animation (Ditingkatkan durasinya agar lebih smooth)
  gsap.fromTo(clone, 
    { clipPath: "inset(0% 0% 0% 0%)" },
    { 
      clipPath: direction === 'backward' ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)", 
      duration: 2.0, 
      ease: "power2.inOut",
      onComplete: () => {
        if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
      }
    }
  );
}

function swapMapData(mode) {
  if (!g) return;
  currentMapMode = mode;
  const { penetrasiLookup, blankSpotLookup } = buildLookups();
  g.selectAll('path').transition().duration(800)
    .attr('fill', d => {
      const n = normalizeProvName(d.properties.Propinsi || d.properties.PROVINSI);
      return getMapColor(mode === 'blankspot' ? (blankSpotLookup[n] || 0) : penetrasiLookup[n], mode);
    });
  updateMapTitle(mode);
  renderLegend(mode);
}
