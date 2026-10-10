(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Cinematic MAD MAX logo reveal — plays on each fresh page load.
  document.body.classList.add("loading");
  const loader = $(".page-loader");
  const loaderPercent = $(".loader-percent");
  const loaderBar = $(".loader-line i");
  const loaderStarted = performance.now();
  const loaderDuration = reducedMotion ? 250 : 1750;
  let loaderFrame = 0;

  const paintLoaderProgress = now => {
    if (!loader || loader.classList.contains("done")) return;
    const progress = Math.min(100, Math.round(((now - loaderStarted) / loaderDuration) * 100));
    if (loaderPercent) loaderPercent.textContent = `${String(progress).padStart(2, "0")}%`;
    // Drive the bar width from the same value as the percentage label.
    if (loaderBar) loaderBar.style.width = `${progress}%`;
    if (progress < 100) loaderFrame = requestAnimationFrame(paintLoaderProgress);
  };

  // Keep the number and fill synchronized, including reduced-motion mode.
  loaderFrame = requestAnimationFrame(paintLoaderProgress);
  window.addEventListener("load", () => {
    const elapsed = performance.now() - loaderStarted;
    window.setTimeout(() => {
      if (loaderPercent) loaderPercent.textContent = "100%";
      if (loaderBar) loaderBar.style.width = "100%";
      loader?.classList.add("done");
      document.body.classList.remove("loading");
      cancelAnimationFrame(loaderFrame);
    }, Math.max(0, loaderDuration - elapsed));
  }, { once: true });

  // Header and scroll progress
  const header = $(".site-header");
  const progress = $(".scroll-progress i");
  const updateScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0}%`;
    header?.classList.toggle("scrolled", window.scrollY > 18);
  };
  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  // Mobile navigation
  const menu = $("#menu");
  const navLinks = $("#navLinks");
  menu?.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(isOpen));
    menu.classList.toggle("active", isOpen);
  });
  $$("#navLinks a").forEach(link => link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menu?.setAttribute("aria-expanded", "false");
    menu?.classList.remove("active");
  }));

  // Reveal sections and active nav
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach((el, index) => {
      el.style.transitionDelay = `${Math.min((index % 3) * 85, 170)}ms`;
      revealObserver.observe(el);
    });
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          $$("#navLinks a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    $$("main section[id]").forEach(section => sectionObserver.observe(section));
  } else {
    $$(".reveal").forEach(el => el.classList.add("visible"));
  }

  // Pointer glow and magnetic interactions
  const glow = $(".cursor-glow");
  let pointerX = innerWidth / 2, pointerY = innerHeight / 2;
  window.addEventListener("pointermove", event => {
    pointerX = event.clientX; pointerY = event.clientY;
    if (glow) { glow.style.left = `${pointerX}px`; glow.style.top = `${pointerY}px`; }
  }, { passive: true });
  if (!reducedMotion && matchMedia("(pointer:fine)").matches) {
    $$(".magnetic").forEach(el => {
      el.addEventListener("pointermove", event => {
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate(${dx * .08}px, ${dy * .12}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
    $$(".tilt-card").forEach(card => {
      card.addEventListener("pointermove", event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty("--spot-x", `${x * 100}%`);
        card.style.setProperty("--spot-y", `${y * 100}%`);
        if (event.target.closest("a,button")) return;
        card.style.transform = `perspective(1000px) rotateX(${(0.5-y)*2.5}deg) rotateY(${(x-0.5)*3.5}deg) translateY(-3px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  // OLED project details modal
  const modal = $("#modal");
  const closeModal = () => {
    modal?.classList.remove("open");
    modal?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  $$(".open-project").forEach(button => button.addEventListener("click", () => {
    $("#modalTitle").textContent = button.dataset.title || "Project details";
    $("#modalDesc").textContent = button.dataset.desc || "";
    $("#modalTech").textContent = button.dataset.tech || "";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $("#close")?.focus();
  }));
  $("#close")?.addEventListener("click", closeModal);
  $$("[data-close-modal]").forEach(el => el.addEventListener("click", closeModal));
  window.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });

  // Three.js hero object. CSS fallback remains visible if WebGL/Three.js is unavailable.
  function initThreeHero() {
    const canvas = $("#heroCanvas");
    const stage = $("#orbStage");
    if (!canvas || !stage || !window.THREE || reducedMotion) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power"
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.background = "transparent";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(0, 0, 8.2);

      const installation = new THREE.Group();
      scene.add(installation);

      // Central kinetic glass prism: deliberately not a sphere or orbiting logo.
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xb8a1ff,
        metalness: 0.32,
        roughness: 0.12,
        transmission: 0.42,
        thickness: 1.25,
        ior: 1.42,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide
      });
      const prism = new THREE.Mesh(new THREE.OctahedronGeometry(1.25, 0), glassMaterial);
      prism.scale.set(0.92, 1.22, 0.72);
      installation.add(prism);

      // Bright inner crystal that catches and refracts the colored lights.
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.48, 1),
        new THREE.MeshPhysicalMaterial({
          color: 0x66e8ff,
          metalness: 0.5,
          roughness: 0.16,
          emissive: 0x12394a,
          emissiveIntensity: 0.8,
          clearcoat: 1
        })
      );
      core.position.z = 0.12;
      installation.add(core);

      // Floating glass panels rotate on independent axes, like a kinetic sculpture.
      const panels = new THREE.Group();
      const panelData = [];
      const panelColors = [0xb48cff, 0x66e8ff, 0xe7ddff, 0x8d9cff, 0x66e8ff];
      for (let i = 0; i < 5; i++) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(0.62 + (i % 2) * 0.24, 1.12 + (i % 3) * 0.12, 0.035),
          new THREE.MeshPhysicalMaterial({
            color: panelColors[i],
            metalness: 0.62,
            roughness: 0.18,
            transparent: true,
            opacity: 0.58,
            transmission: 0.16,
            clearcoat: 1,
            emissive: panelColors[i],
            emissiveIntensity: 0.12,
            side: THREE.DoubleSide
          })
        );
        const angle = (i / 5) * Math.PI * 2;
        panel.position.set(Math.cos(angle) * (1.45 + (i % 2) * 0.18), Math.sin(angle) * 0.82, (i - 2) * 0.19);
        panel.rotation.set(0.25 + i * 0.19, angle * 0.35, angle);
        panels.add(panel);
        panelData.push({ mesh: panel, angle, speed: 0.16 + i * 0.035, bob: 0.16 + (i % 3) * 0.06 });
      }
      installation.add(panels);

      // Small metallic fragments drift in depth instead of following orbital paths.
      const fragments = new THREE.Group();
      const fragmentData = [];
      for (let i = 0; i < 24; i++) {
        const geometry = i % 3 === 0
          ? new THREE.TetrahedronGeometry(0.075 + (i % 4) * 0.018)
          : new THREE.BoxGeometry(0.055 + (i % 3) * 0.018, 0.055 + (i % 2) * 0.02, 0.055);
        const material = new THREE.MeshStandardMaterial({
          color: i % 2 ? 0x66e8ff : 0xb48cff,
          metalness: 0.8,
          roughness: 0.2,
          emissive: i % 2 ? 0x0a2934 : 0x24113d,
          emissiveIntensity: 0.5
        });
        const fragment = new THREE.Mesh(geometry, material);
        fragment.userData = {
          x: (Math.random() - 0.5) * 5.4,
          y: (Math.random() - 0.5) * 4.1,
          z: (Math.random() - 0.5) * 2.8,
          phase: Math.random() * Math.PI * 2,
          speed: 0.18 + Math.random() * 0.38
        };
        fragments.add(fragment);
        fragmentData.push(fragment);
      }
      scene.add(fragments);

      // Sparse depth particles create a parallax field behind the sculpture.
      const dustPositions = new Float32Array(360 * 3);
      for (let i = 0; i < 360; i++) {
        dustPositions[i * 3] = (Math.random() - 0.5) * 9;
        dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 6;
        dustPositions[i * 3 + 2] = -1.5 - Math.random() * 5;
      }
      const dustGeometry = new THREE.BufferGeometry();
      dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
      const dust = new THREE.Points(
        dustGeometry,
        new THREE.PointsMaterial({ color: 0xa7caff, size: 0.015, transparent: true, opacity: 0.45 })
      );
      scene.add(dust);

      scene.add(new THREE.AmbientLight(0xb8c4ff, 1.5));
      const violetLight = new THREE.PointLight(0xb48cff, 36, 14);
      violetLight.position.set(3, 2.5, 4);
      scene.add(violetLight);
      const cyanLight = new THREE.PointLight(0x66e8ff, 30, 12);
      cyanLight.position.set(-3, -1.6, 2.2);
      scene.add(cyanLight);
      const whiteLight = new THREE.PointLight(0xffffff, 8, 9);
      whiteLight.position.set(0, 3, -1);
      scene.add(whiteLight);

      // Temporal echo copies create a restrained "fourth dimension" time-trail effect.
      const echoGroup = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const echo = new THREE.Mesh(
          new THREE.OctahedronGeometry(1.18, 0),
          new THREE.MeshBasicMaterial({
            color: i % 2 ? 0x66e8ff : 0xb48cff,
            wireframe: true,
            transparent: true,
            opacity: 0.07 - i * 0.012
          })
        );
        echo.scale.set(0.92 + i * 0.07, 1.2 + i * 0.04, 0.7 + i * 0.1);
        echoGroup.add(echo);
      }
      scene.add(echoGroup);

      const resize = () => {
        const width = Math.max(1, stage.clientWidth);
        const height = Math.max(1, stage.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize, { passive: true });

      let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
      let scrollDimension = 0;
      const updateDimensionScroll = () => {
        const rect = stage.getBoundingClientRect();
        const viewport = window.innerHeight || 1;
        scrollDimension = Math.max(-1, Math.min(1, (viewport * 0.55 - rect.top) / (viewport + rect.height)));
      };
      window.addEventListener("scroll", updateDimensionScroll, { passive: true });
      updateDimensionScroll();
      stage.addEventListener("pointermove", event => {
        const rect = stage.getBoundingClientRect();
        targetY = ((event.clientX - rect.left) / rect.width - 0.5) * 0.52;
        targetX = ((event.clientY - rect.top) / rect.height - 0.5) * 0.36;
      }, { passive: true });
      stage.addEventListener("pointerleave", () => { targetX = 0; targetY = 0; });

      const clock = new THREE.Clock();
      let frameId;
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        currentX += (targetX - currentX) * 0.025;
        currentY += (targetY - currentY) * 0.025;

        installation.rotation.x = Math.sin(t * 0.24) * 0.08 + currentX + scrollDimension * 0.08;
        installation.rotation.y = Math.sin(t * 0.2) * 0.16 + currentY + scrollDimension * 0.12;
        installation.rotation.z = Math.sin(t * 0.18) * 0.035 + scrollDimension * 0.025;
        installation.position.y = Math.sin(t * 0.48) * 0.045 + scrollDimension * 0.12;

        prism.rotation.x = Math.sin(t * 0.28) * 0.16;
        prism.rotation.y = -t * 0.13;
        prism.material.opacity = 0.76 + (Math.sin(t * 1.1) + 1) * 0.07;

        core.rotation.x = t * 0.24;
        core.rotation.y = -t * 0.32;
        const pulse = 1 + Math.sin(t * 1.6) * 0.055;
        core.scale.set(pulse, pulse, pulse);

        panelData.forEach((item, i) => {
          item.mesh.rotation.x += 0.0015 * (i % 2 ? -1 : 1);
          item.mesh.rotation.y += 0.002 * (i % 2 ? 1 : -1);
          item.mesh.position.y = Math.sin(t * item.speed + item.angle) * item.bob;
          item.mesh.position.z = (i - 2) * 0.19 + Math.cos(t * 0.38 + item.angle) * 0.18;
        });

        fragmentData.forEach((fragment, i) => {
          const d = fragment.userData;
          fragment.position.set(
            d.x + Math.sin(t * d.speed + d.phase) * 0.12,
            d.y + Math.cos(t * d.speed * 0.8 + d.phase) * 0.16,
            d.z + Math.sin(t * 0.32 + d.phase) * 0.24
          );
          fragment.rotation.x = t * d.speed;
          fragment.rotation.y = -t * d.speed * 0.8;
        });
        fragments.rotation.y = Math.sin(t * 0.12) * 0.04 + scrollDimension * 0.04;
        echoGroup.rotation.x = installation.rotation.x * 0.72;
        echoGroup.rotation.y = installation.rotation.y * 0.82;
        echoGroup.rotation.z = Math.sin(t * 0.2) * 0.04;
        echoGroup.children.forEach((echo, index) => {
          echo.position.set(
            Math.sin(t * 0.4 + index) * (0.025 + index * 0.012),
            Math.cos(t * 0.35 + index) * (0.025 + index * 0.012),
            -0.08 - index * 0.12
          );
          echo.rotation.x = t * 0.05 * (index + 1);
          echo.rotation.y = -t * 0.04 * (index + 1);
        });
        dust.rotation.y = t * 0.008;
        violetLight.position.x = 2.8 + Math.sin(t * 0.55) * 0.65;
        cyanLight.position.y = -1.6 + Math.cos(t * 0.48) * 0.55;

        renderer.render(scene, camera);
      };
      animate();

      document.addEventListener("visibilitychange", () => {
        if (document.hidden && frameId) cancelAnimationFrame(frameId);
        else if (!document.hidden && !reducedMotion) animate();
      });
    } catch (error) {
      console.warn("Kinetic glass hero could not start; CSS fallback is active.", error);
      if (renderer) renderer.dispose();
      canvas.style.display = "none";
    }
  }
  initThreeHero();
})();