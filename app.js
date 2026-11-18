/* =========================================================
   25 Years Get-together Invitation — app.js
   1. Config & guest personalisation
   2. Fallback artwork (SVG) — shown until your PNGs exist
   3. Ambient glitter dust (canvas)
   4. Audio: music-box synth + SFX (Web Audio, no files)
   5. Envelope opening
   6. Vertically scrollable four-card deck
   7. Countdown, QR, map
   8. Host link generator (?admin=1)
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Config & guest ---------- */
  const CFG = {
    eventTime: "2026-12-20T09:00:00+05:30",            // Sri Lanka time
    mapsShort: "https://maps.app.goo.gl/3Lx65NH7VHgmgTw66", // your venue link (also encoded in the QR)
    mapsDirections: "https://www.google.com/maps/dir/?api=1&destination=6.9815467,79.8740649",
  };
  const params = new URLSearchParams(location.search);
  const rawGuest = (params.get("guest") || params.get("g") || "").replace(/\s+/g, " ").trim().slice(0, 60);
  const guest = (rawGuest || "VALUED GUEST").toUpperCase();
  $("#guestName").textContent = guest;
  $("#envName").textContent = guest;
  document.title = rawGuest ? `You're invited, ${rawGuest} — 25 Years Party` : document.title;

  /* ---------- 2. Fallback artwork ---------- */
  let uid = 0;
  const svg = (w, h, inner, cls) => `<svg xmlns="${NS}" viewBox="0 0 ${w} ${h}" ${cls ? `class="${cls}"` : ""}>${inner}</svg>`;

  // Hanging glitter baubles (positions follow reference card 1, viewBox 933 x 440)
  const BALLS = [
    [281, 108, 60, "r"], [561, 108, 52, "k"], [768, 178, 44, "k"], [378, 238, 56, "k"],
    [178, 300, 72, "k"], [663, 303, 58, "r"], [470, 420, 82, "r"],
  ];
  function baublesSVG() {
    const id = "b" + (++uid);
    const defs = `<defs>
      <radialGradient id="${id}r" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#d1303a"/><stop offset=".55" stop-color="#9e1b22"/><stop offset="1" stop-color="#4a0a0f"/></radialGradient>
      <radialGradient id="${id}k" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#4a413b"/><stop offset=".55" stop-color="#241f1c"/><stop offset="1" stop-color="#0c0b0a"/></radialGradient>
      <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#8a6a25"/><stop offset=".5" stop-color="#f3dc9a"/><stop offset="1" stop-color="#8a6a25"/></linearGradient>
      <filter id="${id}f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="4" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 .85  0 0 0 0 .6  0 0 0 9 -5.6" result="s"/><feComposite in="s" in2="SourceAlpha" operator="in"/></filter>
      <filter id="${id}s"><feDropShadow dx="0" dy="14" stdDeviation="10" flood-color="#000" flood-opacity=".6"/></filter></defs>`;
    const balls = BALLS.map(([x, y, r, c], i) => `<g class="bauble" data-x="${x}" data-i="${i}">
      <line x1="${x}" y1="0" x2="${x}" y2="${y - r - 12}" stroke="#b79a54" stroke-width="1.6"/>
      <rect x="${x - 9}" y="${y - r - 14}" width="18" height="14" rx="2" fill="url(#${id}g)"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id}${c})" filter="url(#${id}s)"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="#fff" filter="url(#${id}f)" opacity="${c === "r" ? .75 : .5}"/>
      <ellipse cx="${x - r * .35}" cy="${y - r * .4}" rx="${r * .22}" ry="${r * .13}" fill="#fff" opacity=".12" transform="rotate(-35 ${x - r * .35} ${y - r * .4})"/></g>`).join("");
    return svg(933, 440, defs + balls);
  }
  function mountBaubles(el) {
    const png = new Image();
    const wrap = document.createElement("div");
    wrap.innerHTML = baublesSVG();
    el.appendChild(wrap.firstChild);
    png.src = "assets/baubles-top.png"; png.alt = "";
    png.onload = () => { el.innerHTML = ""; el.appendChild(png); png.dataset.png = 1; startSway(el); };
    startSway(el);
  }
  function startSway(el) {
    if (reduce || !window.gsap) return;
    gsap.killTweensOf(el.querySelectorAll("*"));
    const balls = $$(".bauble", el);
    if (balls.length) {
      balls.forEach((g, i) => {
        const x = +g.dataset.x, a = 1.6 + (i % 3) * 0.9;
        gsap.fromTo(g, { rotation: -a, svgOrigin: `${x} 0` }, { rotation: a, svgOrigin: `${x} 0`, duration: 2.4 + i * 0.35, ease: "sine.inOut", yoyo: true, repeat: -1, delay: -i * 0.6 });
      });
    } else {
      const img = $("img", el);
      if (img) gsap.fromTo(img, { rotation: -1.2, transformOrigin: "50% 0" }, { rotation: 1.2, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }
  }

  // "25 Years" lockup: silver crown + script + lime "Get together party"
  function crestSVG() {
    const id = "c" + (++uid);
    const defs = `<defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#e8e8e8"/><stop offset=".55" stop-color="#a9a9a9"/><stop offset=".75" stop-color="#f4f4f4"/><stop offset="1" stop-color="#c2c2c2"/></linearGradient>
      <filter id="${id}d"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".7"/></filter></defs>`;
    const shapes = `<g stroke="url(#${id}s)" fill="#1a1a1a" stroke-width="5" stroke-linejoin="round">
      <path d="M196 124 L186 78 Q192 58 214 64 Q226 42 244 56 L270 30 L296 56 Q314 42 326 64 Q348 58 354 78 L344 124 Z"/>
      <path d="M232 124 Q236 80 270 74 Q304 80 308 124" fill="none" stroke-width="3.5"/><path d="M270 74 V124 M250 80 Q252 104 252 124 M290 80 Q288 104 288 124" fill="none" stroke-width="2.5"/>
      <rect x="182" y="124" width="176" height="16" rx="3" fill="url(#${id}s)"/>
      <path d="M270 6 L278 22 L270 34 L262 22 Z" fill="url(#${id}s)" stroke-width="2"/></g>
      <g font-family="Great Vibes, cursive" text-anchor="middle">
      <text x="270" y="288" font-size="168" font-weight="700" fill="url(#${id}s)" stroke="#6b6b6b" stroke-width="1.5">25</text>
      <text x="270" y="388" font-size="150" fill="url(#${id}s)" stroke="#6b6b6b" stroke-width="1.5">Years</text>
      <path d="M60 372 C110 350 140 410 210 408 S390 410 470 392 C500 386 508 370 492 362" fill="none" stroke="url(#${id}s)" stroke-width="5" stroke-linecap="round"/>
      <text x="270" y="526" font-size="112" fill="#8bc34a">Get together</text><text x="270" y="618" font-size="112" fill="#8bc34a">party</text></g>
      <g fill="#fff"><path d="M70 366 l5 -22 l5 22 l22 5 l-22 5 l-5 22 l-5 -22 l-22 -5z"/><path d="M476 276 l4 -16 l4 16 l16 4 l-16 4 l-4 16 l-4 -16 l-16 -4z" opacity=".9"/></g>`;
    const shim = `<defs><clipPath id="${id}c">${shapes}</clipPath><linearGradient id="${id}b"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <rect y="0" width="140" height="650" fill="url(#${id}b)" clip-path="url(#${id}c)" transform="skewX(-16)"><animate attributeName="x" dur="6.5s" repeatCount="indefinite" calcMode="linear" keyTimes="0;.12;.55;1" values="-200;-200;700;700"/></rect>`;
    const crown = `<g filter="url(#${id}d)">${shapes}</g>`, txt = shim;    return svg(540, 650, defs + crown + txt);
  }

  // Dress-code figures (stylised cut-outs)
  function manSVG() {
    return svg(280, 800, `
      <ellipse cx="100" cy="782" rx="34" ry="11" fill="#3a2a1f"/><ellipse cx="182" cy="782" rx="34" ry="11" fill="#3a2a1f"/>
      <path d="M60 424 H220 L236 760 H44 Z" fill="#f6f6f4"/><path d="M44 726 H236 V760 H44 Z" fill="#6f8f5a"/><rect x="196" y="424" width="7" height="336" fill="#6f8f5a"/>
      <path d="M100 424 L112 760 M140 424 L140 760 M172 424 L168 760" stroke="#dcdcd8" stroke-width="2" fill="none"/>
      <path d="M78 140 H202 L238 206 L234 434 H46 L42 206 Z" fill="#7a9a63"/>
      <path d="M78 140 L40 214 L18 336 L56 346 L84 230 Z" fill="#6f8f5a"/><path d="M202 140 L240 214 L262 336 L224 346 L196 230 Z" fill="#6f8f5a"/>
      <circle cx="36" cy="356" r="17" fill="#c28a60"/><circle cx="244" cy="356" r="17" fill="#c28a60"/><rect x="214" y="338" width="30" height="9" rx="3" fill="#8a5a2e"/>
      <path d="M116 138 L140 190 L164 138 Z" fill="#5f7d4d"/><path d="M140 190 V430" stroke="#5f7d4d" stroke-width="3"/>
      <rect x="124" y="104" width="32" height="40" fill="#c28a60"/>
      <ellipse cx="140" cy="68" rx="38" ry="46" fill="#c9966b"/><path d="M102 62 Q104 20 140 18 Q178 20 178 62 Q168 40 140 40 Q112 40 102 62Z" fill="#1d1612"/>
      <path d="M104 74 Q106 124 140 124 Q174 124 176 74 Q166 106 140 106 Q114 106 104 74Z" fill="#241a14"/>`);
  }
  function womanSVG() {
    return svg(310, 800, `
      <ellipse cx="116" cy="780" rx="30" ry="9" fill="#c9a24a"/><ellipse cx="196" cy="780" rx="30" ry="9" fill="#c9a24a"/>
      <path d="M108 600 H206 L214 770 H98 Z" fill="#b30f24"/>
      <path d="M104 146 Q156 128 208 146 L222 270 Q300 470 304 702 Q156 716 8 702 Q14 470 90 270 Z" fill="#c8102e"/>
      <path d="M90 270 Q60 470 8 702 M222 270 Q250 470 304 702" stroke="#a50d27" stroke-width="3" fill="none"/>
      <path d="M8 690 Q156 706 304 690 L304 704 Q156 720 8 704Z" fill="#d9b45a"/>
      <g fill="#d9b45a"><circle cx="76" cy="520" r="9"/><circle cx="62" cy="600" r="9"/><circle cx="238" cy="540" r="9"/><circle cx="252" cy="620" r="9"/></g>
      <path d="M118 150 Q156 176 196 150" stroke="#d9b45a" stroke-width="5" fill="none"/>
      <path d="M104 146 L66 232 L44 360 L78 370 L106 250 Z" fill="#c8102e"/><path d="M208 146 L232 232 L240 360 L206 366 L196 250 Z" fill="#c8102e"/>
      <circle cx="58" cy="376" r="15" fill="#c98f67"/><circle cx="224" cy="376" r="15" fill="#c98f67"/>
      <path d="M200 140 Q290 200 276 420 Q268 560 262 704 L238 704 Q246 500 244 390 Q232 250 170 190Z" fill="#d11f38" opacity=".88"/>
      <path d="M276 420 Q268 560 262 704" stroke="#d9b45a" stroke-width="5" stroke-dasharray="2 9" fill="none" stroke-linecap="round"/>
      <rect x="142" y="112" width="28" height="38" fill="#c98f67"/><path d="M118 130 Q156 150 194 130" stroke="#d9b45a" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse cx="156" cy="72" rx="35" ry="44" fill="#d19a72"/><path d="M118 70 Q112 16 158 16 Q204 16 196 70 Q188 40 156 38 Q126 40 118 70Z" fill="#1b1410"/>
      <circle cx="116" cy="94" r="7" fill="#d9b45a"/><circle cx="198" cy="94" r="7" fill="#d9b45a"/>`);
  }

  // Snowflake silhouettes
  function flakeSVG() {
    let a = "";
    for (let i = 0; i < 6; i++) a += `<g transform="rotate(${i * 60} 50 50)"><path d="M50 50 V6 M50 28 L38 16 M50 28 L62 16 M50 40 L41 32 M50 40 L59 32" /></g>`;
    return svg(100, 100, `<g stroke="#7b6140" stroke-width="3" stroke-linecap="round" fill="none">${a}</g>`);
  }
  const FLAKES = [[7, 66, 1], [3, 76, .6], [11, 81, 1.1], [3, 90, .8], [86, 69, .75], [90, 80, 1.1]];

  function mountArt() {
    $$("[data-baubles]").forEach(mountBaubles);
    $$("[data-crest] .fb").forEach((el) => (el.innerHTML = crestSVG()));
    $$("[data-fig=man]").forEach((el) => (el.innerHTML = manSVG()));
    $$("[data-fig=woman]").forEach((el) => (el.innerHTML = womanSVG()));
    $$(".sheet").forEach((sh) => FLAKES.forEach(([x, y, s], i) => {
      const d = document.createElement("div"); d.className = "flake";
      d.style.cssText = `left:${x}%;top:${y}%;width:${11 * s}cqw;--flake-angle:${x * 7}deg;--flake-delay:${-i * 1.25}s;--flake-duration:${8 + (i % 3) * 1.5}s`;
      d.innerHTML = flakeSVG(); sh.prepend(d);
    }));
    const introB = $("#introBaubles");
    if (introB) { introB.innerHTML = baublesSVG(); startSway(introB); }
  }

  /* ---------- 3. Ambient glitter dust (canvas) ---------- */
  const cv = $("#dust"), cx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1, dust = [];
  const DUST_COLORS = ["255,214,120", "255,236,170", "140,200,90", "190,230,120", "255,255,255", "230,150,90"];
  function sizeDust() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const col = Math.min(W, H * 933 / 1600), left = (W - col) / 2, n = W < 600 ? 160 : 220;
    dust = Array.from({ length: n }, (_, i) => {
      const side = i % 2 ? 1 : -1;                                   // left / right margins of the card column
      const off = Math.pow(Math.random(), 1.6) * col * .22;
      return { x: side < 0 ? left + off : left + col - off, y: Math.random() * H, r: .4 + Math.random() * 1.2,
        c: DUST_COLORS[(Math.random() * DUST_COLORS.length) | 0], vy: .06 + Math.random() * .18, ph: Math.random() * 6.28, sp: .6 + Math.random() * 1.8 };
    });
  }
  function drawDust(t) {
    cx.clearRect(0, 0, W, H);
    for (const p of dust) {
      p.y += p.vy; if (p.y > H + 4) p.y = -4;
      const a = .08 + .72 * Math.abs(Math.sin(t / 1000 * p.sp + p.ph));
      cx.fillStyle = `rgba(${p.c},${a})`; cx.beginPath(); cx.arc(p.x + Math.sin(t / 2500 + p.ph) * 3, p.y, p.r, 0, 6.283); cx.fill();
    }
    if (!reduce) requestAnimationFrame(drawDust);
  }

  /* ---------- 4. Audio: synthesised music-box + SFX ---------- */
  let ac, master, send, mus, muted = false, playing = false, timer = 0, loopStart = 0, evI = 0;
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const hz = (n) => 440 * Math.pow(2, (SEMI[n[0]] + 12 * (+n[1]) - 57) / 12);
  const BPM = 92, BEAT = 60 / BPM;
  // Original gentle waltz in C major (3/4, 16 bars) — melody [note, beats]
  const MEL = "E5 1,G5 1,C6 1,B5 1.5,A5 .5,G5 1,A5 1,F5 1,D5 1,G5 3,E5 1,G5 1,C6 1,D6 1.5,C6 .5,B5 1,A5 1,B5 1,G5 1,C6 3," +
    "A5 1,A5 1,A5 1,A5 1.5,G5 .5,F5 1,G5 1,G5 1,G5 1,G5 1.5,F5 .5,E5 1,F5 1,A5 1,D6 1,C6 1.5,B5 .5,A5 1,G5 2,E5 1,C5 3";
  const CH = { C: ["C4", "E4", "G4"], G: ["G3", "B3", "D4"], F: ["F3", "A3", "C4"], D: ["D4", "F4", "A4"] };
  const BARS = "C G F C C G G C F F C C D G C C".split(" ");
  const EV = (() => {
    const ev = []; let b = 0;
    MEL.split(",").forEach((s) => { const [n, d] = s.split(" "); ev.push({ b, f: hz(n), d: +d * BEAT * 1.6, v: .2 }); b += +d; });
    BARS.forEach((c, i) => CH[c].forEach((n, k) => ev.push({ b: i * 3 + k, f: hz(n) / 2, d: BEAT * 1.4, v: k ? .07 : .12 })));
    return ev.sort((a, c) => a.b - c.b);
  })();
  const LOOP = 48 * BEAT;

  function initAudio() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC(); master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    mus = ac.createGain(); mus.gain.value = .75; mus.connect(master);
    send = ac.createGain(); send.gain.value = .5;                       // stereo ping-pong delay (the "room")
    const wet = ac.createGain(); wet.gain.value = .42; wet.connect(master);
    const dl = ac.createDelay(1), dr = ac.createDelay(1), f1 = ac.createGain(), f2 = ac.createGain();
    dl.delayTime.value = .27; dr.delayTime.value = .41; f1.gain.value = f2.gain.value = .34;
    const pl = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain(), pr = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain();
    if (pl.pan) { pl.pan.value = -.65; pr.pan.value = .65; }
    send.connect(dl); dl.connect(pl); pl.connect(wet); dl.connect(f1); f1.connect(dr); dr.connect(pr); pr.connect(wet); dr.connect(f2); f2.connect(dl);
    master.gain.setTargetAtTime(.9, ac.currentTime, .15);
  }
  // one celesta / music-box tone: sine + triangle + bright bell partial, soft attack, long exponential decay
  function tone(f, t, dur, v, out) {
    [[f, "sine", 1], [f, "triangle", .35], [f * 4, "sine", .09], [f * 2.76, "sine", .05]].forEach(([fr, ty, g], i) => {
      const o = ac.createOscillator(), e = ac.createGain();
      o.type = ty; o.frequency.value = fr;
      const d = i > 1 ? dur * .35 : dur;
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(v * g, t + .006); e.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(e); e.connect(out); e.connect(send); o.start(t); o.stop(t + d + .05);
    });
  }
  function schedule() {
    if (!playing) return;
    const now = ac.currentTime;
    while (true) {
      const e = EV[evI], t = loopStart + e.b * BEAT;
      if (t > now + .5) break;
      if (t >= now - .05) tone(e.f, t, e.d, e.v, mus);
      if (++evI >= EV.length) { evI = 0; loopStart += LOOP; }
    }
    timer = setTimeout(schedule, 120);
  }
  function startMusic() {
    if (!ac || playing) return; playing = true; evI = 0; loopStart = ac.currentTime + .9; schedule();
  }
  function noiseBuf(sec) { const b = ac.createBuffer(1, ac.sampleRate * sec, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function sfxSwoosh() {                                                  // paper slide
    if (!ac) return; const t = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf(.7); f.type = "bandpass"; f.Q.value = .9; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(4200, t + .55);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.35, t + .2); g.gain.exponentialRampToValueAtTime(.0001, t + .65);
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  function sfxChime() {                                                   // warm celebratory arpeggio
    if (!ac) return; const t = ac.currentTime + .25;
    ["C6", "E6", "G6", "C7", "E7"].forEach((n, i) => tone(hz(n), t + i * .09, 2.4, .16, master));
  }
  function setMuted(m) {
    muted = m; $("#mute").classList.toggle("muted", m); $("#mute").setAttribute("aria-pressed", m);
    if (!ac) return;
    if (m) { master.gain.setTargetAtTime(0, ac.currentTime, .08); playing = false; clearTimeout(timer); setTimeout(() => muted && ac.suspend(), 400); }
    else { ac.resume().then(() => { master.gain.setTargetAtTime(.9, ac.currentTime, .1); startMusic(); }); }
  }
  $("#mute").addEventListener("click", () => setMuted(!muted));
  document.addEventListener("visibilitychange", () => { if (!ac || muted) return; if (document.hidden) { ac.suspend(); playing = false; clearTimeout(timer); } else ac.resume().then(startMusic); });

  /* ---------- 5. Envelope opening ---------- */
  let opened = false;
  function burst(host, x, y) {
    if (reduce) return;
    for (let i = 0; i < 52; i++) {
      const p = document.createElement("i"), s = 3 + Math.random() * 5;
      p.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;z-index:50;background:${["#f3dc9a", "#d9b45a", "#fff6cf", "#e53935", "#8bc34a"][i % 5]};box-shadow:0 0 8px rgba(217,180,90,.8)`;
      host.appendChild(p); const a = Math.random() * 6.283, d = 70 + Math.random() * 220;
      gsap.to(p, { x: Math.cos(a) * d, y: Math.sin(a) * d - 50, opacity: 0, scale: .2, duration: 1.8 + Math.random() * 1.2, ease: "power2.out", onComplete: () => p.remove() });
    }
  }
  function openEnvelope() {
    if (opened) return; opened = true;
    gsap.killTweensOf(".env");
    gsap.to(".env", { rotationX: 0, y: 0, duration: .8, ease: "power2.out" });
    initAudio(); if (ac) { ac.resume(); sfxChime(); startMusic(); }
    $("#tap").style.animation = "none"; gsap.to("#tap", { opacity: 0, duration: .6, ease: "power2.out" });
    const seal = $("#seal").getBoundingClientRect();
    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    tl.to("#seal", { scale: 1.2, duration: .45, ease: "power2.out" })
      .add(() => burst($("#intro"), seal.left + seal.width / 2, seal.top + seal.height / 2), "-=.1")
      .to("#seal", { scale: .3, opacity: 0, duration: .55, ease: "power2.in" })
      .to("#flap", { rotationX: 180, duration: 1.8, ease: "power2.inOut" }, "-=.2")
      .set("#flap", { zIndex: 1 }, "<.9")
      .to("#flapEdge", { opacity: 0, duration: .5, ease: "power1.inOut" }, "<.5")
      .add(() => { if (ac) sfxSwoosh(); }, "+=.1")
      .to("#letter", { yPercent: -92, duration: 2.0, ease: "power2.out" }, "<")
      .to(".label", { opacity: .35, duration: 1.2, ease: "power1.out" }, "<.3")
      .to({}, { duration: .8 })
      .to(".scene", { scale: 1.45, y: 35, duration: 1.6, ease: "power2.inOut" })
      .to("#intro", {
        opacity: 0,
        duration: 1.3,
        ease: "power2.inOut",
        onStart: () => {
          $("#intro").style.pointerEvents = "none";
          showDeck();
        }
      }, "<.3");
  }
  $("#intro").addEventListener("click", openEnvelope);
  if (!reduce && window.gsap) gsap.to(".env", { y: -6, rotationX: 10, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });

  /* ---------- 6. Vertically scrollable four-card deck ---------- */
  const deck = $("#deck"), cards = $$(".card"), dots = $$("#dots button");
  let idx = 0, seen = false, scrollFrame = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Staggered entrance when a card becomes active
  function activate(i) {
    const card = cards[i], items = $$("[data-a]", card);
    gsap.killTweensOf(items);
    gsap.fromTo(items, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .85, stagger: .09, ease: "power3.out", delay: .12, clearProps: "transform,opacity" });
    if (i === 1) {
      gsap.fromTo("#figMan", { x: -90, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1, ease: "power3.out", delay: .2, clearProps: "transform,opacity" });
      gsap.fromTo("#figWoman", { x: 90, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1, ease: "power3.out", delay: .3, clearProps: "transform,opacity" });
    }
  }
  function snap(i, instant = false) {
    const target = cards[clamp(i, 0, cards.length - 1)];
    const top = deck.scrollTop + target.getBoundingClientRect().top - deck.getBoundingClientRect().top;
    deck.scrollTo({ top, behavior: instant || reduce ? "auto" : "smooth" });
  }
  dots.forEach((d, k) => d.addEventListener("click", () => snap(k)));

  deck.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const marker = deck.getBoundingClientRect().top + deck.clientHeight * .45;
      let active = 0;
      cards.forEach((card, i) => { if (card.getBoundingClientRect().top <= marker) active = i; });
      if (active === idx) return;
      idx = active;
      dots.forEach((d, k) => d.classList.toggle("a", k === idx));
      activate(idx);
    });
  }, { passive: true });
  addEventListener("keydown", (e) => {
    if (deck.style.visibility !== "visible") return;
    if (e.target instanceof Element && e.target.closest("input,textarea,select,button,[contenteditable='true']")) return;
    if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); snap(idx + 1); }
    if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); snap(idx - 1); }
    if (e.key === "Home") { e.preventDefault(); snap(0); }
    if (e.key === "End") { e.preventDefault(); snap(cards.length - 1); }
  });
  addEventListener("resize", sizeDust);

  function showDeck() {
    gsap.set(deck, { visibility: "visible" });
    gsap.fromTo(deck, { opacity: 0, scale: 1.05 }, {
      opacity: 1,
      scale: 1,
      duration: 1.4,
      ease: "power2.out",
      onComplete: () => {
        $("#intro").classList.add("hidden");
      }
    });
    $("#mute").classList.add("on"); $("#dots").classList.add("on"); activate(0);
    if (!seen) { seen = true; gsap.timeline({ delay: 2.2 }).fromTo("#hint", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .6 })
      .to("#hint", { y: -7, duration: .5, yoyo: true, repeat: 3, ease: "sine.inOut" }).to("#hint", { opacity: 0, duration: .6 }); }
  }
  deck.addEventListener("scroll", () => gsap.to("#hint", { opacity: 0, duration: .3, overwrite: true }), { once: true, passive: true });

  /* ---------- 7. Countdown, QR, map ---------- */
  const target = Date.parse(CFG.eventTime);
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) { $("#cd").classList.add("hidden"); $("#begun").classList.remove("hidden"); return; }
    const s = Math.floor(diff / 1000);
    $("#cdD").textContent = pad(Math.floor(s / 86400)); $("#cdH").textContent = pad(Math.floor(s % 86400 / 3600));
    $("#cdM").textContent = pad(Math.floor(s % 3600 / 60)); $("#cdS").textContent = pad(s % 60);
  }
  function mountQR() {
    const el = $("#qr"); el.href = CFG.mapsShort;
    if (window.QRCode) new QRCode(el, { text: CFG.mapsShort, width: 256, height: 256, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M });
    $("#dirBtn").href = CFG.mapsDirections;
  }
  $("#shield").addEventListener("click", () => { $("#mapwrap").classList.add("live"); $("#shield").remove(); });
  $$("img[src*='crest']").forEach((im) => {
    const applyMask = () => {
      const p = im.parentNode;
      if (p) {
        p.classList.add("has-img");
        const m = p.querySelector(".shimmer");
        if (m) {
          m.style.webkitMaskImage = "url(assets/crest-25-years.png)";
          m.style.maskImage = "url(assets/crest-25-years.png)";
          m.style.webkitMaskSize = "100% 100%";
          m.style.maskSize = "100% 100%";
          m.style.webkitMaskRepeat = "no-repeat";
          m.style.maskRepeat = "no-repeat";
          m.style.webkitMaskPosition = "center";
          m.style.maskPosition = "center";
        }
      }
    };
    if (im.complete) applyMask();
    else im.addEventListener("load", applyMask);
  });

  /* ---------- 8. Host link generator (?admin=1) ---------- */
  function initAdmin() {
    if (params.get("admin") !== "1") return;
    const box = $("#admin"), list = $("#list"); box.classList.remove("hidden");
    const base = location.origin + location.pathname.replace(/index\.html$/, "");
    const link = (n) => `${base}?guest=${encodeURIComponent(n).replace(/%20/g, "+")}`;
    const copy = async (t, btn) => {
      try { await navigator.clipboard.writeText(t); } catch (_) { const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove(); }
      if (btn) { const o = btn.textContent; btn.textContent = "Copied ✓"; setTimeout(() => (btn.textContent = o), 1200); }
    };
    const names = () => $("#names").value.split("\n").map((s) => s.trim()).filter(Boolean);
    $("#gen").onclick = () => {
      list.innerHTML = "";
      names().forEach((n) => {
        const r = document.createElement("div"); r.className = "row";
        const s = document.createElement("span"); s.textContent = n;
        const b = document.createElement("button"); b.className = "b"; b.textContent = "Copy Link"; b.onclick = () => copy(link(n), b);
        r.append(s, b); list.appendChild(r);
      });
    };
    $("#copyAll").onclick = (e) => copy(names().map((n) => `${n}: ${link(n)}`).join("\n"), e.target);
    $("#closeAdmin").onclick = () => box.classList.add("hidden");
  }

  /* ---------- boot ---------- */
  function boot() {
    mountArt(); sizeDust();
    if (reduce) drawDust(0); else requestAnimationFrame(drawDust);
    mountQR(); tick(); setInterval(tick, 1000); initAdmin();
  }
  if (window.gsap) boot();
  else { window.addEventListener("load", () => { if (window.gsap) boot(); else { $("#intro").classList.add("hidden"); deck.style.cssText = "visibility:visible;opacity:1"; } }); }
})();
