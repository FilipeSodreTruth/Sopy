// Pin de 1 segundo ao final da seção 3D
document.addEventListener('DOMContentLoaded', () => {
  if (typeof ScrollTrigger !== 'undefined' && document.getElementById('capsula-3d')) {
    ScrollTrigger.create({
      trigger: '#capsula-3d',
      start: 'bottom bottom',
      end: '+=1', // 1px de pin, mas controlado pelo onEnter/onLeave
      pin: true,
      pinSpacing: true,
      scrub: false,
      onEnter: self => {
        // trava por 1s ao chegar no final
        setTimeout(() => self.disable(), 1000);
      },
    });
  }
});
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

/* (removido) setupOsmoWordsAnimation em favor de initMaskedTextRevealGlobal */

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
    // Inicia apenas o Osmo Masked Reveal global (exceto hero)
  // animações de texto removidas globalmente por solicitação
  if (typeof ScrollTrigger !== "undefined") try { ScrollTrigger.refresh(true); } catch {}
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

  // Define orientação inicial deitada
  capsuleGroup.rotation.set(Math.PI / 2, 0, 0); // deitado horizontal

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
  // Pega uma área maior que inclui a div intermediária antes da seção 3D
  const section = document.getElementById('capsula-3d');
  if (!section) { rafId = null; return; }
  const sectionRect = section.getBoundingClientRect();
  const sectionTop = window.scrollY + sectionRect.top;
  const sectionHeight = section.offsetHeight;
  const winH = window.innerHeight;
  
  // Expande a área de trigger para começar mais cedo (na div intermediária)
  const expandedStart = sectionTop - winH; // Começa 1 viewport antes da seção 3D
  const expandedHeight = sectionHeight + winH; // Área total expandida
  
  // Progresso baseado na área expandida
  const scrollY = window.scrollY || window.pageYOffset;
  const progress = clamp((scrollY - expandedStart) / expandedHeight, 0, 1);
  
  // Posição Y inicial alta (para começar na div intermediária) e final normal
  const yStart = 15.0; // Bem alto para começar na div intermediária
  const yEnd = -10.5; // Mantém o mesmo ponto final
  capsuleGroup.position.y = yStart + (yEnd - yStart) * progress;
  
  // Rotação controlada pelo scroll: começa deitado, termina em pé
  const rotStart = { x: Math.PI / 2, y: 0, z: 0 }; // deitado horizontal
  const rotEnd = { x: 0, y: 0, z: 0 }; // em pé vertical
  
  capsuleGroup.rotation.x = rotStart.x + (rotEnd.x - rotStart.x) * progress;
  capsuleGroup.rotation.y = rotStart.y + (rotEnd.y - rotStart.y) * progress;
  capsuleGroup.rotation.z = rotStart.z + (rotEnd.z - rotStart.z) * progress;
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
   3D Interactive Bubbles with Explosion Effects
   Creates realistic floating bubbles with click interactions and particle explosions.
   Uses Three.js with HDRI lighting for photorealistic materials.
========================= */
function initCapsuleBubbles() {
  const container = document.querySelector('.capsule-bubbles');
  if (!container || typeof THREE === 'undefined') return;

  // Evita inicialização múltipla
  if (container.__bubblesInitialized) return;
  container.__bubblesInitialized = true;

  // --- CONFIGURAÇÃO BÁSICA ---
  const scene = new THREE.Scene();
  // mantém o fundo transparente para integrar com a seção
  scene.background = null;
  const rect = container.getBoundingClientRect();
  const camera = new THREE.PerspectiveCamera(75, rect.width / Math.max(1, rect.height), 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(rect.width, Math.max(1, rect.height));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.8; // Aumenta um pouco mais a exposição
  // insere o canvas dentro do container para respeitar stacking e clipping
  container.appendChild(renderer.domElement);
  // garante preenchimento do container
  Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });

  // --- ILUMINAÇÃO E AMBIENTE (HDRI) ---
  let envMap;
  const rgbeLoader = THREE.RGBELoader ? new THREE.RGBELoader() : null;
  let hdrLoaded = false;
  if (rgbeLoader) {
    rgbeLoader
      .setPath('https://threejs.org/examples/textures/equirectangular/')
      .load(
        'venice_sunset_1k.hdr',
        function (texture) {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          envMap = texture;
          scene.environment = envMap;
          // Mantém background transparente (sem definir scene.background)
          hdrLoaded = true;
          createInitialBubbles();
        },
        undefined,
        function () {
          // Falha ao carregar HDRI: segue sem envMap
          console.warn('[Bubbles] Falha ao carregar HDRI. Prosseguindo sem environment map.');
          createInitialBubbles();
        }
      );
    // Fallback de tempo: se HDRI demorar, inicia mesmo assim
    setTimeout(() => { if (!hdrLoaded) createInitialBubbles(); }, 2000);
  } else {
    // Sem RGBELoader disponível: segue sem HDRI
    createInitialBubbles();
  }

  // Se o container ainda não tiver tamanho estável, tenta ajustar em seguida
  if (rect.width < 10 || rect.height < 10) {
    requestAnimationFrame(() => {
      const r2 = container.getBoundingClientRect();
      camera.aspect = r2.width / Math.max(1, r2.height);
      camera.updateProjectionMatrix();
      renderer.setSize(r2.width, Math.max(1, r2.height));
    });
  }

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // --- OBJETOS (AS BOLHAS) ---
  const bubbles = [];
  const bubbleCount = 20; // Mais bolhas para preencher mais o espaço
  const bubbleGeometry = new THREE.SphereGeometry(1, 64, 64);

  const bubbleMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xFFFFFF,
    metalness: 0.0,
    roughness: 0.06,
    transmission: 0.55,
    transparent: true,
    opacity: 0.92,
    ior: 1.33,
    envMapIntensity: 2.2,
    thickness: 0.6,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06
  });

  function createBubble() {
    const material = bubbleMaterial.clone();
    if (envMap) {
      material.envMap = envMap;
      material.transmission = 1.0;
      material.opacity = 0.85;
    } else {
      // fallback sem envMap: menos transmissão e mais opacidade
      material.transmission = 0.0;
      material.opacity = 0.35;
      material.roughness = 0.15;
      material.metalness = 0.0;
      material.clearcoat = 0.6;
      material.clearcoatRoughness = 0.2;
    }

    const bubble = new THREE.Mesh(bubbleGeometry, material);

  bubble.position.x = THREE.MathUtils.randFloatSpread(40); // ~[-20,20]
  bubble.position.y = THREE.MathUtils.randFloat(-25, -15); // começa visível na parte inferior
  bubble.position.z = THREE.MathUtils.randFloatSpread(10); // ~[-5,5]

    const scale = THREE.MathUtils.randFloat(0.4, 2.0); // Ainda mais variação no tamanho
    bubble.scale.set(scale, scale, scale);

    bubble.userData = {
      speed: THREE.MathUtils.randFloat(0.05, 0.15),
      // Movimento lateral mais natural
      amplitudeX: THREE.MathUtils.randFloat(1, 4), // Amplitude da oscilação (1 a 4 unidades)
      frequencyX: THREE.MathUtils.randFloat(0.5, 1.5), // Frequência da oscilação (mais lento/rápido)
      oscillationOffset: Math.random() * Math.PI * 2,
      originalX: bubble.position.x // Guarda a posição X inicial
    };
    
    scene.add(bubble);
    bubbles.push(bubble);
  }

  function createInitialBubbles() {
    for (let i = 0; i < bubbleCount; i++) {
      createBubble();
    }
    animate();
  }

  // --- INTERAÇÃO (CLIQUE E EXPLOSÃO) ---

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let particleSystems = []; // Renomeado para evitar conflito e ser mais descritivo

  const particleTexture = new THREE.CanvasTexture(generateParticleTexture());

  function generateParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; // Maior resolução para partículas
    canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.7)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function onMouseClick(event) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    mouse.x = (x / rect.width) * 2 - 1;
    mouse.y = -(y / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(bubbles);

    if (intersects.length > 0) {
      const clickedBubble = intersects[0].object;
      
      createExplosion(clickedBubble.position, clickedBubble.scale.x);
      
      scene.remove(clickedBubble);
      bubbles.splice(bubbles.indexOf(clickedBubble), 1);
      
      setTimeout(createBubble, 500); 
    }
  }

  container.addEventListener('click', onMouseClick);

  function createExplosion(position, bubbleScale) {
    const particleCount = 30; // Mais partículas para uma explosão mais densa
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.3 * bubbleScale, // Tamanho base da partícula
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true // Habilita cores por vértice para controlar a cor individualmente
    });

    const particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    const lives = []; // Vida atual
    const maxLives = []; // Vida máxima (para variar a duração)
    const colors = []; // Cores das partículas
    const sizes = []; // Tamanhos individuais das partículas

    const baseColor = new THREE.Color(0xADD8E6); // Cor base da bolha
    const white = new THREE.Color(0xFFFFFF);

    for (let i = 0; i < particleCount; i++) {
      positions.push(position.x, position.y, position.z);
      
      const speed = THREE.MathUtils.randFloat(0.3, 0.8) * bubbleScale; // Velocidade inicial mais alta
      velocities.push(
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed
      );

      const life = THREE.MathUtils.randFloat(0.8, 1.5); // Vida útil mais variada
      lives.push(life);
      maxLives.push(life);

      // Cor: Começa branco e transiciona para a cor da bolha ou levemente azul
      const particleColor = baseColor.clone().lerp(white, THREE.MathUtils.randFloat(0.2, 0.8));
      colors.push(particleColor.r, particleColor.g, particleColor.b);

      sizes.push(THREE.MathUtils.randFloat(0.5, 1.5) * particleMaterial.size); // Tamanho individual
    }

    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particleGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
    particleGeometry.setAttribute('life', new THREE.Float32BufferAttribute(lives, 1));
    particleGeometry.setAttribute('maxLife', new THREE.Float32BufferAttribute(maxLives, 1));
    particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1)); // Adiciona atributo de tamanho

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    particleSystems.push(particleSystem);
  }

  // --- ANIMAÇÃO ---

  const clock = new THREE.Clock();
  const gravity = new THREE.Vector3(0, -0.05, 0); // Leve gravidade para as partículas (simulando bolhas subindo mais devagar)

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Tempo desde o último quadro

    // Animação das bolhas
    bubbles.forEach(bubble => {
      // Sobe a bolha
      bubble.position.y += bubble.userData.speed * delta * 60;

      // Oscilação lateral mais controlada e natural
      const time = performance.now() * 0.001; // Tempo em segundos
      bubble.position.x = bubble.userData.originalX + Math.sin(time * bubble.userData.frequencyX + bubble.userData.oscillationOffset) * bubble.userData.amplitudeX;


      if (bubble.position.y > 25) {
        bubble.position.y = -25;
        bubble.position.x = THREE.MathUtils.randFloatSpread(40);
        bubble.userData.originalX = bubble.position.x;
        bubble.userData.oscillationOffset = Math.random() * Math.PI * 2;
      }
    });

    // Animação das partículas de explosão
    particleSystems.forEach((system, systemIndex) => {
      const positions = system.geometry.attributes.position.array;
      const velocities = system.geometry.attributes.velocity.array;
      const lives = system.geometry.attributes.life.array;
      const maxLives = system.geometry.attributes.maxLife.array;
      const colors = system.geometry.attributes.color.array;
      const sizes = system.geometry.attributes.size.array; // Pega o atributo de tamanho individual

      let allParticlesDead = true;

      for (let i = 0; i < positions.length; i += 3) {
        const particleIndex = i / 3;

        lives[particleIndex] -= delta; // Diminui a vida com base no tempo real

        if (lives[particleIndex] > 0) {
          allParticlesDead = false;

          // Atualiza velocidade com gravidade (ou flutuabilidade oposta)
          // Para bolhas, a "gravidade" real seria para cima. Vamos simular uma leve desaceleração.
          // velocities[i+1] += gravity.y * delta; // Se quiser que as partículas "caiam"

          // Move a partícula
          positions[i] += velocities[i] * delta * 60;
          positions[i + 1] += velocities[i + 1] * delta * 60;
          positions[i + 2] += velocities[i + 2] * delta * 60;

          // Fade out (opacidade e cor)
          const lifeRatio = lives[particleIndex] / maxLives[particleIndex];
          system.material.opacity = Math.max(0, lifeRatio); // Opacidade baseada na vida

          // A cor também faz fade-out (escurecendo ou ficando transparente)
          const initialColor = new THREE.Color(colors[i], colors[i+1], colors[i+2]);
          const finalColor = new THREE.Color(0x000000); // Para onde a cor irá (preto ou transparente)
          initialColor.lerp(finalColor, 1 - lifeRatio);
          system.geometry.attributes.color.setXYZ(particleIndex, initialColor.r, initialColor.g, initialColor.b);

          // Ajusta o tamanho da partícula (encolhe)
          // system.material.size = sizes[particleIndex] * Math.pow(lifeRatio, 0.5); // Encolhe gradualmente
          // Nota: Para Three.Points, `material.size` afeta todas as partículas. Para tamanhos individuais, precisa de um shader personalizado.
          // Por enquanto, vamos deixar `material.size` fixo para o sistema e controlar a opacidade.
          // Se quisermos tamanhos individuais em PointsMaterial, precisamos de um shader customizado (mais complexo).
        } else {
          positions[i] = positions[i + 1] = positions[i + 2] = 10000; // Move para fora da vista
        }
      }

      system.geometry.attributes.position.needsUpdate = true;
      system.geometry.attributes.life.needsUpdate = true;
      system.geometry.attributes.color.needsUpdate = true; // Atualiza as cores

      if (allParticlesDead) {
        scene.remove(system);
        particleSystems.splice(systemIndex, 1);
      }
    });

    renderer.render(scene, camera);
  }

  // --- RESPONSIVIDADE ---
  function onWindowResize() {
    const r = container.getBoundingClientRect();
    camera.aspect = r.width / Math.max(1, r.height);
    camera.updateProjectionMatrix();
    renderer.setSize(r.width, Math.max(1, r.height));
  }
  window.addEventListener('resize', onWindowResize);
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
  
  // SEMPRE força a rotação inicial deitada no fallback também
  capsuleGroup.rotation.set(Math.PI / 2, 0, 0);
  capsuleGroup.position.y = 15.0;
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
  
  // SEMPRE força a rotação inicial deitada após adicionar qualquer modelo
  capsuleGroup.rotation.set(Math.PI / 2, 0, 0);
  capsuleGroup.position.y = 100.0; // Posição inicial alta
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



// Init on load (after a short delay so layout for sticky/100vh is settled)
window.addEventListener('load', () => { setTimeout(initSectionDots, 160); });

// Also re-init when resizing or when DOM changes that may affect sections
window.addEventListener('resize', () => { setTimeout(initSectionDots, 220); });

// If content is updated dynamically, you can call initSectionDots() manually later

