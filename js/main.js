(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const EASE = "cubic-bezier(.16, 1, .3, 1)";
  const EMAIL = "avishi1.dev@gmail.com";

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(performance.now());
  }
  const navH = () => $("#nav").offsetHeight;
  function scrollToTarget(hash) {
    const el = hash === "#top" ? null : $(hash);
    if (hash !== "#top" && !el) return false;
    if (lenis) {
      lenis.scrollTo(el || 0, { offset: el ? -(navH() + 8) : 0, duration: 1.4 });
    } else if (el) {
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    } else {
      scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
    return true;
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains("skip")) return;
    const hash = a.getAttribute("href");
    if (hash.length < 2) return;
    if (scrollToTarget(hash)) {
      e.preventDefault();
      history.replaceState(null, "", hash === "#top" ? location.pathname : hash);
    }
  });

  /* ---------- Theme (circular wipe where supported) ---------- */
  const themeBtn = $("#themeBtn");
  const themeMeta = $('meta[name="theme-color"]');
  function applyTheme(t) {
    root.dataset.theme = t;
    themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    themeMeta.setAttribute("content", t === "dark" ? "#111111" : "#f6f2e9");
  }
  applyTheme(root.dataset.theme || "light");
  themeBtn.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", next); } catch (e) {}
    if (!document.startViewTransition || reduceMotion) return applyTheme(next);
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 700, easing: EASE, pseudoElement: "::view-transition-new(root)" }
      );
    });
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("#menuBtn");
  const menu = $("#menu");
  $$("a", menu).forEach((a, i) => a.style.setProperty("--j", i));
  function setMenu(open) {
    menu.classList.toggle("open", open);
    menu.inert = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) nav.classList.remove("hide");
  }
  const isMenuOpen = () => menu.classList.contains("open");
  menuBtn.addEventListener("click", () => setMenu(!isMenuOpen()));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isMenuOpen()) { setMenu(false); menuBtn.focus(); } });
  matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  /* ---------- Nav: hide on scroll down, show on scroll up ---------- */
  const nav = $("#nav");
  const toTop = $("#toTop");
  const glyphs = $$("[data-parallax]");
  let lastY = scrollY;
  function onScroll() {
    const y = scrollY;
    nav.classList.toggle("scrolled", y > 10);
    if (!isMenuOpen()) {
      if (y > lastY + 6 && y > 240) nav.classList.add("hide");
      else if (y < lastY - 6 || y < 80) nav.classList.remove("hide");
    }
    lastY = y;
    toTop.classList.toggle("show", y > 700);
    if (!reduceMotion && y < innerHeight * 1.2) {
      glyphs.forEach((g) => { g.style.transform = `translate3d(0, ${y * Number(g.dataset.parallax)}px, 0)`; });
    }
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Skills ---------- */
  // [label, simple-icons slug or null]. Missing icons fall back to a short text badge.
  const SKILLS = [
    { title: "Languages", color: "var(--coral)", items: [["Python", "python"], ["Java", "openjdk"], ["C", "c"], ["C++", "cplusplus"], ["JavaScript", "javascript"], ["SQL", null]] },
    { title: "Web & APIs", color: "var(--blue)", items: [["React.js", "react"], ["Node.js", "nodedotjs"], ["Express.js", "express"], ["FastAPI", "fastapi"], ["HTML", "html5"], ["CSS", "css"]] },
    { title: "AI / ML & Vision", color: "var(--green)", items: [["OpenCV", "opencv"], ["NumPy", "numpy"], ["Pandas", "pandas"], ["LangChain", "langchain"], ["Hugging Face", "huggingface"], ["Machine Learning", null]] },
    { title: "Databases", color: "var(--yellow)", items: [["PostgreSQL", "postgresql"], ["MySQL", "mysql"], ["MongoDB", "mongodb"], ["Supabase", "supabase"]] },
    { title: "Tools & Deploy", color: "var(--purple)", items: [["Git", "git"], ["GitHub", "github"], ["Vercel", "vercel"], ["Render", "render"], ["MATLAB", null], ["WordPress", "wordpress"]] },
    { title: "Core concepts", color: "var(--pink)", items: [["DSA", null], ["OOP", null], ["REST APIs", null], ["OAuth 2.0 / JWT", null], ["Information Security", null]] },
  ];
  const short = (name) => name.replace(/[^A-Za-z+]/g, "").slice(0, 3).toUpperCase();
  const grid = $("#skillGrid");
  grid.innerHTML = SKILLS.map((g) => `
    <div class="skill-group reveal" style="--c:${g.color}">
      <h3 class="skill-title">${g.title}</h3>
      <ul class="skill-list">
        ${g.items.map(([name, slug], j) => `<li class="skill" style="--j:${j}">${
          slug
            ? `<img src="https://cdn.simpleicons.org/${slug}" alt="" width="18" height="18" loading="lazy" data-fb="${short(name)}" />`
            : `<span class="skill-fb" aria-hidden="true">${short(name)}</span>`
        }${name}</li>`).join("")}
      </ul>
    </div>`).join("");
  $$("img[data-fb]", grid).forEach((img) => {
    img.addEventListener("error", () => {
      const fb = document.createElement("span");
      fb.className = "skill-fb";
      fb.setAttribute("aria-hidden", "true");
      fb.textContent = img.dataset.fb;
      img.replaceWith(fb);
    }, { once: true });
  });

  /* ---------- Stagger indices ---------- */
  [".bento", ".skill-grid", ".wins", ".acc", ".projects", ".mini-grid"].forEach((sel) => {
    $$(sel).forEach((box) => [...box.children].forEach((el, i) => el.style.setProperty("--i", i)));
  });
  $$(".ticks").forEach((ul) => [...ul.children].forEach((li, j) => li.style.setProperty("--j", j)));

  /* ---------- Tabs ---------- */
  const tabsEl = $(".tabs");
  const tabs = $$('[role="tab"]');
  function selectTab(tab) {
    tabs.forEach((t, i) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = $("#" + t.getAttribute("aria-controls"));
      panel.hidden = !on;
      if (on) {
        tabsEl.dataset.active = String(i);
        panel.classList.remove("enter");
        void panel.offsetWidth;
        panel.classList.add("enter");
        $$(".reveal", panel).forEach((el) => el.classList.add("in"));
      }
    });
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  /* ---------- Accordion with animated height ---------- */
  $$(".acc details").forEach((d) => {
    const summary = $("summary", d);
    summary.addEventListener("click", (e) => {
      if (reduceMotion) return;
      e.preventDefault();
      const startH = d.offsetHeight;
      if (d._anim) d._anim.cancel();
      let endH;
      if (d.open && !d._closing) {
        d._closing = true;
        endH = summary.offsetHeight + (d.offsetHeight - d.clientHeight);
      } else {
        d._closing = false;
        d.open = true;
        endH = d.offsetHeight;
      }
      d._anim = d.animate({ height: [startH + "px", endH + "px"] }, { duration: 550, easing: EASE });
      d._anim.onfinish = () => {
        if (d._closing) d.open = false;
        d._closing = false;
        d._anim = null;
      };
    });
  });

  /* ---------- Hero load-in ---------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const dec = Number(el.dataset.dec || 0);
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) return;
    const start = performance.now();
    const dur = 1300;
    (function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  let started = false;
  function start() {
    if (started) return;
    started = true;
    document.body.classList.add("loaded");
    setTimeout(() => $$(".stats [data-count]").forEach(countUp), 850);
  }
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 900))]).then(start);

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      $$("[data-count]", en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- Hero cursor spotlight ---------- */
  const hero = $(".hero");
  const light = $("#heroLight");
  if (canHover && !reduceMotion) {
    let tx = 0, ty = 0, cx = 0, cy = 0, rafId = null;
    const step = () => {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      light.style.setProperty("--x", cx + "px");
      light.style.setProperty("--y", cy + "px");
      rafId = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(step) : null;
    };
    hero.addEventListener("pointerenter", (e) => {
      const r = hero.getBoundingClientRect();
      cx = tx = e.clientX - r.left;
      cy = ty = e.clientY - r.top;
      step();
      hero.classList.add("lit");
    });
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!rafId) rafId = requestAnimationFrame(step);
    });
    hero.addEventListener("pointerleave", () => hero.classList.remove("lit"));
  }

  /* ---------- Tilt cards ---------- */
  if (canHover && !reduceMotion) {
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 10}deg)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Active nav link ---------- */
  const links = $$(".nav-links a");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((a) => { const s = $(a.getAttribute("href")); if (s) spy.observe(s); });

  /* ---------- Toast + copy email ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }
  $("#copyEmail").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      toast("Email copied ✓");
    } catch (e) {
      toast(EMAIL);
    }
  });

  /* ---------- Contact form (sends via FormSubmit) ---------- */
  const ENDPOINT = `https://formsubmit.co/ajax/${EMAIL}`;
  const form = $("#compose");
  const statusEl = $("#formStatus");
  const sendText = $(".send-text", form);
  const sent = $("#sentCard");
  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function setStatus(text, isErr, fallback) {
    statusEl.textContent = text;
    statusEl.classList.toggle("err", !!isErr);
    if (fallback) {
      const a = document.createElement("a");
      a.href = fallback;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Send it through Gmail instead";
      statusEl.append(" ", a, ".");
    }
  }
  $$("input, textarea", form).forEach((f) => f.addEventListener("input", () => f.classList.remove("invalid")));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { name, email, message, _honey } = form.elements;
    const data = { name: name.value.trim(), email: email.value.trim(), message: message.value.trim() };

    const bad = [];
    if (!data.name) bad.push(name);
    if (!validEmail(data.email)) bad.push(email);
    if (!data.message) bad.push(message);
    bad.forEach((f) => f.classList.add("invalid"));
    if (bad.length) {
      setStatus(!validEmail(data.email) && data.email ? "That email doesn't look right." : "Please fill in all three fields.", true);
      bad[0].focus();
      return;
    }
    if (_honey.value) return showSent(); // bot

    form.classList.add("sending");
    sendText.textContent = "Sending…";
    setStatus("");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...data,
          _subject: `Portfolio message from ${data.name}`,
          _replyto: data.email,
          _template: "table",
          _captcha: "false",
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && String(out.success) === "true") {
        showSent();
      } else {
        throw new Error(out.message || "");
      }
    } catch (err) {
      const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL)}&su=${encodeURIComponent("Portfolio message from " + data.name)}&body=${encodeURIComponent(data.message)}`;
      setStatus(err.message ? err.message + " " : "Couldn't send right now. ", true, gmail);
    } finally {
      form.classList.remove("sending");
      sendText.textContent = "Send message";
    }
  });
  function showSent() {
    form.reset();
    form.hidden = true;
    sent.hidden = false;
    sent.focus();
  }
  $("#sendAnother").addEventListener("click", () => {
    sent.hidden = true;
    form.hidden = false;
    setStatus("");
    form.elements.name.focus();
  });

  $("#year").textContent = new Date().getFullYear();
})();
