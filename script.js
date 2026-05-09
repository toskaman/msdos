const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const storedTheme = localStorage.getItem("portfolio-theme");
const themeMeta = document.querySelector('meta[name="theme-color"]');

function syncThemeMeta() {
  themeMeta?.setAttribute("content", root.dataset.theme === "light" ? "#f7f8fb" : "#111315");
}

root.dataset.theme = storedTheme || "dark";
syncThemeMeta();

themeToggle?.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem("portfolio-theme", nextTheme);
  syncThemeMeta();
});

const searchInput = document.querySelector("[data-project-search]");
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = [...document.querySelectorAll(".project-card")];
let activeFilter = "all";

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function applyFilters() {
  const query = normalize(searchInput?.value ?? "");

  projectCards.forEach((card) => {
    const category = card.dataset.category ?? "";
    const haystack = normalize(card.textContent ?? "");
    const matchesFilter = activeFilter === "all" || category.includes(activeFilter);
    const matchesSearch = !query || haystack.includes(query);
    card.classList.toggle("is-hidden", !(matchesFilter && matchesSearch));
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter ?? "all";
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    applyFilters();
  });
});

searchInput?.addEventListener("input", applyFilters);

const dialog = document.querySelector("[data-project-dialog]");
const closeDialogButton = document.querySelector("[data-dialog-close]");
const dialogTitle = document.querySelector("[data-dialog-title]");
const dialogType = document.querySelector("[data-dialog-type]");
const dialogSummary = document.querySelector("[data-dialog-summary]");
const dialogTags = document.querySelector("[data-dialog-tags]");

projectCards.forEach((card) => {
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Voir le detail du projet ${card.dataset.title}`);

  const open = () => {
    if (!dialog || !dialogTitle || !dialogType || !dialogSummary || !dialogTags) return;
    const previousScrollX = window.scrollX;
    const previousScrollY = window.scrollY;

    dialogTitle.textContent = card.dataset.title ?? "";
    dialogSummary.textContent = card.dataset.summary ?? "";
    dialogType.textContent = card.querySelector(".project-type")?.textContent ?? "Projet";
    dialogTags.innerHTML = "";
    (card.dataset.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => {
        const tagElement = document.createElement("span");
        tagElement.textContent = tag;
        dialogTags.appendChild(tagElement);
      });
    dialog.showModal();
    window.requestAnimationFrame(() => {
      window.scrollTo(previousScrollX, previousScrollY);
    });
  };

  card.addEventListener("click", open);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
});

closeDialogButton?.addEventListener("click", () => dialog?.close());
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) {
    dialog.close();
  }
});

const canvas = document.querySelector("#hero-canvas");
const ctx = canvas?.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const nodes = Array.from({ length: 34 }, (_, index) => ({
  x: Math.random(),
  y: Math.random(),
  radius: index % 5 === 0 ? 3.2 : 2.1,
  speed: 0.0006 + Math.random() * 0.0012,
  phase: Math.random() * Math.PI * 2,
}));

function syncCanvasSize() {
  if (!canvas) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawNetwork(time = 0) {
  if (!canvas || !ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;

  const points = nodes.map((node) => {
    const drift = prefersReducedMotion ? 0 : Math.sin(time * node.speed + node.phase) * 24;
    return {
      x: node.x * width + drift,
      y: node.y * height + Math.cos(time * node.speed + node.phase) * 16,
      radius: node.radius,
    };
  });

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const a = points[i];
      const b = points[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < 170) {
        ctx.globalAlpha = Math.max(0, 0.22 - distance / 800);
        ctx.strokeStyle = getComputedStyle(root).getPropertyValue("--accent").trim();
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  points.forEach((point, index) => {
    ctx.globalAlpha = index % 4 === 0 ? 0.9 : 0.42;
    ctx.fillStyle = index % 4 === 0
      ? getComputedStyle(root).getPropertyValue("--coral").trim()
      : getComputedStyle(root).getPropertyValue("--accent").trim();
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
  if (!prefersReducedMotion) {
    requestAnimationFrame(drawNetwork);
  }
}

if (canvas && ctx) {
  syncCanvasSize();
  drawNetwork();
  window.addEventListener("resize", () => {
    syncCanvasSize();
    drawNetwork();
  });
}

// Multi-language support
const langToggle = document.querySelector("[data-lang-toggle]");
const langIcon = document.getElementById("lang-icon");
let currentLang = localStorage.getItem("portfolio-lang") || "en";

const translations = {
  fr: {
    nav_projects: "Projets",
    nav_skills: "Compétences",
    nav_contact: "Contact",
    hero_date: "Portfolio technique - mai 2026",
    hero_title: "Tools, automation & Roblox",
    hero_lead: "Passionné d'informatique depuis mes 13 ans, je crée souvent mes propres logiciels pour répondre à mes besoins. Je travaille principalement en Lua, parfois sur plusieurs projets en parallèle, et je continue d'apprendre d'autres langages, technologies et IA pour rester à jour.",
    btn_projects: "Voir les projets",
    btn_contact: "Me contacter",
    focus_eyebrow: "Ce que je construis",
    focus_title: "Des outils qui résolvent des problèmes concrets",
    p_rbx_manager: "Manager Roblox nouvelle génération avec beaucoup de features, pensé pour gérer rapidement plusieurs comptes et actions.",
    terminal_content: "C:\\>PROFILE.EXE /SCAN\n\n[SCANNAGE DU PROFIL...]\nEXPERIENCE=20_ANS\nFOCUS=TOOLS,AUTOMATION,ROBLOX,APIS,IA\nLANGAGE=LUA\nWORKFLOW=MULTI_PROJETS,ORIENTE_BESOIN\nSERVEURS=MINECRAFT,GMOD,FIVEM\nLEGACY=PREMIERS_ANTICHEATS_GMOD\nIA_STACK=CLAUDE,GEMINI,DEEPSEEK,LOCAL\nMODE=PASSION_DRIVEN,LOCAL_FIRST",
    stats_countries: "Visionnage par pays :",
    copyright: "&copy; 2026 MSDOS - Tous droits réservés."
  },
  en: {
    nav_projects: "Projects",
    nav_skills: "Skills",
    nav_contact: "Contact",
    hero_date: "Technical Portfolio - May 2026",
    hero_title: "Tools, Automation & Roblox",
    hero_lead: "Passionate about computing since age 13, I often create my own software to meet my needs. I primarily work in Lua, sometimes on several projects in parallel, and I continue to learn other languages, technologies, and AI to stay up to date.",
    btn_projects: "View Projects",
    btn_contact: "Contact Me",
    focus_eyebrow: "What I Build",
    focus_title: "Tools that solve real-world problems",
    p_rbx_manager: "New generation Roblox Manager with many features, designed to quickly manage multiple accounts and actions.",
    terminal_content: "C:\\>PROFILE.EXE /SCAN\n\n[SCANNING PROFILE...]\nEXPERIENCE=20_YEARS\nFOCUS=TOOLS,AUTOMATION,ROBLOX,APIS,AI\nLANGUAGE=LUA\nWORKFLOW=MULTI_PROJECT,NEEDS_DRIVEN\nSERVERS=MINECRAFT,GMOD,FIVEM\nLEGACY=EARLY_ANTICHEATS_GMOD\nAI_STACK=CLAUDE,GEMINI,DEEPSEEK,LOCAL\nMODE=PASSION_DRIVEN,LOCAL_FIRST",
    stats_countries: "Views by country:",
    copyright: "&copy; 2026 MSDOS - All rights reserved."
  }
};

function updateLanguage(lang) {
  document.querySelectorAll("[data-t]").forEach(el => {
    const key = el.getAttribute("data-t");
    if (translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });
  langIcon.textContent = lang === "fr" ? "🇫🇷" : "🇺🇸";
  document.documentElement.lang = lang;
}

langToggle?.addEventListener("click", () => {
  currentLang = currentLang === "en" ? "fr" : "en";
  localStorage.setItem("portfolio-lang", currentLang);
  updateLanguage(currentLang);
});

// Initialize language
updateLanguage(currentLang);
