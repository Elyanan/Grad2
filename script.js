(() => {
  "use strict";

  const data = window.GRADUATION_DATA;
  if (!data) {
    document.body.innerHTML = "<p style='padding:2rem;font-family:sans-serif'>The graduation data file could not be loaded.</p>";
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons({ attrs: { "stroke-width": 1.7 } });
    }
  };

  const siteRoot = $("#siteRoot");
  const preloader = $("#preloader");
  const openingScreen = $("#openingScreen");
  const ceremonyContent = $("#ceremonyContent");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    started: false,
    muted: false,
    backgroundPlaying: false,
    narrationPlaying: false,
    skipAnimations: false,
    diplomaAccepted: false,
    speechChapter: 0,
    galleryIndex: 0,
    entranceApplausePlayed: false,
    finalCelebrated: false,
    wishBackdrop: null,
    closingTimer: null
  };

  const navigationItems = [
    { id: "ceremony", label: "Ceremony" },
    { id: "diploma", label: "Diploma" },
    { id: "speech", label: "Speech" },
    { id: "journey", label: "Journey" },
    { id: "memories", label: "Memories" },
    { id: "future", label: "Future" },
    { id: "final", label: "Final Celebration" }
  ];

  const wishPositions = [
    [18, 22], [34, 14], [50, 24], [67, 13], [82, 25], [23, 43],
    [42, 43], [60, 42], [78, 46], [31, 67], [52, 63], [71, 70]
  ];

  function setText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  function populateStaticContent() {
    document.title = `${data.graduate.fullName} — Class of ${data.graduate.graduationYear}`;
    setText("openingEyebrow", data.opening.eyebrow);
    setText("openingTitle", data.opening.title);
    setText("openingName", data.graduate.fullName);
    setText("openingSubtitle", data.opening.subtitle);
    setText("stageClassYear", `Class of ${data.graduate.graduationYear}`);
    setText("stageTitle", data.stageMessages[0]);
    setText("stageMessageTwo", data.stageMessages[1]);
    setText("podiumInitials", data.graduate.initials);
    setText("entranceTitle", data.graduate.fullName);
    setText("diplomaLabel", data.diploma.subtitle);
    setText("diplomaHeading", data.graduate.fullName);
    setText("diplomaCitation", data.diploma.citation);
    setText("diplomaYear", `Class of ${data.graduate.graduationYear}`);
    setText("diplomaSignature", data.sender.fullName);
    setText("speechIntroduction", data.speech.introduction);
    setText("speechInitials", data.graduate.initials);
    setText("achievementIntro", `Tap or click each award to reveal the reason it belongs to ${data.graduate.firstName}.`);
    setText("letterPreview", `A letter for ${data.graduate.firstName}`);
    setText("promiseSignature", `— ${data.sender.fullName}`);
    setText("finalHeading", data.graduate.fullName);
    setText("finalYear", `Class of ${data.graduate.graduationYear}`);
    setText("closingYear", `Class of ${data.graduate.graduationYear}`);
    setText("closingName", data.graduate.fullName);
    setText("closingMain", data.closing.title);
    setText("closingSub", data.closing.subtitle);
    setText("closingDate", data.graduate.graduationDate);
    setText("closingCreator", `Made with pride by ${data.sender.fullName}`);
    setText("postscript", data.closing.hiddenMessage);

    const portrait = $("#graduatePortrait");
    portrait.src = data.graduate.portrait;
    portrait.alt = `${data.graduate.fullName}, the graduate`;
    installImageFallback(portrait, "Replace her-graduation-photo in media/images");
  }

  function renderNavigation() {
    const panel = $("#navPanel");
    panel.innerHTML = navigationItems.map((item) => (
      `<button type="button" data-section="${item.id}"><span></span>${escapeHtml(item.label)}</button>`
    )).join("");

    panel.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-section]");
      if (!button) return;
      document.getElementById(button.dataset.section)?.scrollIntoView({ behavior: state.skipAnimations ? "auto" : "smooth", block: "start" });
      $("#sectionNav").classList.remove("is-open");
      $("#navToggle").setAttribute("aria-expanded", "false");
      $("#navToggle").innerHTML = '<i data-lucide="menu"></i>';
      refreshIcons();
    });
  }

  function renderTimeline() {
    const timeline = $("#timeline");
    const items = data.timeline.map((item, index) => `
      <article class="timeline-item ${index % 2 === 0 ? "left" : "right"} reveal">
        <div class="timeline-node"><i data-lucide="${item.icon}"></i><span><i data-lucide="check"></i></span></div>
        <div class="timeline-card"><p>${escapeHtml(item.date)}</p><h3>${escapeHtml(item.title)}</h3></div>
      </article>
    `).join("");
    timeline.insertAdjacentHTML("beforeend", items);
  }

  function renderAchievements() {
    const grid = $("#achievementGrid");
    grid.innerHTML = data.achievements.map((achievement, index) => `
      <button type="button" class="achievement-card reveal ${index === 0 ? "active" : ""}" data-achievement="${index}" aria-expanded="${index === 0}">
        <div class="achievement-shine" aria-hidden="true"></div>
        <i data-lucide="${achievement.icon}" class="achievement-icon"></i>
        <span class="achievement-number">${String(index + 1).padStart(2, "0")}</span>
        <h3>${escapeHtml(achievement.title)}</h3>
        <p class="achievement-message">${escapeHtml(achievement.message)}</p>
        <span class="achievement-hint">${index === 0 ? "Close honor" : "Reveal honor"}</span>
      </button>
    `).join("");

    grid.addEventListener("click", (event) => {
      const card = event.target.closest(".achievement-card");
      if (!card) return;
      const wasActive = card.classList.contains("active");
      $$(".achievement-card", grid).forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-expanded", "false");
        $(".achievement-hint", item).textContent = "Reveal honor";
      });
      if (!wasActive) {
        card.classList.add("active");
        card.setAttribute("aria-expanded", "true");
        $(".achievement-hint", card).textContent = "Close honor";
      }
    });
  }

  function installImageFallback(image, label) {
    image.addEventListener("error", () => {
      if (!image.isConnected) return;
      const fallback = document.createElement("div");
      fallback.className = `image-fallback ${image.className || ""}`;
      fallback.setAttribute("role", "img");
      fallback.setAttribute("aria-label", `${image.alt}. ${label}`);
      fallback.innerHTML = `<i data-lucide="image"></i><span>${escapeHtml(label)}</span>`;
      image.replaceWith(fallback);
      refreshIcons();
    }, { once: true });
  }

  function renderGallery() {
    const grid = $("#galleryGrid");
    grid.innerHTML = data.gallery.map((item, index) => `
      <figure class="gallery-item gallery-item-${index + 1} reveal">
        <button type="button" data-gallery-index="${index}" aria-label="Open image: ${escapeHtml(item.caption)}">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" class="gallery-image" loading="lazy" data-fallback="Replace memory-${index + 1} in media/images" />
          <span class="gallery-zoom"><i data-lucide="zoom-in"></i></span>
        </button>
        <figcaption>${escapeHtml(item.caption)}</figcaption>
      </figure>
    `).join("");

    $$("img[data-fallback]", grid).forEach((image) => installImageFallback(image, image.dataset.fallback));
    grid.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-gallery-index]");
      if (!button) return;
      openLightbox(Number(button.dataset.galleryIndex));
    });
  }

  function renderConstellation() {
    const constellation = $("#constellation");
    const svg = $("#constellationLines");
    svg.innerHTML = wishPositions.slice(0, -1).map((point, index) => {
      const next = wishPositions[index + 1];
      return `<line x1="${point[0]}" y1="${point[1]}" x2="${next[0]}" y2="${next[1]}"></line>`;
    }).join("");

    const stars = data.wishes.map((wish, index) => `
      <button type="button" class="wish-star" data-wish="${index}" style="left:${wishPositions[index][0]}%;top:${wishPositions[index][1]}%" aria-label="Reveal the wish for ${escapeHtml(wish.label)}">
        <span class="star-pulse" aria-hidden="true"></span><i data-lucide="star" fill="currentColor"></i><span>${escapeHtml(wish.label)}</span>
      </button>
    `).join("");
    constellation.insertAdjacentHTML("beforeend", stars);

    constellation.addEventListener("click", (event) => {
      const star = event.target.closest("button[data-wish]");
      if (!star) return;
      openWish(Number(star.dataset.wish));
    });
  }

  function renderLetter() {
    $("#letterContent").innerHTML = data.futureLetter.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  }

  function renderPromise() {
    $("#promiseTitle").innerHTML = data.promise.map((line, index) => `
      <p class="reveal ${index === 1 ? "promise-emphasis" : ""}" style="transition-delay:${index * .16}s">${escapeHtml(line)}</p>
    `).join("");
  }

  function renderFinalMessages() {
    $("#finalMessages").innerHTML = data.finalMessages.map((message, index) => (
      `<p class="reveal" style="transition-delay:${.15 + index * .12}s">${escapeHtml(message)}</p>`
    )).join("");
  }

  function renderSpeech() {
    const chapter = data.speech.chapters[state.speechChapter];
    const progress = ((state.speechChapter + 1) / data.speech.chapters.length) * 100;
    setText("speechCount", `${state.speechChapter + 1} / ${data.speech.chapters.length}`);
    $("#speechProgress").style.width = `${progress}%`;
    $("#speechPrevious").disabled = state.speechChapter === 0;

    const article = $("#speechArticle");
    article.classList.remove("speech-article");
    void article.offsetWidth;
    article.innerHTML = `
      <p class="speech-kicker"><i data-lucide="volume-2" aria-hidden="true"></i> A message from ${escapeHtml(data.sender.fullName)}</p>
      <h2 id="speechHeading">${escapeHtml(chapter.title)}</h2>
      ${chapter.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    `;
    article.classList.add("speech-article");

    const next = $("#speechNext");
    if (state.speechChapter < data.speech.chapters.length - 1) {
      next.innerHTML = 'Continue to the Next Chapter <i data-lucide="chevron-right"></i>';
    } else {
      next.innerHTML = 'Continue the Ceremony <i data-lucide="chevron-right"></i>';
    }
    refreshIcons();
  }

  // Audio controller
  const audio = {
    background: new Audio(data.audio.background),
    narration: new Audio(data.audio.speech),
    applause: new Audio(data.audio.applause),
    celebration: new Audio(data.audio.celebration),
    envelope: new Audio(data.audio.envelope)
  };
  audio.background.loop = true;
  audio.background.preload = "none";
  audio.background.volume = .42;
  audio.narration.preload = "none";
  audio.narration.volume = .9;
  audio.applause.preload = "none";
  audio.celebration.preload = "none";
  audio.envelope.preload = "none";

  try { state.muted = sessionStorage.getItem("graduation-muted") === "true"; } catch (_) {}

  function safePlay(element) {
    const result = element.play();
    return result && typeof result.catch === "function" ? result.catch(() => undefined) : Promise.resolve();
  }

  function applyMuted() {
    Object.values(audio).forEach((item) => { item.muted = state.muted; });
    try { sessionStorage.setItem("graduation-muted", String(state.muted)); } catch (_) {}
    const button = $("#muteToggle");
    button.setAttribute("aria-label", state.muted ? "Unmute audio" : "Mute audio");
    button.innerHTML = `<i data-lucide="${state.muted ? "volume-x" : "volume-2"}"></i>`;
    refreshIcons();
  }

  function updateMusicButton() {
    const button = $("#musicToggle");
    button.setAttribute("aria-label", state.backgroundPlaying ? "Pause background music" : "Play background music");
    button.innerHTML = `<i data-lucide="${state.backgroundPlaying ? "pause" : "play"}"></i>`;
    refreshIcons();
  }

  async function startBackground() {
    audio.background.volume = 0;
    await safePlay(audio.background);
    state.backgroundPlaying = !audio.background.paused;
    updateMusicButton();
    let volume = 0;
    const timer = window.setInterval(() => {
      volume = Math.min(.42, volume + .035);
      audio.background.volume = volume;
      if (volume >= .42) window.clearInterval(timer);
    }, 65);
  }

  async function toggleBackground() {
    if (audio.background.paused) {
      await safePlay(audio.background);
      state.backgroundPlaying = !audio.background.paused;
    } else {
      audio.background.pause();
      state.backgroundPlaying = false;
    }
    updateMusicButton();
  }

  function playSound(name) {
    const sound = audio[name];
    if (!sound) return;
    sound.currentTime = 0;
    void safePlay(sound);
  }

  function stopNarration() {
    audio.narration.pause();
    audio.background.volume = .42;
    state.narrationPlaying = false;
    updateNarrationButton();
  }

  async function toggleNarration() {
    if (audio.narration.paused) {
      audio.background.volume = .12;
      await safePlay(audio.narration);
      state.narrationPlaying = !audio.narration.paused;
    } else {
      audio.narration.pause();
      audio.background.volume = .42;
      state.narrationPlaying = false;
    }
    updateNarrationButton();
  }

  function updateNarrationButton() {
    const button = $("#narrationToggle");
    button.setAttribute("aria-label", state.narrationPlaying ? "Pause narration" : "Play optional narration");
    button.innerHTML = `<i data-lucide="${state.narrationPlaying ? "pause" : "play"}"></i><span>${state.narrationPlaying ? "Pause" : "Narration"}</span>`;
    refreshIcons();
  }

  audio.narration.addEventListener("ended", () => {
    state.narrationPlaying = false;
    audio.background.volume = .42;
    updateNarrationButton();
  });

  Object.values(audio).forEach((item) => item.addEventListener("error", () => {
    setText("audioLabel", "Add audio files");
  }));

  // Ambient particle canvas
  let ambientFrame = 0;
  let ambientParticles = [];
  function startAmbientParticles() {
    if (reduceMotion || state.skipAnimations) return;
    const canvas = $("#particlesCanvas");
    const context = canvas.getContext("2d");
    if (!context) return;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = window.innerWidth < 768 ? 32 : 64;
      ambientParticles = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 1.8 + .4,
        speed: Math.random() * .22 + .08,
        drift: (Math.random() - .5) * .18,
        opacity: Math.random() * .45 + .15
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const particle of ambientParticles) {
        particle.y -= particle.speed;
        particle.x += particle.drift;
        if (particle.y < -10) particle.y = window.innerHeight + 10;
        if (particle.x < -10) particle.x = window.innerWidth + 10;
        if (particle.x > window.innerWidth + 10) particle.x = -10;
        context.beginPath();
        context.fillStyle = `rgba(212,175,55,${particle.opacity})`;
        context.shadowColor = "rgba(243,229,171,.7)";
        context.shadowBlur = 8;
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }
      ambientFrame = window.requestAnimationFrame(draw);
    };

    window.cancelAnimationFrame(ambientFrame);
    resize();
    draw();
    window.addEventListener("resize", resize, { passive: true });
  }

  // Confetti and fireworks canvas
  const effectsCanvas = $("#celebrationCanvas");
  const effectsContext = effectsCanvas.getContext("2d");
  let effectFrame = 0;
  let effectParticles = [];
  let fireworkTimers = [];

  function resizeEffectsCanvas() {
    if (!effectsContext) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    effectsCanvas.width = Math.floor(window.innerWidth * ratio);
    effectsCanvas.height = Math.floor(window.innerHeight * ratio);
    effectsCanvas.style.width = `${window.innerWidth}px`;
    effectsCanvas.style.height = `${window.innerHeight}px`;
    effectsContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function animateEffects() {
    if (!effectsContext) return;
    effectsContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    effectParticles = effectParticles.filter((particle) => particle.life > 0);

    for (const particle of effectParticles) {
      particle.life -= particle.decay;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += particle.gravity;
      particle.vx *= particle.drag;
      particle.vy *= particle.drag;

      effectsContext.save();
      effectsContext.globalAlpha = Math.max(0, particle.life);
      effectsContext.translate(particle.x, particle.y);
      effectsContext.rotate(particle.rotation || 0);
      effectsContext.fillStyle = particle.color;
      effectsContext.shadowColor = particle.glow || "transparent";
      effectsContext.shadowBlur = particle.glow ? 9 : 0;
      if (particle.shape === "circle") {
        effectsContext.beginPath();
        effectsContext.arc(0, 0, particle.size, 0, Math.PI * 2);
        effectsContext.fill();
      } else {
        effectsContext.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        particle.rotation = (particle.rotation || 0) + particle.spin;
      }
      effectsContext.restore();
    }

    if (effectParticles.length) {
      effectFrame = window.requestAnimationFrame(animateEffects);
    } else {
      effectsContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function ensureEffectsLoop() {
    window.cancelAnimationFrame(effectFrame);
    resizeEffectsCanvas();
    animateEffects();
  }

  function burstConfetti() {
    if (reduceMotion || state.skipAnimations) return;
    const colors = ["#D4AF37", "#F3E5AB", "#C59BE8", "#FFF9ED", "#8E67B4"];
    for (let index = 0; index < (window.innerWidth < 600 ? 75 : 130); index += 1) {
      effectParticles.push({
        x: window.innerWidth * (.35 + Math.random() * .3),
        y: window.innerHeight * .3,
        vx: (Math.random() - .5) * 11,
        vy: -Math.random() * 9 - 3,
        gravity: .15 + Math.random() * .08,
        drag: .992,
        life: 1,
        decay: .008 + Math.random() * .008,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: "rect",
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - .5) * .22
      });
    }
    ensureEffectsLoop();
  }

  function addFirework(x, y) {
    const colors = ["#D4AF37", "#F3E5AB", "#C59BE8", "#FFF9ED"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const count = window.innerWidth < 600 ? 34 : 55;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * .12;
      const speed = 1.5 + Math.random() * 4.3;
      effectParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: .035,
        drag: .985,
        life: 1,
        decay: .012 + Math.random() * .009,
        size: 1.3 + Math.random() * 2,
        color,
        glow: color,
        shape: "circle",
        rotation: 0,
        spin: 0
      });
    }
  }

  function startFireworks() {
    if (reduceMotion || state.skipAnimations) return;
    fireworkTimers.forEach(window.clearTimeout);
    fireworkTimers = [];
    const bursts = window.innerWidth < 600 ? 6 : 10;
    for (let index = 0; index < bursts; index += 1) {
      const timer = window.setTimeout(() => {
        addFirework(window.innerWidth * (.12 + Math.random() * .76), window.innerHeight * (.12 + Math.random() * .42));
        ensureEffectsLoop();
      }, index * 430);
      fireworkTimers.push(timer);
    }
  }

  // Modal interactions
  function openLightbox(index) {
    state.galleryIndex = index;
    updateLightbox();
    $("#lightbox").hidden = false;
    document.body.classList.add("modal-open");
    $("#lightboxClose").focus();
  }

  function updateLightbox() {
    const item = data.gallery[state.galleryIndex];
    const image = $("#lightboxImage");
    image.src = item.src;
    image.alt = item.alt;
    setText("lightboxCaption", item.caption);
  }

  function closeLightbox() {
    $("#lightbox").hidden = true;
    document.body.classList.remove("modal-open");
  }

  function previousLightbox() {
    state.galleryIndex = (state.galleryIndex - 1 + data.gallery.length) % data.gallery.length;
    updateLightbox();
  }

  function nextLightbox() {
    state.galleryIndex = (state.galleryIndex + 1) % data.gallery.length;
    updateLightbox();
  }

  function openWish(index) {
    closeWish();
    const wish = data.wishes[index];
    const star = $(`.wish-star[data-wish="${index}"]`);
    star?.classList.add("active");
    const backdrop = document.createElement("div");
    backdrop.className = "wish-reveal-backdrop";
    backdrop.innerHTML = `
      <article class="wish-reveal-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(wish.label)} wish">
        <button class="wish-close" type="button" aria-label="Close this wish"><i data-lucide="x"></i></button>
        <div class="wish-orbit" aria-hidden="true"><i data-lucide="star" fill="currentColor"></i></div>
        <p>${escapeHtml(wish.label)}</p>
        <blockquote>“${escapeHtml(wish.message)}”</blockquote>
        <span class="wish-signoff">A little wish for your next chapter</span>
      </article>
    `;
    $("#constellation").appendChild(backdrop);
    state.wishBackdrop = backdrop;
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop || event.target.closest(".wish-close")) closeWish();
    });
    refreshIcons();
    $(".wish-close", backdrop).focus();
  }

  function closeWish() {
    state.wishBackdrop?.remove();
    state.wishBackdrop = null;
    $$(".wish-star.active").forEach((star) => star.classList.remove("active"));
  }

  function openLetterModal() {
    playSound("envelope");
    $("#letterModal").hidden = false;
    document.body.classList.add("modal-open");
    $("#letterClose").focus();
  }

  function closeLetterModal() {
    $("#letterModal").hidden = true;
    document.body.classList.remove("modal-open");
  }

  function showClosingScreen() {
    const closing = $("#closingScreen");
    closing.hidden = false;
    document.body.classList.add("modal-open");
    $("#postscript").classList.remove("is-visible");
    window.clearTimeout(state.closingTimer);
    state.closingTimer = window.setTimeout(() => $("#postscript").classList.add("is-visible"), 3000);
    $("#closingReplay").focus();
  }

  function hideClosingScreen() {
    $("#closingScreen").hidden = true;
    document.body.classList.remove("modal-open");
    window.clearTimeout(state.closingTimer);
  }

  // Scroll-linked behavior
  let revealObserver;
  function setupRevealObserver() {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    }, { threshold: .18 });
    $$(".reveal").forEach((element) => revealObserver.observe(element));

    const diplomaObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    }, { threshold: .35 });
    diplomaObserver.observe($("#diplomaCard"));

    const timelineObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    }, { threshold: .1 });
    timelineObserver.observe($("#timeline"));

    const constellationObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      $$("line", $("#constellationLines")).forEach((line, index) => {
        const length = line.getTotalLength ? line.getTotalLength() : 100;
        line.style.strokeDasharray = String(length);
        line.style.strokeDashoffset = String(length);
        line.animate([{ strokeDashoffset: length, opacity: 0 }, { strokeDashoffset: 0, opacity: .35 }], {
          duration: 520,
          delay: index * 70,
          fill: "forwards",
          easing: "ease-out"
        });
      });
      constellationObserver.disconnect();
    }, { threshold: .22 });
    constellationObserver.observe($("#constellation"));

    const entranceObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio > .38 && !state.entranceApplausePlayed) {
        state.entranceApplausePlayed = true;
        playSound("applause");
      }
    }, { threshold: [.38] });
    entranceObserver.observe($("#entrance"));

    const finalObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio > .35) {
        $("#finalCapToss").classList.remove("is-active");
        void $("#finalCapToss").offsetWidth;
        $("#finalCapToss").classList.add("is-active");
        if (!state.finalCelebrated) {
          state.finalCelebrated = true;
          playSound("applause");
          playSound("celebration");
          burstConfetti();
          startFireworks();
        }
      }
    }, { threshold: [.35, .65] });
    finalObserver.observe($("#final"));
  }

  function updateProgressAndNavigation() {
    if (!state.started) return;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(100, Math.max(0, window.scrollY / scrollable * 100));
    $("#progressBar").style.width = `${progress}%`;
    $(".ceremony-progress").setAttribute("aria-label", `Ceremony ${Math.round(progress)} percent complete`);

    let activeId = navigationItems[0].id;
    let closest = Number.POSITIVE_INFINITY;
    for (const item of navigationItems) {
      const section = document.getElementById(item.id);
      if (!section) continue;
      const distance = Math.abs(section.getBoundingClientRect().top - window.innerHeight * .34);
      if (distance < closest) {
        closest = distance;
        activeId = item.id;
      }
    }
    $$("#navPanel button").forEach((button) => button.classList.toggle("active", button.dataset.section === activeId));
  }

  function setupGsapStage() {
    if (reduceMotion || state.skipAnimations || !window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.fromTo(".stage-podium", { y: 80, scale: .92 }, {
      y: 0, scale: 1, ease: "power2.out",
      scrollTrigger: { trigger: "#ceremony", start: "top 65%", end: "center 55%", scrub: 1.1 }
    });
    window.gsap.to(".stage-beam-left", { rotate: -7, x: 24, scrollTrigger: { trigger: "#ceremony", start: "top bottom", end: "bottom top", scrub: true } });
    window.gsap.to(".stage-beam-right", { rotate: 7, x: -24, scrollTrigger: { trigger: "#ceremony", start: "top bottom", end: "bottom top", scrub: true } });
    window.ScrollTrigger.refresh();
  }

  async function beginCeremony() {
    if (state.started) return;
    state.started = true;
    siteRoot.classList.add("ceremony-started");
    ceremonyContent.hidden = false;
    requestAnimationFrame(() => ceremonyContent.classList.add("is-visible"));
    openingScreen.classList.add("is-leaving");
    await startBackground();
    startAmbientParticles();
    window.setTimeout(() => {
      document.getElementById("ceremony")?.scrollIntoView({ behavior: state.skipAnimations ? "auto" : "smooth" });
      setupGsapStage();
      updateProgressAndNavigation();
    }, 450);
  }

  function acceptDiploma() {
    if (state.diplomaAccepted) return;
    state.diplomaAccepted = true;
    $("#diplomaCard").classList.add("accepted");
    const button = $("#acceptDiploma");
    button.disabled = true;
    button.innerHTML = 'Diploma Accepted <i data-lucide="graduation-cap"></i>';
    playSound("celebration");
    burstConfetti();
    refreshIcons();
  }

  function replayCeremony() {
    stopNarration();
    audio.background.pause();
    audio.background.currentTime = 0;
    state.backgroundPlaying = false;
    updateMusicButton();
    hideClosingScreen();
    closeLightbox();
    closeLetterModal();
    closeWish();
    state.started = false;
    state.diplomaAccepted = false;
    state.speechChapter = 0;
    state.entranceApplausePlayed = false;
    state.finalCelebrated = false;
    $("#diplomaCard").classList.remove("accepted", "is-visible");
    $("#acceptDiploma").disabled = false;
    $("#acceptDiploma").innerHTML = 'Accept Diploma <i data-lucide="graduation-cap"></i>';
    $("#finalCapToss").classList.remove("is-active");
    ceremonyContent.classList.remove("is-visible");
    ceremonyContent.hidden = true;
    siteRoot.classList.remove("ceremony-started");
    openingScreen.classList.remove("is-leaving");
    $$(".reveal").forEach((element) => element.classList.remove("is-visible"));
    $("#timeline").classList.remove("is-visible");
    window.cancelAnimationFrame(ambientFrame);
    const context = $("#particlesCanvas").getContext("2d");
    context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
    effectParticles = [];
    effectsContext?.clearRect(0, 0, window.innerWidth, window.innerHeight);
    renderSpeech();
    window.scrollTo({ top: 0, behavior: "auto" });
    refreshIcons();
  }

  function wireEvents() {
    $("#beginButton").addEventListener("click", beginCeremony);
    $("#musicToggle").addEventListener("click", toggleBackground);
    $("#muteToggle").addEventListener("click", () => { state.muted = !state.muted; applyMuted(); });
    $("#navToggle").addEventListener("click", () => {
      const nav = $("#sectionNav");
      const open = nav.classList.toggle("is-open");
      $("#navToggle").setAttribute("aria-expanded", String(open));
      $("#navToggle").innerHTML = `<i data-lucide="${open ? "x" : "menu"}"></i>`;
      refreshIcons();
    });
    $("#skipAnimations").addEventListener("click", () => {
      state.skipAnimations = !state.skipAnimations;
      siteRoot.classList.toggle("skip-animations", state.skipAnimations);
      $("#skipAnimations span").textContent = state.skipAnimations ? "Restore animation" : "Skip animation";
      if (!state.skipAnimations && state.started) startAmbientParticles();
      if (state.skipAnimations) window.cancelAnimationFrame(ambientFrame);
    });
    $("#acceptDiploma").addEventListener("click", acceptDiploma);
    $("#narrationToggle").addEventListener("click", toggleNarration);
    $("#speechPrevious").addEventListener("click", () => {
      state.speechChapter = Math.max(0, state.speechChapter - 1);
      renderSpeech();
    });
    $("#speechNext").addEventListener("click", () => {
      if (state.speechChapter < data.speech.chapters.length - 1) {
        state.speechChapter += 1;
        renderSpeech();
      } else {
        $("#journey").scrollIntoView({ behavior: state.skipAnimations ? "auto" : "smooth" });
      }
    });
    $("#lightboxClose").addEventListener("click", closeLightbox);
    $("#lightboxPrevious").addEventListener("click", (event) => { event.stopPropagation(); previousLightbox(); });
    $("#lightboxNext").addEventListener("click", (event) => { event.stopPropagation(); nextLightbox(); });
    $("#lightbox").addEventListener("click", (event) => { if (event.target === $("#lightbox")) closeLightbox(); });
    let touchStart = 0;
    $("#lightbox").addEventListener("touchstart", (event) => { touchStart = event.changedTouches[0].screenX; }, { passive: true });
    $("#lightbox").addEventListener("touchend", (event) => {
      const distance = event.changedTouches[0].screenX - touchStart;
      if (distance > 50) previousLightbox();
      if (distance < -50) nextLightbox();
    }, { passive: true });
    $("#openLetter").addEventListener("click", openLetterModal);
    $("#letterClose").addEventListener("click", closeLetterModal);
    $("#letterKeep").addEventListener("click", closeLetterModal);
    $("#nextChapter").addEventListener("click", showClosingScreen);
    $("#footerReplay").addEventListener("click", replayCeremony);
    $("#closingReplay").addEventListener("click", replayCeremony);
    $("#returnSpeech").addEventListener("click", () => { hideClosingScreen(); window.setTimeout(() => $("#speech").scrollIntoView({ behavior: "smooth" }), 80); });
    $("#viewGallery").addEventListener("click", () => { hideClosingScreen(); window.setTimeout(() => $("#memories").scrollIntoView({ behavior: "smooth" }), 80); });
    window.addEventListener("scroll", updateProgressAndNavigation, { passive: true });
    window.addEventListener("resize", () => { updateProgressAndNavigation(); resizeEffectsCanvas(); }, { passive: true });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (!$("#lightbox").hidden) closeLightbox();
        else if (!$("#letterModal").hidden) closeLetterModal();
        else if (state.wishBackdrop) closeWish();
        else if (!$("#closingScreen").hidden) hideClosingScreen();
      }
      if (!$("#lightbox").hidden && event.key === "ArrowLeft") previousLightbox();
      if (!$("#lightbox").hidden && event.key === "ArrowRight") nextLightbox();
    });
  }

  function initialize() {
    populateStaticContent();
    renderNavigation();
    renderTimeline();
    renderAchievements();
    renderGallery();
    renderConstellation();
    renderLetter();
    renderPromise();
    renderFinalMessages();
    renderSpeech();
    applyMuted();
    updateMusicButton();
    wireEvents();
    refreshIcons();
    setupRevealObserver();
    resizeEffectsCanvas();

    window.setTimeout(() => {
      preloader.classList.add("is-hidden");
      window.setTimeout(() => { preloader.hidden = true; }, 720);
    }, 1350);
  }

  initialize();
})();
