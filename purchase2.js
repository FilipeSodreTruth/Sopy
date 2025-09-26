// main.js — mantém o caminho da Terra e adiciona intro estilo exemplo
gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

function updateProgressBar() {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.querySelector('.progress').style.width = scrolled + '%';
}

// Animação do Vídeo Intro
function videoIntroAnimation() {
    const videoCircle = document.getElementById('video-circle');
    const videoGif = document.getElementById('video-gif');
    
    if (!videoCircle || !videoGif) return;
    
    // Timeline com ScrollTrigger para animar quando a seção aparecer
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: "#video-intro-section",
            start: "top center",
            end: "bottom center",
            toggleActions: "play none none none"
        }
    });
    
    // Círculo pequeno aparece e cresce
    tl.set(videoCircle, { scale: 0 })
      .to(videoCircle, { 
          scale: 1, 
          duration: 0.8, 
          ease: "back.out(1.7)" 
      })
      // Pausa para mostrar o GIF no círculo pequeno (reduzida)
      .to({}, { duration: 0.3 })
      // Expande o círculo e fica grande
      .to(videoCircle, { 
          scale: 15, 
          duration: 2, 
          ease: "power2.inOut",
          onStart: () => {
            // Remove border-radius e ajusta para mostrar completo
            videoCircle.style.borderRadius = '0';
            videoGif.style.borderRadius = '0';
            videoGif.style.objectFit = 'contain';
          }
      });
}

function startAnimations() {
    /* ========== Animação do Vídeo Intro ========== */
    videoIntroAnimation();

    /* ========== ScrollSmoother (como no exemplo) ========== */
    const smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 4, // Reduzido para melhor performance
        effects: true,
        onUpdate: updateProgressBar
    });

    /* ========== Animação inicial do título principal ========== */
    gsap.set("#section1 h1", {
        opacity: 0,
        y: 50
    });

    gsap.to("#section1 h1", {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power2.out",
        delay: 0.3
    });

    /* ========== 3D: spin contínuo do globo ========== */
    const earth = window.earthModel;
    if (earth) {
        gsap.set(earth.scale, { x: 5, y: 5, z: 5 });
        gsap.set(earth.position, { x: 0, y: -1, z: 0 });
        gsap.set(earth.rotation, { x: 0.2, y: -0.5, z: 0 });

        gsap.to(earth.rotation, {
            y: `+=${Math.PI * 2}`,
            ease: "none",
            repeat: -1,
            duration: 22
        });
    }

    /* ========== 2D: mover #earth-container (MESMO CAMINHO DE ANTES) ========== */
    const globeEl = document.getElementById("earth-container");

    // knobs do dock final (não mudam a trajetória intermediária)
    const DOCK_X = "-56vw";
    const DOCK_Y = "10vh";
    const LANE_L = "clamp(360px, 42vw, 640px)";

    // posição inicial (igual antes)
    gsap.set(globeEl, { x: "-32vw", y: "-2vh" });

    // timeline único com os MESMOS keyframes
    const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
            trigger: "#smooth-content",
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            fastScrollEnd: true,
            invalidateOnRefresh: true
        }
    });

    tl.to(globeEl, {
        keyframes: [
            { x: "-22vw", y: "8vh", duration: 0.22 }, // section 2
            { x: "-36vw", y: "-6vh", duration: 0.22 }, // section 3
            { x: "-18vw", y: "10vh", duration: 0.18 }, // section 4
            { x: "-28vw", y: "2vh", duration: 0.18 }, // section 5
            { x: DOCK_X, y: DOCK_Y, duration: 0.20 }  // section 6 (dock)
        ]
    });

    /* ========== Dock final: só mexe no layout do texto (CSS) ========== */
    ScrollTrigger.create({
        trigger: "#section6",
        start: "top 75%",
        end: "bottom bottom",
        onEnter: () => {
            const s6 = document.getElementById("section6");
            s6.classList.add("globe-docked");
            s6.style.setProperty("--globe-lane", LANE_L);
            s6.style.setProperty("--text-dock-y", "10vh");
        },
        onLeaveBack: () => {
            const s6 = document.getElementById("section6");
            s6.classList.remove("globe-docked");
            s6.style.removeProperty("--globe-lane");
            s6.style.removeProperty("--text-dock-y");
        }
    });

    /* ========== Animações de conteúdo (iguais/compatíveis) ========== */
    gsap.from(
        ['#section2 .heading', '#section2 .content-wrapper', '#section2 .feature-box'],
        {
            y: 40,
            opacity: 0,
            duration: 0.45,
            stagger: 0.06,
            ease: 'power3.out',
            scrollTrigger: { trigger: '#section2', start: 'top 72%', toggleActions: 'play none none reverse' }
        }
    );

    gsap.from('#section3 .content-wrapper', {
        scrollTrigger: { trigger: '#section3', start: 'top 60%', end: 'bottom center', scrub: 1 },
        y: '80%', opacity: 0, ease: 'power1.inOut',
    });

    gsap.from('#section6 .content-wrapper', {
        scrollTrigger: { trigger: '#section6', start: 'top 60%', end: 'bottom center', scrub: 1 },
        y: '50%', opacity: 0, ease: 'power1.inOut',
    });

    // reposiciona base quando recalcular layout
    ScrollTrigger.addEventListener("refreshInit", () => {
        gsap.set(globeEl, { x: "-32vw", y: "-2vh" });
    });

    /* ========== INTRO estilo do exemplo (não altera a trajetória) ========== */
    runIntro();
}

/* Intro (primeira visita): SplitText no título + fade/scale do globo */
function runIntro() {
    // globo entra com fade/scale (igual ao exemplo do headphone)
    gsap.from("#earth-container", {
        opacity: 0,
        scale: 0,
        duration: 1.0,
        ease: "power1.inOut",
        delay: 0.2
    });

    // título com SplitText em chars, aleatório
    try {
        const split = SplitText.create('#section1 .heading', {
            type: 'chars, words, lines',
            mask: 'lines'
        });

        gsap.from(split.chars, {
            yPercent: () => gsap.utils.random(-100, 100),
            rotation: () => gsap.utils.random(-30, 30),
            autoAlpha: 0,
            ease: 'back.out(1.5)',
            stagger: { amount: 0.5, from: 'random' },
            duration: 1.5
        });
    } catch (e) {
        // fallback simples
        gsap.from('#section1 .heading', {
            y: 40, opacity: 0, duration: 0.8, ease: 'power2.out'
        });
    }
}

// deixa acessível no console se precisar
window.startAnimations = startAnimations;
