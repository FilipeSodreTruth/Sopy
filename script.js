/* -------------------------------------------------------
   Sopy Landing – script.js
   - Mantém Loader/Lenis/GSAP como no seu setup
   - 3D inicia em #capsula-3d e, ao sair, navega entre seções
   - Canvas é reparentado para overlay fixo quando preciso
   - Bolhas d’água leves em seções marcadas
------------------------------------------------------- */

/* =========================
   0) Utils
========================= */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const isThreeReady = () => typeof window.THREE !== "undefined";

/* =========================
  1) GSAP Setup + Lenis
========================= */
const _plugins = [ScrollTrigger, CustomEase];
if (typeof SplitText !== "undefined") _plugins.push(SplitText);
gsap.registerPlugin(..._plugins);
CustomEase.create("hop", "0.9,0,0.1,1");

const lenis = new Lenis({ duration: 1.2, smoothWheel: true, smoothTouch: false, lerp: 0.1 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* =========================
   2) Loader 0→100 + Circle Reveal
========================= */
const loaderEl = document.getElementById("loader");
const countEl = document.getElementById("loader-count");
const countPrefixEl = document.querySelector(".count-prefix");
const heroVideo = document.getElementById("heroVideo");
const heroPoster = document.querySelector(".hero-poster");

if (heroVideo) {
    try {
        heroVideo.muted = true;
        heroVideo.playsInline = true;
        heroVideo.setAttribute("preload", "auto");
        heroVideo.pause();
        heroVideo.currentTime = 0;
    } catch { }
}

const loaderObj = { n: 0 };
const tlLoader = gsap.timeline({ defaults: { ease: "hop" } });

let listenersAttached = false;
function hidePoster() { heroPoster && heroPoster.classList.add("is-hidden"); }
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
    if (!heroVideo.paused && heroVideo.currentTime > 0) hidePoster();
}
function tryPlay() { heroVideo?.play?.().catch(() => { }); }

if (loaderEl) {
    loaderEl.style.setProperty("--cx", "50%");
    loaderEl.style.setProperty("--cy", "50%");
    loaderEl.style.setProperty("--r", "0px");
}

tlLoader
    .to(loaderObj, {
        n: 100, duration: 3.4,
        onUpdate: () => {
            const v = Math.round(loaderObj.n);
            if (countEl) countEl.textContent = v;
            if (countPrefixEl) countPrefixEl.style.display = "none";
            if (loaderObj.n >= 90) { attachPosterHide(); tryPlay(); }
        },
    })
    .to(".loader-counter", { autoAlpha: 0, y: -10, duration: 0.32, ease: "power2.in" })
    .fromTo({ r: 0 }, { r: 0 }, {
        r: Math.hypot(window.innerWidth, window.innerHeight),
        duration: 1.1, ease: "power3.inOut",
        onUpdate: function () { loaderEl && loaderEl.style.setProperty("--r", this.targets()[0].r + "px"); }
    })
    .to(loaderEl, { autoAlpha: 0, duration: 0.35, onComplete: () => { attachPosterHide(); tryPlay(); } })
    .add(() => { setupLineReveals(); ScrollTrigger.refresh(true); })
    .from(".nav, .hero .btn", { y: -16, autoAlpha: 0, duration: 0.6, ease: "power2.out", stagger: 0.08 });

/* =========================
   3) Reveals por linha (SplitText)
========================= */
function setupLineReveals(scope = document) {
    const targets = gsap.utils.toArray(scope.querySelectorAll(".reveal-lines"));
    const hasSplit = typeof SplitText !== "undefined";

    targets.forEach((el) => {
        const isHeroH1 = el.tagName === "H1" && el.closest("#hero");
        if (hasSplit && isHeroH1) {
            const split = new SplitText(el, { type: "lines", linesClass: "line" });
            gsap.set(split.lines, { yPercent: 110 });
            gsap.to(split.lines, {
                yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.08,
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
                onComplete: () => split.revert(),
            });
        } else {
            gsap.fromTo(el, { yPercent: 16, autoAlpha: 0 }, {
                yPercent: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out",
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
            });
        }
    });
}

/* =========================
   Scroll Progress + Voltar ao topo
========================= */
(function scrollProgress() {
    const bar = document.querySelector('.progress-bar');
    const circ = document.querySelector('.progress-circle-bar');
    const toTop = document.querySelector('.scroll-to-top');
    if (!bar && !circ && !toTop) return;
    const CIRCUMFERENCE = 2 * Math.PI * 45;

    const update = () => {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const y = lenis?.scroll || window.pageYOffset || document.documentElement.scrollTop || 0;
        const p = docH > 0 ? y / docH : 0;
        if (bar) bar.style.width = Math.min(100, Math.max(0, p * 100)) + '%';
        if (circ) circ.style.strokeDashoffset = CIRCUMFERENCE * (1 - p);
        if (toTop) toTop.style.opacity = p >= 0.98 ? '1' : '0';
    };
    lenis.on('scroll', update);
    window.addEventListener('resize', update);
    toTop?.addEventListener('click', () => lenis.scrollTo(0, { duration: 1 }));
    update();
})();




/* =========================
   5) Fragrance Toggle (cores do material)
========================= */
const COLORS = {
    aqua: { a: 0x29AAE1, b: 0x0B63CE, c: 0xffffff },
    citrus: { a: 0x24C066, b: 0x128A3A, c: 0xffffff },
};
const toggleBtns = gsap.utils.toArray(".fragrance-toggle .toggle-option");
function setTheme(theme) {
    document.body.classList.toggle("theme-citrus", theme === "citrus");
    document.body.classList.toggle("theme-aqua", theme === "aqua");
    const pal = theme === "citrus" ? COLORS.citrus : COLORS.aqua;

    if (gelA && gelB && gelC && THREE?.Color) {
        const toCol = (mat, hex) => {
            const c = new THREE.Color(hex);
            gsap.to(mat.color, { r: c.r, g: c.g, b: c.b, duration: 0.6, ease: "power2.out", onUpdate: render3D });
        };
        toCol(gelA, pal.a); toCol(gelB, pal.b); toCol(gelC, pal.c);
        gsap.fromTo(capsuleGroup.scale, { x: capsuleGroup.scale.x, y: capsuleGroup.scale.y, z: capsuleGroup.scale.z },
            { x: capsuleGroup.scale.x * 1.04, y: capsuleGroup.scale.y * 1.04, z: capsuleGroup.scale.z * 1.04, yoyo: true, repeat: 1, duration: 0.18, ease: "power2.inOut", onUpdate: render3D });
    }
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
   6) Micro interações listas/cards
========================= */
gsap.utils.toArray(".benefit-item, .fragrance-card, .product-card, .badges li, .testimonial").forEach((el) => {
    gsap.from(el, {
        y: 20, autoAlpha: 0, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
});

/* =========================
   7) Comprar (placeholder)
========================= */
document.querySelectorAll('[data-action="buy"]').forEach((btn) => {
    btn.addEventListener("click", () => {
        const card = btn.closest(".product-card");
        const sku = card?.dataset?.sku || "sopy";
        console.log("Comprar SKU:", sku);
        gsap.fromTo(btn, { scale: 1 }, { scale: 0.96, yoyo: true, repeat: 1, duration: 0.12 });
    });
});

/* =========================
   8) Cursor opcional no hero
========================= */
const cursor = document.querySelector(".cursor");
if (cursor) {
    let mx = 0, my = 0, cx = 0, cy = 0, raf;
    const update = () => { cx += (mx - cx) * 0.25; cy += (my - cy) * 0.25; cursor.style.left = cx + "px"; cursor.style.top = cy + "px"; raf = requestAnimationFrame(update); };
    const show = () => gsap.to(cursor, { autoAlpha: 1, duration: 0.15 });
    const hide = () => gsap.to(cursor, { autoAlpha: 0, duration: 0.15 });
    document.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(update); });
    document.addEventListener("mouseenter", show);
    document.addEventListener("mouseleave", () => { hide(); cancelAnimationFrame(raf); raf = null; });
    gsap.utils.toArray(".btn, a, button").forEach((el) => {
        el.addEventListener("mouseenter", () => gsap.to(cursor, { scale: 1.25, duration: 0.15 }));
        el.addEventListener("mouseleave", () => gsap.to(cursor, { scale: 1, duration: 0.15 }));
    });
}

/* =========================
   9) Header: aparece ao subir, some ao descer (sem depender do pin)
========================= */
(function autoHideHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const showNav = () => document.body.classList.remove('nav-hidden');
    const hideNav = () => document.body.classList.add('nav-hidden');
    showNav();
    let lastY = 0;
    lenis.on('scroll', (e) => {
        const y = e.scroll;
        if (y <= 10) { showNav(); lastY = y; return; }
        const goingDown = y > lastY;
        if (goingDown) hideNav(); else showNav();
        lastY = y;
    });
})();
