/* ===================================================
   APP.JS – GSAP ScrollTrigger Orchestrasi
   =================================================== */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  // Update Progress Bar
  window.addEventListener('scroll', () => {
    const scrollPx = document.documentElement.scrollTop;
    const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = `${scrollPx / winHeightPx * 100}%`;
    document.getElementById("progressBar").style.width = scrolled;
  });

  // Fade Up Elements globally
  const fadeElements = document.querySelectorAll(".fade-up");
  fadeElements.forEach((el) => {
    gsap.to(el, {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        // Removed global snap to prevent jumping on load
      }
    });
  });

  // Scene 1: Network Canvas Animation
  initNetworkCanvas();

  // Scene 1.5: Hook Line Chart (Pinned Scrollytelling)
  let hookChartDrawn = false;
  const tlTrend = gsap.timeline({
    scrollTrigger: {
      trigger: "#sceneTrend",
      start: "top top",
      end: "+=2000",
      pin: true,
      scrub: false, // We want the chart to draw at its own pace once triggered
      onEnter: () => {
        if (!hookChartDrawn) {
          hookChartDrawn = true;
          drawHookLineChart();
        }
      }
    }
  });

  // Interpretation text will be handled by the callback in charts.js
  window.onHookChartComplete = () => {
    gsap.to("#hookDescription", {
      opacity: 1,
      y: 0,
      duration: 1.5,
      ease: "power2.out"
    });
  };

  // === Scene 2: Media Mengakses Internet Scrollytelling ===
  buildMediaBars();
  
  // 1. Initial Bar fill animation when entering the section
  ScrollTrigger.create({
    trigger: "#sceneMedia",
    start: "top 75%",
    onEnter: () => {
      gsap.to(".media-fill", { 
        width: function(index, target) { return target.getAttribute("data-width") + "%"; }, 
        duration: 1.8,
        ease: "power3.out"
      });
      document.querySelectorAll("#sceneMedia .media-val").forEach(val => {
        const targetVal = parseFloat(val.getAttribute("data-val"));
        gsap.to(val, {
          innerHTML: targetVal,
          duration: 1.8,
          ease: "power3.out",
          snap: { innerHTML: 0.01 },
          onUpdate: function() {
            val.innerHTML = Number(this.targets()[0].innerHTML).toFixed(2).replace('.', ',') + "%";
          }
        });
      });
    }
  });

  // 2. Scrollytelling Timeline
  const tlMedia = gsap.timeline({
    scrollTrigger: {
      trigger: "#sceneMedia",
      start: "top top",
      end: "+=5000", // Increased from 3500 to make it "longer"
      scrub: 1,     // Reduced from 2 for better responsiveness
      pin: true
    }
  });

  // Step 1: Split layout (Chart moves right, text column appears on left)
  gsap.set(".step-card", { yPercent: -50, y: window.innerHeight/1.2, autoAlpha: 0 }); 
  
  tlMedia.addLabel("start")
         .to("#mediaChartCol", { left: "30%", maxWidth: "650px", duration: 1.5 })
         .to("#mediaTextCol", { autoAlpha: 1, duration: 1.5 }, "<")
         .to({}, { duration: 1 }) // Hold state
         .addLabel("layoutSplit");

  // Step 2: Phone
  tlMedia.to(".media-bar-row", { opacity: 0.2, duration: 1 })
         .to("#barPhone", { opacity: 1, duration: 1 }, "<")
         .to("#stepPhone", { autoAlpha: 1, y: 0, duration: 2 }, "<")
         .to({}, { duration: 2 }) // HOLD
         .addLabel("phone")
         .to("#stepPhone", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 2 });

  // Step 3: Laptop
  tlMedia.to("#barPhone", { opacity: 0.2, duration: 1 }, "-=1")
         .to("#barLaptop", { opacity: 1, duration: 1 }, "<")
         .to("#stepLaptop", { autoAlpha: 1, y: 0, duration: 2 }, "<")
         .to({}, { duration: 2 }) // HOLD
         .addLabel("laptop")
         .to("#stepLaptop", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 2 });

  // Step 4: Desktop
  tlMedia.to("#barLaptop", { opacity: 0.2, duration: 1 }, "-=1")
         .to("#barDesktop", { opacity: 1, duration: 1 }, "<")
         .to("#stepDesktop", { autoAlpha: 1, y: 0, duration: 2 }, "<")
         .to({}, { duration: 2 }) // HOLD
         .addLabel("desktop")
         .to("#stepDesktop", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 2 });

  // Step 5: Other
  tlMedia.to("#barDesktop", { opacity: 0.2, duration: 1 }, "-=1")
         .to("#barOther", { opacity: 1, duration: 1 }, "<")
         .to("#stepOther", { autoAlpha: 1, y: 0, duration: 2 }, "<")
         .to({}, { duration: 2 }) // HOLD
         .addLabel("other")
         .to("#stepOther", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 2 });

  // Step 6: Return to center
  tlMedia.to(".media-bar-row", { opacity: 1, duration: 1 }, "-=1")
         .to("#mediaChartCol", { left: "50%", maxWidth: "800px", duration: 1.5 }, "<")
         .to("#mediaTextCol", { autoAlpha: 0, duration: 1.5 }, "<")
         .to({}, { duration: 1 })
         .addLabel("end");

  // === SCENE 3: Tujuan Mengakses Internet ===
  buildUsageBars();

  // Animasi Bar
  ScrollTrigger.create({
    trigger: "#sceneUsage",
    start: "top 60%",
    onEnter: () => {
      gsap.to(".usage-fill", { 
        width: function(index, target) { return target.getAttribute("data-width") + "%"; }, 
        duration: 1.5,
        ease: "power3.out"
      });
      document.querySelectorAll("#sceneUsage .usage-val").forEach(val => {
        const targetVal = parseFloat(val.getAttribute("data-val"));
        gsap.to(val, {
          innerHTML: targetVal,
          duration: 1.5,
          ease: "power3.out",
          snap: { innerHTML: 0.01 },
          onUpdate: function() {
            val.innerHTML = Number(this.targets()[0].innerHTML).toFixed(2).replace('.', ',') + "%";
          }
        });
      });
    }
  });

  // Timeline untuk Rolling Teks Scene 3
  const tlUsage = gsap.timeline({
    scrollTrigger: {
      trigger: "#sceneUsage",
      start: "top top",
      end: "+=5000",
      scrub: 1,
      pin: true
    }
  });

  gsap.set("#sceneUsage .step-card", { yPercent: -50, y: window.innerHeight/1.2, autoAlpha: 0 });

  // Step 1: Split layout
  tlUsage.addLabel("start")
         .to("#usageChartCol", { left: "30%", maxWidth: "650px", duration: 1.5 })
         .to("#usageTextCol", { autoAlpha: 1, duration: 1.5 }, "<")
         .to({}, { duration: 1 })
         .addLabel("layoutSplit");

  // Konsumtif
  tlUsage.to(".usage-row", { opacity: 0.2, duration: 1 })
         .to(".bar-konsumtif", { opacity: 1, duration: 1 }, "<")
         .to("#stepKonsumtif", { autoAlpha: 1, y: 0, duration: 2 }, "<")
         .to({}, { duration: 2 }) // HOLD
         .addLabel("konsumtif")
         .to("#stepKonsumtif", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 2 });

  // Fungsional
  tlUsage.to(".bar-konsumtif", { opacity: 0.2, duration: 1 }, "-=1")
         .to(".bar-fungsional", { opacity: 1, duration: 1 }, "<")
         .to("#stepFungsional", { autoAlpha: 1, y: 0, duration: 2 }, "<")
         .to({}, { duration: 2 }) // HOLD
         .addLabel("fungsional")
         .to("#stepFungsional", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 2 });

  // Produktif
  tlUsage.to(".bar-fungsional", { opacity: 0.2, duration: 1 }, "-=1")
         .to(".bar-produktif", { opacity: 1, duration: 1 }, "<")
         .to("#stepProduktif", { autoAlpha: 1, y: 0, duration: 2 }, "<")
         .to({}, { duration: 2 }) // HOLD
         .addLabel("produktif")
         .to("#stepProduktif", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 2 });

  // Return to center
  tlUsage.to(".usage-row", { opacity: 1, duration: 1 }, "-=1")
         .to("#usageChartCol", { left: "50%", maxWidth: "800px", duration: 1.5 }, "<")
         .to("#usageTextCol", { autoAlpha: 0, duration: 1.5 }, "<")
         .to({}, { duration: 1 })
         .addLabel("end");

  // === PINNED MAP SECTION ===
  // Enable map interactions once entered
  let mapInitialized = false;
  ScrollTrigger.create({
    trigger: "#pinnedSection",
    start: "top 200px",
    onEnter: () => {
      if (!mapInitialized) {
        mapInitialized = true;
        buildIndonesiaMap();
      }
    }
  });

  // Trackpad scroll bug fix: we remove normalizeScroll to allow native smooth scrolling
  // which works better on Windows trackpads with pinned GSAP sections.

  // Set initial states for penetrasi and blankspot cards
  gsap.set("#penetrasiTextCol .step-card, #blankspotTextCol .step-card", { yPercent: -50, y: window.innerHeight/1.2, autoAlpha: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#pinnedSection",
      start: "top top",
      end: "+=15000", // Increased from 12000
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  tl.addLabel("start")
    .call(() => { 
      mapGoToOverview(); 
      if (typeof showMapSceneTitle === 'function') {
        showMapSceneTitle('Peta Penetrasi Internet', 'Konektivitas 2024');
      }
    }, null, 0)
    // Transisi awal: Peta ke kiri, Teks Penetrasi ke kanan
    .to("#mapLayer", { width: "60%", left: "0%", duration: 1.5, ease: "power2.inOut" })
    .to("#penetrasiTextCol", { autoAlpha: 1, duration: 1.5 }, "<")
    .to({}, { duration: 1 }) // Buffer

    // 1. Kep Riau
    .addLabel("kepRiau_trigger")
    .call(() => mapGoToKepRiau())
    .to("#cardKepRiau", { autoAlpha: 1, y: 0, duration: 1.5 })
    .to({}, { duration: 3 })
    .addLabel("kepRiau")
    .to("#cardKepRiau", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 1.5 })

    // 2. Papua Pegunungan
    .addLabel("papua_trigger")
    .call(() => mapGoToPapua())
    .to("#cardPapua", { autoAlpha: 1, y: 0, duration: 1.5 })
    .to({}, { duration: 3 })
    .addLabel("papua")
    .to("#cardPapua", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 1.5 })

    // 3. Zoom Out (Penetrasi Overview & Interactive)
    .addLabel("penetrasiMap_trigger")
    .call(() => { mapZoomOutPenetrasi(); })
    .to("#cardMap", { autoAlpha: 1, y: 0, duration: 1.5 })
    .to({}, { duration: 4 })
    .addLabel("penetrasiMap")
    .to("#cardMap", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 1.5 })

    // --- TRANSISI KE BLANKSPOT (MAP TETAP DI KANAN, DATA BERUBAH) ---
    .addLabel("bridgeB_trigger")
    .to("#penetrasiTextCol", { autoAlpha: 0, duration: 1 })
    .to("#blankspotTextCol", { autoAlpha: 1, duration: 1 }, "<")
    .to("#cardBridgeB", { autoAlpha: 1, y: 0, duration: 2 })
    .to({}, { duration: 3 })
    .to("#cardBridgeB", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 2 })
    
    .addLabel("blankspotMap_trigger")
    .call(() => mapSwitchToBlankSpot('forward'))
    .to("#cardBlankSpot", { autoAlpha: 1, y: 0, duration: 2 })
    .to({}, { duration: 4 }) 
    .addLabel("blankspotMap")
    .to("#cardBlankSpot", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 2 })

    .addLabel("parah_trigger")
    .to("#cardBlankParah", { autoAlpha: 1, y: 0, duration: 2, onStart: () => mapHighlightHighBlankspot(), onReverseComplete: () => { const { blankSpotLookup } = buildLookups(); swapMapData('blankspot'); } })
    .to({}, { duration: 3 }) 
    .addLabel("parah")
    .to("#cardBlankParah", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 2 })

    .addLabel("ringan_trigger")
    .to("#cardBlankRingan", { autoAlpha: 1, y: 0, duration: 2, onStart: () => mapHighlightLowBlankspot(), onReverseComplete: () => mapHighlightHighBlankspot() })
    .to({}, { duration: 3 }) 
    .addLabel("ringan")
    .to("#cardBlankRingan", { autoAlpha: 0, y: -window.innerHeight/1.2, duration: 2 })

    .addLabel("end_trigger")
    // Kembalikan map ke tengah saat selesai
    .to("#mapLayer", { width: "100%", left: "0%", duration: 1.5, ease: "power2.inOut", onStart: () => { clearHighlights(); mapGoToOverview(); }, onReverseComplete: () => mapHighlightLowBlankspot() })
    .to("#blankspotTextCol", { autoAlpha: 0, duration: 1.5 }, "<")
    .addLabel("end");


  // Build Scene 6 Chart
  ScrollTrigger.create({
    trigger: "#sceneExpenditure",
    start: "top 75%",
    onEnter: () => drawExpenditureBarChart(),
  });

  // Scene 7
  ScrollTrigger.create({
    trigger: "#sceneClosing",
    start: "top 75%",
  });
});

/* ---------- Build Usage Bars ---------- */
function buildUsageBars() {
  const container = document.getElementById('usageBarsContainer');
  if (!container || typeof usageData === 'undefined') return;

  const sorted = [...usageData].sort((a, b) => b.value - a.value);
  sorted.forEach((item) => {
    const row = document.createElement('div');
    
    let zoneClass = 'bar-fungsional';
    if (['Hiburan', 'Media Sosial'].includes(item.label)) {
      zoneClass = 'bar-konsumtif';
    } else if (['Pembelajaran Online', 'Bekerja Online', 'Pembuatan Konten Digital', 'Mengirim/Terima Email', 'Penjualan Barang/Jasa'].includes(item.label)) {
      zoneClass = 'bar-produktif';
    }

    row.className = `media-bar-row usage-row ${zoneClass}`;
    
    row.innerHTML = `
      <div class="media-label usage-label">${item.label}</div>
      <div class="media-bar-bg usage-bg">
        <div class="media-bar-fill usage-fill" data-width="${item.value}" style="width: 0%"></div>
      </div>
      <div class="media-val usage-val" data-val="${item.value}">0%</div>
    `;
    container.appendChild(row);
  });
}

/* ---------- Network Canvas Hook ---------- */
function initNetworkCanvas() {
  const canvases = document.querySelectorAll(".network-canvas");
  
  canvases.forEach(canvas => {
    const ctx = canvas.getContext("2d");
    let width, height;
    let particles = [];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    
    window.addEventListener("resize", resize);
    resize();

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 1.5 + 1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(37, 99, 235, 0.7)";
        ctx.fill();
      }
    }

    const particleCount = width < 768 ? 30 : 60;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(37, 99, 235, ${0.2 - dist/500})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
  });
}
