/* =========================
  1) GSAP Setup + Lenis (limpo)
========================= */
const plugins = [];
if (typeof ScrollTrigger !== "undefined") plugins.push(ScrollTrigger);
if (typeof CustomEase   !== "undefined") plugins.push(CustomEase);
if (typeof SplitText    !== "undefined") plugins.push(SplitText);

if (plugins.length) gsap.registerPlugin(...plugins);

// Crie as eases uma única vez
if (typeof CustomEase !== "undefined") {
  if (!CustomEase.get("hop"))       CustomEase.create("hop",       "0.9,0,0.1,1");
  if (!CustomEase.get("osmo-ease")) CustomEase.create("osmo-ease", "0.625, 0.05, 0, 1");
}

/* =========================
   Osmo Words Animation (exceto hero)
========================= */
function setupOsmoWordsAnimation() {
  if (typeof SplitText === "undefined") return;

  // respeita usuários com redução de movimento
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const runAnimation = () => {
    const heroSection = document.getElementById("hero");
    const targets = gsap.utils.toArray('[data-split="words"]');

    targets.forEach((el) => {
      if (heroSection && heroSection.contains(el)) return; // ignora hero
      if (el.dataset.osmoSplit === "true") return;         // evita duplicar
      el.dataset.osmoSplit = "true";

      const split = new SplitText(el, {
        type: "words",
        wordsClass: "osmo-word" // isola estilo da osmo
      });

      if (prefersReduced) {
        split.revert();
        return;
      }

      // micro-performance
      split.words.forEach(w => w.style.willChange = "transform");

      gsap.set(split.words, { yPercent: 110 });

      gsap.to(split.words, {
        yPercent: 0,
        duration: 0.6,
        stagger: 0.06,
        ease: "osmo-ease",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          once: true
        },
        onComplete: () => {
          // limpa will-change e reverte
          split.words.forEach(w => w.style.willChange = "");
            split.revert();
            el.dataset.revealed = 'true';
        }
      });
    });

    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  };

  const fontsReady = document.fonts && document.fonts.ready;
  if (fontsReady && typeof fontsReady.then === "function") {
    fontsReady.then(runAnimation).catch(runAnimation);
  } else {
    runAnimation();
  }
}

/* main.js â€” Sopy Landing + E-com
   Requer: gsap + ScrollTrigger + SplitText + CustomEase + lenis + three + GLTFLoader
*/

/* =========================
   0) Utils
========================= */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/* =========================
  1) GSAP Setup + Lenis
========================= */
// Register only available plugins to avoid hard crashes when a CDN fails
const _plugins = [ScrollTrigger, CustomEase];
if (typeof SplitText !== "undefined") _plugins.push(SplitText);
gsap.registerPlugin(..._plugins);
CustomEase.create("hop", "0.9,0,0.1,1");
CustomEase.create("osmo-ease", "0.625, 0.05, 0, 1");

/* =========================
   Button Ripple Effect
========================= */
function setupButtonRipples() {
  const buttons = document.querySelectorAll('.btn');

  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (event) => {
      const rect = btn.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      btn.style.setProperty("--xPos", x + "px");
      btn.style.setProperty("--yPos", y + "px");
    });
  });
}

// Inicializar ripples apÃ³s DOM estar pronto
document.addEventListener('DOMContentLoaded', setupButtonRipples);
if (typeof SplitText !== "undefined") _plugins.push(SplitText);
gsap.registerPlugin(..._plugins);
CustomEase.create("hop", "0.9,0,0.1,1");

/* Lenis (scroll suave) */
const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: true,
  smoothTouch: false,
  lerp: 0.1,
});
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// Sempre iniciar no topo ao recarregar
try {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
} catch { }
window.scrollTo(0, 0);
try { lenis.stop(); } catch { }
document.body.classList.add('is-loading');

/* =========================
   2) Loader 0â†’100 + Circle Reveal
========================= */
const loaderEl = document.getElementById("loader");
const countEl = document.getElementById("loader-count");
const countPrefixEl = document.querySelector(".count-prefix");
const dividerEl = document.querySelector(".loader-divider"); // no longer used (kept for DOM query safety)
const circleEl = document.querySelector(".loader-circle");
const blocks = []; // overlay blocks removed
const heroVideo = document.getElementById("heroVideo");
const heroPoster = document.querySelector(".hero-poster");

// Garantimos que o vÃ­deo NÃƒO inicie antes do loader terminar
if (heroVideo) {
  try {
    heroVideo.muted = true;
    heroVideo.playsInline = true;
    heroVideo.setAttribute("preload", "auto");
    heroVideo.pause();
    // opcional: resetar para o inÃ­cio
    heroVideo.currentTime = 0;
  } catch { }
}

// Estado do contador visual + timeline do loader (mais lenta)
const loaderObj = { n: 0 };
const tlLoader = gsap.timeline({ defaults: { ease: "hop" } });

// Helpers para prÃ©-tocar e esconder poster
let listenersAttached = false;
function hidePoster() {
  if (heroPoster) heroPoster.classList.add("is-hidden");
}
function attachPosterHide() {
  if (!heroVideo || listenersAttached) return;
  listenersAttached = true;
  const onPlay = () => { hidePoster(); cleanup(); };
  const onTime = () => { if (heroVideo.currentTime > 0) { hidePoster(); cleanup(); } };
  const cleanup = () => {
    heroVideo.removeEventListener("playing", onPlay);
    heroVideo.removeEventListener("timeupdate", onTime);
  };
  heroVideo.addEventListener("playing", onPlay, { once: true });
  heroVideo.addEventListener("timeupdate", onTime);
  // Se jÃ¡ estiver tocando, resolve imediatamente
  if (!heroVideo.paused && heroVideo.currentTime > 0) hidePoster();
}
function tryPlay() {
  heroVideo?.play?.().catch(() => { });
}
let preplayTriggered = false;

// preparar mÃ¡scara da gota (centro da tela)
if (loaderEl) {
  loaderEl.style.setProperty("--cx", "50%");
  loaderEl.style.setProperty("--cy", "50%");
  loaderEl.style.setProperty("--r", "0px");
}
// Timeline do loader: mais lenta e sÃ³ entÃ£o comeÃ§amos o vÃ­deo
tlLoader
  // contagem 0 â†’ 100 (mais demorada)
  .to(loaderObj, {
    n: 100,
    duration: 3.4,
    onUpdate: () => {
      const v = Math.round(loaderObj.n);
      if (countEl) countEl.textContent = v;
      if (countPrefixEl) countPrefixEl.style.display = "none";
      // HÃ­brido: dispara o play quando chegar em ~80% do loader (mÃ¡scara ainda cobre)
      if (!preplayTriggered && loaderObj.n >= 90) {
        preplayTriggered = true;
        attachPosterHide();
        tryPlay();
      }
    },
  })
  // esconder o contador antes da gota
  .to(".loader-counter", { autoAlpha: 0, y: -10, duration: 0.32, ease: "power2.in" })
  // gota transparente (mÃ¡scara radial)
  .fromTo(
    { r: 0 },
    { r: 0 },
    {
      r: Math.hypot(window.innerWidth, window.innerHeight),
      duration: 1.1,
      ease: "power3.inOut",
      onUpdate: function () {
        if (loaderEl) loaderEl.style.setProperty("--r", this.targets()[0].r + "px");
      },
    }
  )
  // esconder loader e entÃ£o iniciar o vÃ­deo
  .to(loaderEl, {
    autoAlpha: 0,
    duration: 0.35,
    onComplete: () => {
      if (heroVideo) {
        attachPosterHide();
        tryPlay();
      }
      // libera o scroll apÃ³s o loader
      document.body.classList.remove('is-loading');
      try { lenis.start(); } catch { }
      window.scrollTo(0, 0);
    },
  })
  // configura reveals sÃ³ apÃ³s o loader
  .add(() => {
    // Marca todos os tÃ­tulos para revelar
    try {
      document.querySelectorAll('h1, h2, h3').forEach((el) => el.classList.add('reveal-lines'));
    } catch { }
    setupLineReveals();
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh(true);
    // Animação Osmo para todos os data-split="words" (exceto hero)
    setupOsmoWordsAnimation();
    // Mostrar CTA alinhado ao fim da seção 3D
    try {
      const cta = document.querySelector('.capsule-3d-cta');
      const triggerEl = document.getElementById('capsula-3d');
      if (cta && triggerEl && typeof ScrollTrigger !== 'undefined') {
        // Show the CTA only near the end of the 3D section and keep it visible.
        ScrollTrigger.create({
          trigger: triggerEl,
          // fire when the section's bottom reaches the viewport bottom (end)
          start: 'bottom bottom',
          once: true,
          onEnter: () => {
            cta.classList.add('is-visible');
            cta.classList.add('at-end');
            try { ScrollTrigger.refresh(); } catch (_) {}
          },
          markers: false,
        });
      }
    } catch (e) { console.warn('CTA ScrollTrigger init failed', e); }
  })
  // entrada suave dos elementos do hero (sem filtro pesado no vÃ­deo)
  .from(".nav, .hero .btn", {
    y: -16,
    autoAlpha: 0,
    duration: 0.6,
    ease: "power2.out",
    stagger: 0.08,
  });

/* =========================
   3) Reveals por linha (SplitText)
========================= */
function setupLineReveals(scope = document) {
  if (typeof SplitText === "undefined") return;

  const heroSection = document.getElementById("hero");
  const targets = gsap.utils.toArray(scope.querySelectorAll(".reveal-lines, h1, h2, h3"));
  if (!targets.length) return;

  targets.forEach((el) => {
    const isHero = heroSection && heroSection.contains(el);
    // If this element is explicitly marked for word-level Osmo animation, skip line reveals
    if (!isHero && el.getAttribute("data-split") === "words") return;
    // Avoid double-animating: if we've already revealed it, skip
    if (el.dataset.revealed === 'true') return;

    const split = new SplitText(el, isHero ? {
      type: "lines",
      linesClass: "line"
    } : {
      type: "lines, words",
      mask: "lines",
      linesClass: "line",
      wordsClass: "word"
    });

    if (isHero) {
      gsap.set(split.lines, { yPercent: 110 });

      gsap.to(split.lines, {
        yPercent: 0,
        duration: 1.8,
        ease: "power4.out",
        stagger: 0.15,
        onComplete: () => { split.revert(); el.dataset.revealed = 'true'; }
      });
      return;
    }

    gsap.set(split.words, { yPercent: 110 });

    gsap.to(split.words, {
      yPercent: 0,
      duration: 0.6,
      stagger: 0.06,
      ease: "osmo-ease",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        once: true
      },
      onComplete: () => { split.revert(); el.dataset.revealed = 'true'; }
    });
  });
}

/* =========================
   Scroll Progress (barra + cÃ­rculo) + Voltar ao topo
========================= */
(function scrollProgress() {
  const bar = document.querySelector('.progress-bar');
  const circ = document.querySelector('.progress-circle-bar');
  if (!bar && !circ) return;

  const CIRCUMFERENCE = 2 * Math.PI * 45; // r=45 no SVG

  const update = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const y = lenis?.scroll || window.pageYOffset || document.documentElement.scrollTop || 0;
    const p = docHeight > 0 ? y / docHeight : 0;

    if (bar) bar.style.width = Math.min(100, Math.max(0, p * 100)) + '%';
    if (circ) circ.style.strokeDashoffset = CIRCUMFERENCE * (1 - p);
  };

  // Lenis emite evento de scroll; usamos tambÃ©m resize
  lenis.on('scroll', update);
  window.addEventListener('resize', update);

  // init
  update();
})();
// reveals e UI do hero agora sÃ£o iniciados pelo tlLoader acima

/* =========================
   4) SeÃ§Ã£o 3D â€“ cÃ¡psula
========================= */
let THREE_READY = typeof THREE !== "undefined";
let renderer, scene, camera, capsuleGroup, rafId, running = true;
let threeEntered = false;
let gelA, gelB, gelC; // materiais para trocar cores
const threeWrap = document.getElementById("three-container");
// Hover state needs to be shared across animation loops
let hover = { x: 0, y: 0 };

// Intensidades do movimento
const THREE_CONFIG = {
  baseRotSpeed: 0.006,     // velocidade de rotaÃ§Ã£o contÃ­nua
  floatAmp: 0.18,          // amplitude de flutuaÃ§Ã£o
  tiltLerp: 0.18,          // rapidez com que segue o mouse
  tiltRangeX: 0.6,         // quanto inclina no eixo Z (mapeado do mouse X)
  tiltRangeY: 0.5,         // quanto inclina no eixo X (mapeado do mouse Y)
};

// Modelos por tema (se um arquivo nÃ£o existir, cai em fallback ou no modelo default)
const MODELS = {
  aqua: "assets/models/compressed_1758509853615_aqua.glb",
  citrus: "assets/models/compressed_1758509855927_citrus.glb",
};
let currentTheme3D = "citrus";
let currentModelKey = null; // 'theme:url'
let pendingThemeForModel = null;

const COLORS = {
  // Aqua Blu: #083DA6 (dark), #076DF2 (brand), #0C87F2 (secondary), #1DDDF2 (accent)
  aqua: { a: 0x076DF2, b: 0x0C87F2, c: 0x1DDDF2 },
  // Citrus Lush: #5FD97E (brand), #91D9A3 (secondary), #167312 (dark), #D7D9D2 (accent-neutral)
  citrus: { a: 0x5FD97E, b: 0x91D9A3, c: 0xD7D9D2 },
};

function initThree() {
  if (!THREE_READY) return;
  if (!threeWrap) return;

  scene = new THREE.Scene();
  scene.background = null;

  const w = threeWrap.clientWidth;
  const h = threeWrap.clientHeight;

  // Force minimum dimensions if container is too small
  const finalW = Math.max(w, 400);
  const finalH = Math.max(h, 300);

  camera = new THREE.PerspectiveCamera(45, finalW / finalH, 0.1, 100);
  camera.position.set(0, 0, 4.2);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 1.75));
  renderer.setSize(finalW, finalH);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  threeWrap.appendChild(renderer.domElement);

  // luzes
  const amb = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(amb);

  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(3, 4, 2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.8);
  fill.position.set(-3, -1, 3);
  scene.add(fill);

  // grupo base
  capsuleGroup = new THREE.Group();
  scene.add(capsuleGroup);

  // Se apÃ³s um tempo razoÃ¡vel ainda nÃ£o hÃ¡ objeto, cria fallback e inicia animaÃ§Ã£o
  setTimeout(() => {
    if (capsuleGroup.children.length === 0) {
      console.warn("Nenhum objeto 3D carregado atÃ© agora. Inserindo fallback...");
      createFallbackModel(currentTheme3D);
      ensureEnter3D();
    }
  }, 1200);

  // carrega o modelo do tema atual (ou pendente)
  const themeToLoad = pendingThemeForModel || currentTheme3D;
  swapModel(themeToLoad);
  // Inicia animaÃ§Ã£o de scroll assim que o modelo for carregado
  start3DScrollAnimation();
  window.addEventListener("resize", onResizeThree);
}

function enter3D() {
  // animaÃ§Ã£o de entrada
  capsuleGroup.scale.set(0, 0, 0);
  gsap.to(capsuleGroup.scale, { x: 1, y: 1, z: 1, duration: 1, ease: "power2.out", delay: 0.1 });

  // pin da seÃ§Ã£o 3D (temporariamente desabilitado para testar scroll)
  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.create({
      trigger: "#capsula-3d",
      start: "top top",
      end: "+=100%",
      pin: false, // Desabilitado temporariamente
      scrub: false,
    });
  }

  // flutuaÃ§Ã£o + rotaÃ§Ã£o
  const state = { t: 0 };

  function animate() {
    if (!running) { rafId = null; return; }
    state.t += 0.016;
    const floatY = Math.sin(state.t * 1.6) * THREE_CONFIG.floatAmp;
    capsuleGroup.position.y = floatY;

    // rotaÃ§Ã£o contÃ­nua leve + tilt do mouse
    capsuleGroup.rotation.y += THREE_CONFIG.baseRotSpeed;
    capsuleGroup.rotation.x += (hover.y - capsuleGroup.rotation.x) * THREE_CONFIG.tiltLerp;
    capsuleGroup.rotation.z += (hover.x - capsuleGroup.rotation.z) * THREE_CONFIG.tiltLerp;

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  }
  animate();

  // mouse tilt
  threeWrap.addEventListener("mousemove", (e) => {
    const r = threeWrap.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    hover.x = (nx - 0.5) * THREE_CONFIG.tiltRangeX;
    hover.y = (0.5 - ny) * THREE_CONFIG.tiltRangeY;
  });

  // pausa quando fora de viewport (economia)
  const io = new IntersectionObserver(
    (ents) => ents.forEach((en) => {
      const wasRunning = running;
      running = en.isIntersecting;
      if (running && !rafId) {
        rafId = requestAnimationFrame(animate);
      }
    }),
    { threshold: 0.05 }
  );
  io.observe(threeWrap);
}

// ========== 3D Scroll Down Effect ==========
// Faz o objeto 3D descer conforme o scroll na seÃ§Ã£o 3D
function animateWithScroll() {
  if (!running || !capsuleGroup) { rafId = null; return; }
  // Pega o topo e altura da seÃ§Ã£o 3D
  const section = document.getElementById('capsula-3d');
  if (!section) { rafId = null; return; }
  const sectionRect = section.getBoundingClientRect();
  const sectionTop = window.scrollY + sectionRect.top;
  const sectionHeight = section.offsetHeight;
  const winH = window.innerHeight;
  // Progresso do scroll dentro da seÃ§Ã£o (0 = topo, 1 = final)
  const scrollY = window.scrollY || window.pageYOffset;
  const progress = clamp((scrollY - sectionTop) / (sectionHeight - winH), 0, 1);
  // PosiÃ§Ã£o Y inicial e final (ajuste conforme necessÃ¡rio)
  const yStart = 0.0;
  const yEnd = -10.5; // quanto mais negativo, mais desce
  capsuleGroup.position.y = yStart + (yEnd - yStart) * progress;
  // MantÃ©m rotaÃ§Ã£o e tilt
  capsuleGroup.rotation.y += THREE_CONFIG.baseRotSpeed;
  capsuleGroup.rotation.x += (hover.y - capsuleGroup.rotation.x) * THREE_CONFIG.tiltLerp;
  capsuleGroup.rotation.z += (hover.x - capsuleGroup.rotation.z) * THREE_CONFIG.tiltLerp;
  renderer.render(scene, camera);
  rafId = requestAnimationFrame(animateWithScroll);
}
// Substitui o animate padrÃ£o por esse apÃ³s o modelo estar pronto
rafId = requestAnimationFrame(animateWithScroll);

function ensureEnter3D() {
  if (threeEntered) return;
  threeEntered = true;
  enter3D();
}

function onResizeThree() {
  if (!renderer || !camera) return;
  const w = Math.max(threeWrap.clientWidth, 400);
  const h = Math.max(threeWrap.clientHeight, 300);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

/* =========================
   Decorative rising bubbles (capsule -> hero)
   Creates subtle, looping floating bubbles that rise from the 3D section toward the hero.
   Uses GSAP for timing so it plays well with Lenis.
========================= */
function initCapsuleBubbles() {
  const container = document.querySelector('.capsule-bubbles');
  const section = document.getElementById('capsula-3d');
  if (!container || !section || typeof gsap === 'undefined') return;

  // Clean existing
  container.innerHTML = '';

  const max = 14; // number of bubbles
  const w = section.clientWidth;
  const h = section.clientHeight;

  for (let i = 0; i < max; i++) {
    const el = document.createElement('div');
    el.className = 'bubble';
    // random size class
    const r = Math.random();
    if (r > 0.85) el.classList.add('large');
    else if (r < 0.25) el.classList.add('small');

    // random start x within left half of the section (near the 3D object)
    const startX = Math.round(w * (0.18 + Math.random() * 0.24));
    // start near middle-bottom of section
    const startY = Math.round(h * (0.45 + Math.random() * 0.45));

    el.style.left = startX + 'px';
    el.style.top = startY + 'px';
    container.appendChild(el);

    // animate up past the top of the section and fade
    const travel = startY + (h * 1.2);
    const dur = 10 + Math.random() * 10;
    const delay = Math.random() * 6;

    gsap.fromTo(el, { y: 0, opacity: 0.85, scale: 0.9 }, {
      y: -travel,
      opacity: 0.05,
      scale: 1.05,
      ease: 'sine.out',
      duration: dur,
      delay: delay,
      repeat: -1,
      repeatDelay: 4 + Math.random() * 4,
      repeatRefresh: true
    });
  }
}

// init once three container exists; refresh on resize
document.addEventListener('DOMContentLoaded', () => {
  initCapsuleBubbles();
});
window.addEventListener('resize', () => {
  try { initCapsuleBubbles(); } catch (e) { }
});

// Lazy-init Three.js: sÃ³ quando a seÃ§Ã£o 3D entrar na viewport
(function lazyInitThree() {
  const target = document.getElementById("capsula-3d");
  if (!target) return;

  const triggerInit = () => {
    if (renderer) return; // jÃ¡ iniciado
    const ensure = () => {
      if (!THREE_READY && typeof THREE !== "undefined") THREE_READY = true;
      if (THREE_READY) {
        initThree();
        io && io.disconnect();
      } else {
        setTimeout(ensure, 100);
      }
    };
    ensure();
  };

  // Usa IntersectionObserver para nÃ£o depender do ScrollTrigger aqui
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) triggerInit();
    });
  }, { threshold: 0.15 });
  io.observe(target);

  // Se preferir, tambÃ©m inicia ao tocar na Ã¢ncora via hash
  window.addEventListener("hashchange", () => {
    if (location.hash === "#capsula-3d") triggerInit();
  });
})();

// Fallback simples caso o GLB nÃ£o carregue
function createFallbackModel(theme = "aqua") {
  if (!capsuleGroup || !THREE_READY) return;
  const isCitrus = theme === "citrus";
  const geo = isCitrus
    ? new THREE.TorusKnotGeometry(0.8, 0.24, 180, 16)
    : new THREE.IcosahedronGeometry(1, 2);
  const mat = new THREE.MeshStandardMaterial({ color: isCitrus ? 0x5FD97E : 0x076DF2, roughness: 0.35, metalness: 0.05 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.isFallback = true;
  capsuleGroup.add(mesh);
}

// Troca o modelo conforme o tema
function swapModel(theme = "aqua") {
  currentTheme3D = theme;
  if (!THREE_READY || !capsuleGroup) { pendingThemeForModel = theme; return; }

  const url = MODELS[theme] || MODELS.aqua;
  const key = `${theme}:${url}`;
  if (currentModelKey === key) return; // jÃ¡ estÃ¡ carregado

  const loader = new THREE.GLTFLoader();
  if (THREE.DRACOLoader) {
    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(dracoLoader);
  }

  // efeito sutil de troca
  gsap.fromTo(capsuleGroup.scale, { x: 1, y: 1, z: 1 }, { x: 0.92, y: 0.92, z: 0.92, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.inOut" });

  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene || gltf.scenes?.[0];
      if (!model) {
        console.warn("GLB sem scene para o tema:", theme, "â€” usando fallback");
        clearNonFallbackChildren();
        createFallbackModel(theme);
        ensureEnter3D();
        currentModelKey = key;
        bindGelMaterials(null);
        return;
      }

      normalizeAndAddModel(model);
      currentModelKey = key;
      ensureEnter3D();
    },
    undefined,
    (err) => {
      console.warn("Falha ao carregar modelo do tema", theme, url, err);
      clearNonFallbackChildren();
      createFallbackModel(theme);
      ensureEnter3D();
      currentModelKey = key;
      bindGelMaterials(null);
    }
  );
}

function normalizeAndAddModel(model) {
  // Remove fallbacks e anteriores
  clearNonFallbackChildren();

  // Centraliza e normaliza escala
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const target = 1.8;
  model.scale.setScalar(target / maxDim);

  // Materiais visÃ­veis
  model.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = o.receiveShadow = false;
      if (o.material) {
        if ("transparent" in o.material) o.material.transparent = true;
        if ("roughness" in o.material) o.material.roughness = 0.35;
        if ("metalness" in o.material) o.material.metalness = 0.05;
      }
    }
  });

  capsuleGroup.add(model);
  bindGelMaterials(model);
}

function bindGelMaterials(model) {
  if (!model) { gelA = gelB = gelC = null; return; }
  // Tenta capturar atÃ© 3 materiais principais
  const mats = [];
  model.traverse((o) => { if (o.isMesh && o.material) mats.push(o.material); });
  gelA = mats[0] || null;
  gelB = mats[1] || gelA;
  gelC = mats[2] || gelA;
}

function clearNonFallbackChildren() {
  const toRemove = capsuleGroup.children.filter((c) => !c.userData?.isFallback);
  toRemove.forEach((obj) => capsuleGroup.remove(obj));
}

/* =========================
   5) Fragrance Toggle (tema + materiais)
========================= */
const toggleBtns = gsap.utils.toArray(".fragrance-toggle .toggle-option");
function setTheme(theme) {
  document.body.classList.toggle("theme-citrus", theme === "citrus");
  document.body.classList.toggle("theme-aqua", theme === "aqua");

  const pal = theme === "citrus" ? COLORS.citrus : COLORS.aqua;

  if (gelA && gelB && gelC) {
    const toCol = (mat, hex) => {
      const c = new THREE.Color(hex);
      gsap.to(mat.color, { r: c.r, g: c.g, b: c.b, duration: 0.6, ease: "power2.out" });
    };
    toCol(gelA, pal.a);
    toCol(gelB, pal.b);
    toCol(gelC, pal.c);

    gsap.fromTo(
      capsuleGroup.scale,
      { x: 1, y: 1, z: 1 },
      { x: 1.04, y: 1.04, z: 1.04, yoyo: true, repeat: 1, duration: 0.18, ease: "power2.inOut" }
    );
  }

  // Troca o modelo 3D para o tema
  swapModel(theme);
}
toggleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("is-active")) return;
    toggleBtns.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const theme = btn.dataset.theme === "citrus" ? "citrus" : "aqua";
    setTheme(theme);
  });
});

/* =========================
   6) Micro interaÃ§Ãµes listas/cards
========================= */
gsap.utils.toArray(".benefit-item, .fragrance-card, .product-card, .badges li, .testimonial").forEach((el) => {
  gsap.from(el, {
    y: 20,
    autoAlpha: 0,
    duration: 0.8,
    ease: "power2.out",
    scrollTrigger: {
      trigger: el,
      start: "top 85%",
      once: true,
    },
  });
});

/* =========================
   7) Comprar (placeholder)
========================= */
document.querySelectorAll('[data-action="buy"]').forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".product-card");
    const sku = card?.dataset?.sku || "sopy";
    // aqui vocÃª integra com carrinho/Nuvemshop ou redireciona:
    console.log("Comprar SKU:", sku);
    gsap.fromTo(btn, { scale: 1 }, { scale: 0.96, yoyo: true, repeat: 1, duration: 0.12 });
  });
});

/* =========================
   8) Cursor opcional no hero
========================= */
const cursor = document.querySelector(".cursor");
if (cursor) {
  let mx = 0, my = 0; // mouse position
  let cx = 0, cy = 0; // cursor position for smoothing
  let raf;

  const update = () => {
    cx += (mx - cx) * 0.25;
    cy += (my - cy) * 0.25;
    cursor.style.left = cx + "px";
    cursor.style.top = cy + "px";
    raf = requestAnimationFrame(update);
  };

  const show = () => gsap.to(cursor, { autoAlpha: 1, duration: 0.15 });
  const hide = () => gsap.to(cursor, { autoAlpha: 0, duration: 0.15 });

  // Aparece em todo o documento, usando pointermove para melhor compatibilidade com touch/pen
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType === 'touch') return; // não mostra cursor em touch
    mx = e.clientX;
    my = e.clientY;
    if (!raf) raf = requestAnimationFrame(update);
    show();
  }, { passive: true });

  // Esconde quando a aba perde foco (melhor que mouseleave em alguns browsers)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hide(); cancelAnimationFrame(raf); raf = null; }
  });

  // magnet nos botões: leve escala
  gsap.utils.toArray(".btn, a, button").forEach((el) => {
    el.addEventListener("mouseenter", () => gsap.to(cursor, { scale: 1.25, duration: 0.15 }));
    el.addEventListener("mouseleave", () => gsap.to(cursor, { scale: 1, duration: 0.15 }));
  });
}

/* =========================
   9) Safety: inicia tema default
========================= */
document.body.classList.add("theme-citrus");

/* =========================
   Header: aparece no inÃ­cio e ao rolar pra cima; some ao rolar pra baixo
========================= */
(function autoHideHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const showNav = () => document.body.classList.remove('nav-hidden');
  const hideNav = () => document.body.classList.add('nav-hidden');

  // VisÃ­vel no inÃ­cio (hero aberto)
  showNav();

  let lastY = 0;
  // Usamos o Lenis para obter a posiÃ§Ã£o de scroll suavizada
  lenis.on('scroll', (e) => {
    const y = e.scroll;
    // Sempre mostrar no topo da pÃ¡gina
    if (y <= 10) { showNav(); lastY = y; return; }

    const goingDown = y > lastY;
    if (goingDown) hideNav(); else showNav();
    lastY = y;
  });
})();

// Substitui o animate padrÃ£o por animateWithScroll assim que o modelo 3D estiver carregado
function start3DScrollAnimation() {
  running = true;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(animateWithScroll);
}
// Chame start3DScrollAnimation() apÃ³s o modelo ser carregado ou fallback criado
// Exemplo: apÃ³s swapModel ou createFallbackModel, chame start3DScrollAnimation();
window.start3DScrollAnimation = start3DScrollAnimation; // para debug

/* =========================
   FAQ accordion JS helper
   Ensures only one accordion has the open animation by toggling .is-open
   and keeps the URL hash in sync so :target-based styles still work.
========================= */
(function faqAccordionManager() {
  const wrapper = document.querySelector('.faq-accordion');
  if (!wrapper) return;

  const accordions = Array.from(wrapper.querySelectorAll('.accordion'));
  if (!accordions.length) return;

  function closeAll() {
    accordions.forEach(a => a.classList.remove('is-open'));
  }

  accordions.forEach((acc) => {
    // clickable title anchor inside each accordion
    const titleLink = acc.querySelector('.title a');
    if (!titleLink) return;

    titleLink.addEventListener('click', (ev) => {
      // prevent default navigation so we control hash update consistently
      ev.preventDefault();
      const isOpen = acc.classList.contains('is-open');

      // close others and toggle this one
      closeAll();
      if (!isOpen) acc.classList.add('is-open');

      // update hash if the accordion has an id (keeps :target consistent)
      if (acc.id) {
        try { history.replaceState(null, '', '#' + acc.id); } catch (_) { location.hash = acc.id; }
      }
    });
  });

  // Keep UI in sync with back/forward navigation (hashchange)
  window.addEventListener('hashchange', () => {
    const id = location.hash ? location.hash.slice(1) : '';
    closeAll();
    if (id) {
      const found = wrapper.querySelector('#' + CSS.escape(id));
      if (found) found.classList.add('is-open');
    }
  });

  // initialize from existing hash
  if (location.hash) {
    const id = location.hash.slice(1);
    const found = wrapper.querySelector('#' + CSS.escape(id));
    if (found) found.classList.add('is-open');
  }
})();

