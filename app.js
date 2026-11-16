/**
 * 25 Years Get Together Party — Interactive Digital Invitation
 * Features:
 * - Stateless URL guest personalization (?guest= or ?g=)
 * - Interactive 3D Envelope opening with Web Audio API SFX & synthesized music-box loop
 * - 3-Card touch/mouse swipeable deck with GSAP spring physics
 * - Dynamic Location QR Code & live Sri Lanka Time countdown
 * - Stateless Host Link Generator (?admin=1)
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. EVENT CONFIGURATION & PERSONALIZATION
  // =========================================================================
  const EVENT_CONFIG = {
    eventDateISO: '2026-12-20T09:00:00+05:30', // Dec 20, 2026, 9:00 AM SLT
    venueName: 'Villa by the Edge',
    venueAddress: '54, Palliyawatta Road, Hekitta, Wattala',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Villa+by+the+Edge,+54+Palliyawatta+Road,+Hekitta,+Wattala',
    rsvpPhone: '94777410599',
    defaultGuest: 'VALUED GUEST',
  };

  const urlParams = new URLSearchParams(window.location.search);
  const rawGuest = urlParams.get('guest') || urlParams.get('g');
  const guestName =
    rawGuest && rawGuest.trim().length > 0
      ? rawGuest.trim().toUpperCase()
      : EVENT_CONFIG.defaultGuest;

  // Populate guest name across Envelope & Card 1
  document.getElementById('envelope-guest-name').textContent = guestName;
  document.getElementById('card-guest-name').textContent = guestName;

  // Configure pre-filled WhatsApp RSVP links
  const whatsappMessage = encodeURIComponent(
    `Hello Raj! Thank you for inviting ${guestName} to the 25 Years Get Together Party on 20th Dec 2026 at Villa by the Edge. We are happy to confirm our RSVP!`,
  );
  const whatsappUrl = `https://wa.me/${EVENT_CONFIG.rsvpPhone}?text=${whatsappMessage}`;

  document.getElementById('rsvp-link-c1').href = whatsappUrl;
  document.getElementById('rsvp-link-c3').href = whatsappUrl;

  // Generate crisp QR Code for Villa by the Edge Google Maps URL
  const qrContainer = document.getElementById('location-qrcode');
  if (qrContainer && typeof QRCode !== 'undefined') {
    new QRCode(qrContainer, {
      text: EVENT_CONFIG.mapsUrl,
      width: 54,
      height: 54,
      colorDark: '#0D0D0D',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  // =========================================================================
  // 2. WEB AUDIO API: PAPER SFX + SYNTHESIZED FESTIVE MUSIC-BOX
  // =========================================================================
  class FestiveAudioEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.isMuted = false;
      this.isPlayingMusic = false;
      this.loopTimer = null;
      this.noteIndex = 0;

      // Gentle celesta/music-box melody in F Major / D Minor festive cadence
      // [MIDI note, duration in seconds]
      this.melody = [
        [72, 0.45],
        [76, 0.45],
        [79, 0.45],
        [84, 0.9], // C5 E5 G5 C6
        [83, 0.45],
        [79, 0.45],
        [76, 0.9], // B5 G5 E5
        [74, 0.45],
        [77, 0.45],
        [81, 0.45],
        [86, 0.9], // D5 F5 A5 D6
        [84, 0.45],
        [81, 0.45],
        [79, 0.9], // C6 A5 G5
        [76, 0.45],
        [79, 0.45],
        [84, 0.45],
        [88, 0.9], // E5 G5 C6 E6
        [86, 0.45],
        [84, 0.45],
        [81, 0.45],
        [77, 0.45], // D6 C6 A5 F5
        [79, 0.6],
        [74, 0.6],
        [72, 1.3], // G5 D5 C5
      ];
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 0.35;
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    midiToFreq(midi) {
      return 440 * Math.pow(2, (midi - 69) / 12);
    }

    // Crisp paper-slide swoosh + celebratory chime on envelope open
    playEnvelopeOpenSFX() {
      this.init();
      const now = this.ctx.currentTime;

      // 1. Filtered white noise for tactile paper slide
      const bufferSize = this.ctx.sampleRate * 0.45;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(900, now);
      bandpass.frequency.exponentialRampToValueAtTime(2600, now + 0.35);
      bandpass.Q.value = 1.4;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.linearRampToValueAtTime(0.28, now + 0.12);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      whiteNoise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      whiteNoise.start(now);

      // 2. Warm sparkle chime arpeggio (C5 - E5 - G5 - B5 - D6)
      const chimeNotes = [72, 76, 79, 83, 86];
      chimeNotes.forEach((midi, idx) => {
        this.triggerMusicBoxTone(midi, now + 0.18 + idx * 0.08, 1.4, 0.22);
      });
    }

    triggerMusicBoxTone(midi, startTime, duration = 1.2, peakGain = 0.16) {
      if (!this.ctx || this.isMuted) return;

      const freq = this.midiToFreq(midi);

      // Primary pure sine tine
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, startTime);

      // Subtle harmonic overtone (octave + fifth shimmer)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, startTime);

      const noteGain = this.ctx.createGain();
      const overtoneGain = this.ctx.createGain();
      overtoneGain.gain.value = 0.18;

      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.connect(noteGain);
      osc2.connect(overtoneGain);
      overtoneGain.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration + 0.05);
      osc2.stop(startTime + duration + 0.05);
    }

    startMusicBoxLoop() {
      this.init();
      if (this.isPlayingMusic) return;
      this.isPlayingMusic = true;

      const scheduleNext = () => {
        if (!this.isPlayingMusic) return;
        const [midi, stepDur] = this.melody[this.noteIndex];
        this.triggerMusicBoxTone(midi, this.ctx.currentTime + 0.02, 1.35, 0.14);

        this.noteIndex = (this.noteIndex + 1) % this.melody.length;
        this.loopTimer = setTimeout(scheduleNext, stepDur * 1000);
      };

      scheduleNext();
    }

    toggleMute() {
      this.init();
      this.isMuted = !this.isMuted;
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime, 0.05);
      }
      return this.isMuted;
    }
  }

  const audioEngine = new FestiveAudioEngine();

  // Audio Toggle Button Handler
  const audioToggleBtn = document.getElementById('audio-toggle');
  const iconSoundOn = document.getElementById('icon-sound-on');
  const iconSoundOff = document.getElementById('icon-sound-off');

  audioToggleBtn.addEventListener('click', () => {
    const muted = audioEngine.toggleMute();
    iconSoundOn.classList.toggle('hidden', muted);
    iconSoundOff.classList.toggle('hidden', !muted);
  });

  // =========================================================================
  // 3. AMBIENT GOLD GLITTER & RIBBON CONFETTI PARTICLES (CANVAS)
  // =========================================================================
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const GLITTER_COLORS = ['#D4AF37', '#F7DF94', '#8BC34A', '#C92A32', '#FFFFFF'];

  function createParticles(count = 55, burstOrigin = null) {
    for (let i = 0; i < count; i++) {
      // Bias ambient glitter toward left & right margins like the reference design
      const sideBias = Math.random() < 0.5 ? Math.random() * 0.28 : 0.72 + Math.random() * 0.28;
      const x = burstOrigin ? burstOrigin.x : sideBias * canvas.width;
      const y = burstOrigin ? burstOrigin.y : Math.random() * canvas.height;

      particles.push({
        x,
        y,
        vx: burstOrigin ? (Math.random() - 0.5) * 6 : (Math.random() - 0.5) * 0.25,
        vy: burstOrigin ? (Math.random() - 0.7) * 6 : -0.15 - Math.random() * 0.35,
        size: burstOrigin ? 2 + Math.random() * 3 : 1 + Math.random() * 2,
        color: GLITTER_COLORS[Math.floor(Math.random() * GLITTER_COLORS.length)],
        alpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.015 + Math.random() * 0.03,
        isBurst: Boolean(burstOrigin),
        life: 1,
      });
    }
  }

  createParticles(50);

  function renderParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += Math.sin(Date.now() * p.twinkleSpeed) * 0.02;

      if (p.isBurst) {
        p.vy += 0.12; // subtle gravity
        p.life -= 0.018;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
      } else {
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0.05, Math.min(1, p.alpha * (p.isBurst ? p.life : 1)));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(renderParticles);
  }
  renderParticles();

  // =========================================================================
  // 4. STAGE 1 -> STAGE 2: 3D ENVELOPE OPENING SEQUENCE
  // =========================================================================
  const envelopeStage = document.getElementById('envelope-stage');
  const envelopeTrigger = document.getElementById('envelope-trigger');
  const deckStage = document.getElementById('deck-stage');
  let isEnvelopeOpened = false;

  function openEnvelope() {
    if (isEnvelopeOpened) return;
    isEnvelopeOpened = true;

    // Trigger Web Audio SFX + Music-Box Loop
    audioEngine.playEnvelopeOpenSFX();
    setTimeout(() => audioEngine.startMusicBoxLoop(), 450);

    // Burst gold glitter from wax seal center
    const rect = envelopeTrigger.getBoundingClientRect();
    createParticles(45, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height * 0.45,
    });

    const tl = gsap.timeline({
      onComplete: () => {
        envelopeStage.style.display = 'none';
        deckStage.classList.remove('pointer-events-none');
        animateCardEntrance(0);
      },
    });

    tl.to('#tap-prompt, .envelope-intro-text', {
      opacity: 0,
      duration: 0.25,
    })
      .to(
        '#wax-seal',
        {
          scale: 1.25,
          opacity: 0,
          duration: 0.35,
          ease: 'back.in(1.7)',
        },
        '<',
      )
      .to('#envelope-flap-top', {
        rotateX: 180,
        zIndex: 1,
        duration: 0.65,
        ease: 'power2.inOut',
      })
      .to(
        '#envelope-inner-card',
        {
          y: -115,
          scale: 1.04,
          duration: 0.6,
          ease: 'power3.out',
        },
        '-=0.25',
      )
      .to(envelopeStage, {
        opacity: 0,
        scale: 1.06,
        duration: 0.55,
        ease: 'power2.inOut',
      })
      .to(
        deckStage,
        {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
        },
        '-=0.35',
      );
  }

  envelopeTrigger.addEventListener('click', openEnvelope);
  envelopeTrigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelope();
    }
  });

  // =========================================================================
  // 5. SWIPEABLE 3-CARD CAROUSEL (TOUCH, MOUSE DRAG & DOTS)
  // =========================================================================
  const cardsTrack = document.getElementById('cards-track');
  const pageDots = document.querySelectorAll('.page-dot');
  const swipeHint = document.getElementById('swipe-hint');
  const TOTAL_CARDS = 3;

  let currentIndex = 0;
  let startX = 0;
  let currentDeltaX = 0;
  let isDragging = false;
  const visitedCards = new Set();

  function animateCardEntrance(index) {
    if (visitedCards.has(index)) return;
    visitedCards.add(index);

    if (index === 0) {
      gsap.from('.anim-c1', {
        y: 22,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
      });
    } else if (index === 1) {
      gsap.from('.anim-c2', {
        y: 20,
        opacity: 0,
        duration: 0.65,
        stagger: 0.1,
        ease: 'power3.out',
      });
      gsap.from('#model-man', {
        x: -45,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
      gsap.from('#model-woman', {
        x: 45,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    } else if (index === 2) {
      gsap.from('.anim-c3', {
        y: 20,
        opacity: 0,
        duration: 0.65,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }
  }

  function goToCard(index) {
    currentIndex = Math.max(0, Math.min(TOTAL_CARDS - 1, index));
    const targetX = -currentIndex * window.innerWidth;

    gsap.to(cardsTrack, {
      x: targetX,
      duration: 0.5,
      ease: 'power3.out',
    });

    pageDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });

    if (currentIndex > 0 && swipeHint) {
      swipeHint.style.opacity = '0';
    }

    animateCardEntrance(currentIndex);
  }

  // Touch Events
  cardsTrack.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      startX = e.touches[0].clientX;
      currentDeltaX = 0;
      gsap.killTweensOf(cardsTrack);
    },
    { passive: true },
  );

  cardsTrack.addEventListener(
    'touchmove',
    (e) => {
      if (!isDragging) return;
      currentDeltaX = e.touches[0].clientX - startX;
      // Rubber-band resistance at deck edges
      const atEdge =
        (currentIndex === 0 && currentDeltaX > 0) ||
        (currentIndex === TOTAL_CARDS - 1 && currentDeltaX < 0);
      const dampedDelta = atEdge ? currentDeltaX * 0.28 : currentDeltaX;
      const baseOffset = -currentIndex * window.innerWidth;
      gsap.set(cardsTrack, { x: baseOffset + dampedDelta });
    },
    { passive: true },
  );

  cardsTrack.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    const threshold = window.innerWidth * 0.18;

    if (currentDeltaX < -threshold && currentIndex < TOTAL_CARDS - 1) {
      goToCard(currentIndex + 1);
    } else if (currentDeltaX > threshold && currentIndex > 0) {
      goToCard(currentIndex - 1);
    } else {
      goToCard(currentIndex);
    }
  });

  // Desktop Mouse Drag Support
  cardsTrack.addEventListener('mousedown', (e) => {
    if (e.target.closest('a, button, iframe')) return;
    isDragging = true;
    startX = e.clientX;
    currentDeltaX = 0;
    gsap.killTweensOf(cardsTrack);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    currentDeltaX = e.clientX - startX;
    const baseOffset = -currentIndex * window.innerWidth;
    gsap.set(cardsTrack, { x: baseOffset + currentDeltaX });
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    const threshold = window.innerWidth * 0.15;

    if (currentDeltaX < -threshold && currentIndex < TOTAL_CARDS - 1) {
      goToCard(currentIndex + 1);
    } else if (currentDeltaX > threshold && currentIndex > 0) {
      goToCard(currentIndex - 1);
    } else {
      goToCard(currentIndex);
    }
  });

  // Pagination Dot Clicks & Keyboard Arrows
  pageDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = Number(dot.dataset.index);
      goToCard(idx);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (!isEnvelopeOpened) return;
    if (e.key === 'ArrowRight') goToCard(currentIndex + 1);
    if (e.key === 'ArrowLeft') goToCard(currentIndex - 1);
  });

  window.addEventListener('resize', () => {
    gsap.set(cardsTrack, { x: -currentIndex * window.innerWidth });
  });

  // =========================================================================
  // 6. CARD 3: REAL-TIME EVENT COUNTDOWN (DEC 20, 2026 - 9:00 AM SLT)
  // =========================================================================
  const targetTimestamp = new Date(EVENT_CONFIG.eventDateISO).getTime();
  const elDays = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMins = document.getElementById('cd-mins');
  const elSecs = document.getElementById('cd-secs');
  const countdownGrid = document.getElementById('countdown-grid');
  const countdownLiveMsg = document.getElementById('countdown-live-msg');

  function updateCountdown() {
    const now = Date.now();
    const diff = targetTimestamp - now;

    if (diff <= 0) {
      countdownGrid.classList.add('hidden');
      countdownLiveMsg.classList.remove('hidden');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    elDays.textContent = String(days).padStart(2, '0');
    elHours.textContent = String(hours).padStart(2, '0');
    elMins.textContent = String(mins).padStart(2, '0');
    elSecs.textContent = String(secs).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // =========================================================================
  // 7. STATELESS HOST LINK GENERATOR (?admin=1)
  // =========================================================================
  const adminModal = document.getElementById('admin-modal');
  const closeAdminBtn = document.getElementById('close-admin-btn');
  const guestListInput = document.getElementById('guest-list-input');
  const generateLinksBtn = document.getElementById('generate-links-btn');
  const generatedLinksContainer = document.getElementById('generated-links-container');

  if (urlParams.get('admin') === '1' || urlParams.get('admin') === 'true') {
    adminModal.classList.remove('hidden');
  }

  closeAdminBtn.addEventListener('click', () => {
    adminModal.classList.add('hidden');
  });

  generateLinksBtn.addEventListener('click', () => {
    const lines = guestListInput.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    generatedLinksContainer.innerHTML = '';
    const baseUrl = `${window.location.origin}${window.location.pathname}`;

    lines.forEach((name) => {
      const formattedName = name.toUpperCase();
      const personalUrl = `${baseUrl}?guest=${encodeURIComponent(formattedName)}`;
      const inviteShareText =
        `✨ *25 Years Get Together Party* ✨\n\n` +
        `Dear *${formattedName}*,\n` +
        `You are warmly invited to join our 25 Years celebration on *20th December 2026* at *Villa by the Edge, Wattala*.\n\n` +
        `Tap your personal invitation card here:\n${personalUrl}`;

      const row = document.createElement('div');
      row.className =
        'p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2';

      row.innerHTML = `
        <div class="min-w-0">
          <p class="text-xs font-bold text-white truncate">${formattedName}</p>
          <p class="text-[10px] text-neutral-400 truncate">${personalUrl}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" class="copy-btn px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white">
            Copy Link
          </button>
          <a href="https://wa.me/?text=${encodeURIComponent(inviteShareText)}" target="_blank" rel="noopener noreferrer"
             class="px-2.5 py-1.5 rounded-lg bg-[#8BC34A] text-black text-[11px] font-bold">
            WhatsApp
          </a>
        </div>
      `;

      const copyBtn = row.querySelector('.copy-btn');
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(personalUrl);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => (copyBtn.textContent = 'Copy Link'), 1800);
        } catch {
          copyBtn.textContent = 'Failed';
        }
      });

      generatedLinksContainer.appendChild(row);
    });
  });
})();
