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
const dialogVisual = document.querySelector("[data-dialog-visual]");
const dialogTitle = document.querySelector("[data-dialog-title]");
const dialogType = document.querySelector("[data-dialog-type]");
const dialogSummary = document.querySelector("[data-dialog-summary]");
const dialogTags = document.querySelector("[data-dialog-tags]");

projectCards.forEach((card) => {
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `See project details for ${card.dataset.title}`);

  const open = () => {
    if (!dialog || !dialogTitle || !dialogType || !dialogSummary || !dialogTags || !dialogVisual) return;
    const previousScrollX = window.scrollX;
    const previousScrollY = window.scrollY;

    // Clone visual from card
    dialogVisual.innerHTML = "";
    const originalVisual = card.querySelector(".project-visual");
    if (originalVisual) {
      const clonedVisual = originalVisual.cloneNode(true);
      clonedVisual.style.width = "100%";
      clonedVisual.style.height = "100%";
      clonedVisual.style.minHeight = "auto";
      dialogVisual.appendChild(clonedVisual);
    }

    dialogTitle.textContent = card.querySelector("h3").textContent ?? "";
    dialogSummary.textContent = card.querySelector("p")?.textContent ?? card.dataset.summary ?? "";
    dialogType.textContent = card.querySelector(".project-type")?.textContent ?? "Project";
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
const langDot = document.getElementById("lang-switch-dot");
let currentLang = localStorage.getItem("portfolio-lang") || "en";

const translations = {
  fr: {
    meta_desc: "Portfolio développeur : 20 ans d'expérience informatique, Lua, logiciels Windows, Roblox, automatisation, bots Discord, API, IA, modèles locaux, serveurs de jeux et extensions Chrome.",
    og_title: "MSDOS | Portfolio développeur",
    og_desc: "Portfolio : 20 ans d'expérience informatique, Lua, tools Windows, automatisation, Roblox, bots Discord, API, IA, modèles locaux, serveurs de jeux et logiciels local-first.",
    site_title: "MSDOS | Portfolio développeur",
    brand_tagline: "Outils / Roblox / Automation",
    nav_projects: "Projets",
    nav_skills: "Compétences",
    nav_contact: "Contact",
    hero_date: "Portfolio technique - mai 2026",
    hero_title: "Outils, Automation & Roblox",
    hero_lead: "Passionné d'informatique depuis mes 13 ans, je crée souvent mes propres logiciels pour répondre à mes besoins. Je travaille principalement en Lua, parfois sur plusieurs projets en parallèle, et je continue d'apprendre d'autres langages, technologies et IA pour rester à jour.",
    btn_projects: "Voir les projets",
    btn_contact: "Me contacter",
    terminal_content: "C:\\>PROFILE.EXE /SCAN\n\n[SCAN DU PROFIL...]\nEXPERIENCE=20_ANS\nFOCUS=TOOLS,AUTOMATION,ROBLOX,APIS,IA\nLANGAGE=LUA\nWORKFLOW=MULTI_PROJETS,ORIENTE_BESOIN\nSERVEURS=MINECRAFT,GMOD,FIVEM\nLEGACY=PREMIERS_ANTICHEATS_GMOD\nIA_STACK=CLAUDE,GEMINI,DEEPSEEK,LOCAL\nMODE=PASSION_DRIVEN,LOCAL_FIRST",
    metric_years: "ans",
    metric_it: "Informatique",
    metric_lang: "Langage Principal",
    metric_watch: "Veille",
    metric_tech: "Tech & IA",
    focus_eyebrow: "Ce que je construis",
    focus_title: "Des outils qui résolvent des problèmes concrets",
    focus_desktop: "Applications Desktop",
    focus_desktop_desc: "Optimisation Windows, maintenance, debloat Android, traduction locale et gestion d'outils.",
    focus_automation: "Automation & Bots",
    focus_automation_desc: "Bots Discord complets, APIs perso, automatisation web, modération, logs et systèmes persistants.",
    focus_gaming: "Expériences de Jeu",
    focus_gaming_desc: "Jeux Roblox, serveurs ultra moddés, génération de cartes semi-3D et gameplay long terme.",
    exp_20_title: "20 ans d'expérience",
    exp_20_desc: "Dans l'informatique depuis mes 13 ans, avec une pratique continue des outils, serveurs, scripts et logiciels.",
    exp_anticheat_title: "Anticheats GMod / DarkRP",
    exp_anticheat_desc: "Travail sur des anticheats durant les premières années de GMod/DarkRP, parmi les premiers projets du genre.",
    strip_servers_title: "Serveurs & Communautés",
    strip_servers_desc: "Modérateur, Head Mod et Développeur sur plusieurs serveurs de jeux et communautés actives (Minecraft, GMod, FiveM).",
    exp_api_title: "APIs & Passion",
    exp_api_desc: "Utilisation et création d'APIs personnelles pour connecter des outils, automatiser des workflows et aller plus vite.",
    exp_ai_title: "IA & Modèles Locaux",
    exp_ai_desc: "Travail avec Claude, Gemini, DeepSeek, versions CLI et de nombreux modèles locaux pour tester, comparer et intégrer l'IA.",
    exp_learning_title: "Apprentissage Continu",
    exp_learning_desc: "Base principale en Lua, exploration d'autres langages, veille permanente sur les nouvelles technologies et travail en parallèle sur plusieurs projets.",
    projects_eyebrow: "Projets",
    projects_title: "Sélection de réalisations",
    search_placeholder: "Rechercher un projet ou une compétence",
    filter_all: "Tout",
    filter_desktop: "Desktop",
    filter_automation: "Automation",
    filter_game: "Jeux",
    filter_security: "Sécurité",
    filter_extension: "Extensions",
    type_desktop: "App Desktop",
    type_windows: "Outil Windows",
    type_security: "Sensibilisation",
    type_game_sec: "Sécurité Jeu",
    type_utility: "Utilitaire",
    type_game_tool: "Outil Jeu",
    type_roblox: "Roblox",
    type_legacy: "Historique",
    type_servers: "Serveurs de jeu",
    type_local: "App Locale",
    type_android: "Outil Android",
    type_discord: "Bot Discord",
    type_maintenance: "Maintenance",
    type_browser: "Extensions Web",
    type_ai: "Workflows IA",
    p_rbx_manager: "Manager Roblox nouvelle génération avec beaucoup de features, pensé pour gérer rapidement plusieurs comptes et actions.",
    link_discord: "Rejoindre le Discord",
    p_rbx_creation: "Création d'expériences complètes.",
    title_optimizer: "Tool d'optimisation technicien",
    p_optimizer: "Outil hyper complet pour accélérer, nettoyer, diagnostiquer et appliquer des réglages utiles sur PC.",
    title_cameras: "Audit de caméras exposées",
    p_cameras: "Découverte de caméras mal sécurisées à des fins d'audit, de sensibilisation et de prévention.",
    title_anticheat: "Anticheats GMod / DarkRP",
    p_anticheat: "Travail sur des anticheats dans les premières années de GMod/DarkRP, parmi les premiers projets du genre.",
    title_restart: "Redémarrage PC simple",
    p_restart: "Logiciel minimaliste pour redémarrer un PC rapidement avec une interface claire et directe.",
    title_parallax: "Génération de cartes semi-3D",
    p_parallax: "Génération automatique de maps avec couches Parallax pour produire un rendu semi-3D.",
    title_rbx_games: "Jeux vidéos Roblox",
    p_rbx_games: "Création de plusieurs expériences Roblox avec systèmes de gameplay, progression et interfaces.",
    title_rbx_exploit: "Roblox Exploit (Terminé)",
    p_rbx_exploit: "Création massive de scripts (2K+) pour Roblox. Cette activité est désormais close mais a forgé une expertise solide en Lua.",
    title_servers: "Serveurs de jeux ultra moddés",
    p_servers: "Création de serveurs Minecraft, GMod, FiveM et autres environnements lourdement customisés.",
    title_subtitles: "Traducteur de sous-titres en masse",
    p_subtitles: "Traduction rapide de sous-titres en plusieurs langues, full local et facile à prendre en main.",
    title_android: "Debloater Android PC",
    p_android: "Outil PC pour nettoyer un appareil Android, retirer les apps inutiles et simplifier la maintenance.",
    title_discord: "Bot Discord complet",
    p_discord: "Mini-jeux, jeu complet donjon/trading/farming, modération, logs et maintenance continue depuis 2 ans+.",
    title_updater: "Mise à jour logiciels en 1 clic",
    p_updater: "Mise à jour rapide des applications installées, avec récupération depuis les sources officielles.",
    title_extension: "Chrome Extensions",
    p_extension: "Visualizer audio, prix au kilo pour comparer les commandes food, automatisations web et outils pratiques.",
    title_ai: "Expérimentation IA et modèles locaux",
    p_ai: "Claude, Gemini, DeepSeek, versions CLI et dizaines de modèles locaux testés pour comparer leurs comportements et les intégrer à des outils.",
    skill_dev_title: "Développement",
    skill_dev_1: "Applications Desktop",
    skill_dev_2: "Interfaces simples et efficaces",
    skill_dev_3: "Logiciels créés pour mes besoins",
    skill_dev_4: "Création d'APIs personnelles",
    skill_dev_5: "IA, LLMs et modèles locaux",
    skill_dev_6: "Projets en parallèle",
    skill_dev_7: "Automation de Workflows",
    skill_sys_title: "Système & Maintenance",
    skill_sys_1: "Optimisation Windows",
    skill_sys_2: "Diagnostic et Nettoyage",
    skill_sys_3: "Mise à jour logicielle",
    skill_sys_4: "ADB / Debloat Android",
    skill_sys_5: "Scripts Technicien",
    skill_game_title: "Gaming & Communautés",
    skill_game_1: "Roblox / Lua",
    skill_game_2: "Lua comme Langage Principal",
    skill_game_3: "Systèmes de Gameplay",
    skill_game_4: "Serveurs Minecraft / GMod / FiveM",
    skill_game_5: "Anticheats GMod / DarkRP",
    skill_game_6: "Bots Discord",
    skill_game_7: "Économies Farming/Trading",
    skill_web_title: "Web & Extensions",
    skill_web_1: "Extensions Chrome",
    skill_web_2: "Automation Web",
    skill_web_3: "Claude / Gemini / DeepSeek CLI",
    skill_web_4: "Veille nouvelles technologies",
    skill_web_5: "Audio Visualizers",
    skill_web_6: "Comparateurs Pratiques",
    skill_web_7: "UX Utilitaire",
    contact_eyebrow: "Contact",
    contact_title: "Discutons d'un projet ou d'une collaboration",
    contact_desc: "L'email et Discord sont disponibles. Les démos publiques peuvent être ajoutées projet par projet.",
    copyright: "&copy; 2026 MSDOS - Tous droits réservés.",
    dialog_project: "Projet"
  },
  en: {
    meta_desc: "Developer Portfolio: 20 years of IT experience, Lua, Windows software, Roblox, automation, Discord bots, API, AI, local models, game servers and Chrome extensions.",
    og_title: "MSDOS | Developer Portfolio",
    og_desc: "Portfolio: 20 years of IT experience, Lua, Windows tools, automation, Roblox, Discord bots, API, AI, local models, game servers and local-first software.",
    site_title: "MSDOS | Developer Portfolio",
    brand_tagline: "Tools / Roblox / Automation",
    nav_projects: "Projects",
    nav_skills: "Skills",
    nav_contact: "Contact",
    hero_date: "Technical Portfolio - May 2026",
    hero_title: "Tools, Automation & Roblox",
    hero_lead: "Passionate about computing since age 13, I often create my own software to meet my needs. I primarily work in Lua, sometimes on several projects in parallel, and I continue to learn other languages, technologies, and AI to stay up to date.",
    btn_projects: "View Projects",
    btn_contact: "Contact Me",
    terminal_content: "C:\\>PROFILE.EXE /SCAN\n\n[SCANNING PROFILE...]\nEXPERIENCE=20_YEARS\nFOCUS=TOOLS,AUTOMATION,ROBLOX,APIS,AI\nLANGUAGE=LUA\nWORKFLOW=MULTI_PROJECT,NEEDS_DRIVEN\nSERVERS=MINECRAFT,GMOD,FIVEM\nLEGACY=EARLY_ANTICHEATS_GMOD\nAI_STACK=CLAUDE,GEMINI,DEEPSEEK,LOCAL\nMODE=PASSION_DRIVEN,LOCAL_FIRST",
    metric_years: "years",
    metric_it: "Computing",
    metric_lang: "Primary Language",
    metric_watch: "Watch",
    metric_tech: "Tech & AI",
    focus_eyebrow: "What I Build",
    focus_title: "Tools that solve real-world problems",
    focus_desktop: "Desktop Applications",
    focus_desktop_desc: "Windows optimization, maintenance, Android debloating, local translation, and tool management.",
    focus_automation: "Automation & Bots",
    focus_automation_desc: "Complete Discord bots, personal APIs, web automation, moderation, logs, and persistent systems.",
    focus_gaming: "Gaming Experiences",
    focus_gaming_desc: "Roblox games, ultra-modded servers, semi-3D map generation, and long-term gameplay.",
    exp_20_title: "20 Years of Experience",
    exp_20_desc: "In computing since age 13, with continuous practice of tools, servers, scripts, and software.",
    exp_anticheat_title: "GMod / DarkRP Anticheats",
    exp_anticheat_desc: "Work on anticheats during the early years of GMod/DarkRP, among the first projects of its kind.",
    strip_servers_title: "Servers & Communities",
    strip_servers_desc: "Moderator, Head Mod, and Developer on several game servers and active communities (Minecraft, GMod, FiveM).",
    exp_api_title: "APIs & Passion",
    exp_api_desc: "Use and creation of personal APIs to connect tools, automate workflows, and go faster.",
    exp_ai_title: "AI & Local Models",
    exp_ai_desc: "Work with Claude, Gemini, DeepSeek, CLI versions, and many local models to test, compare, and integrate AI.",
    exp_learning_title: "Continuous Learning",
    exp_learning_desc: "Primary base in Lua, exploration of other languages, permanent watch on new technologies, and parallel work on multiple projects.",
    projects_eyebrow: "Projects",
    projects_title: "Selection of Work",
    search_placeholder: "Search for a project or skill",
    filter_all: "All",
    filter_desktop: "Desktop",
    filter_automation: "Automation",
    filter_game: "Games",
    filter_security: "Security",
    filter_extension: "Extensions",
    type_desktop: "Desktop app",
    type_windows: "Windows tool",
    type_security: "Security awareness",
    type_game_sec: "Game security",
    type_utility: "Utility",
    type_game_tool: "Game tool",
    type_roblox: "Roblox",
    type_legacy: "Legacy",
    type_servers: "Game servers",
    type_local: "Local app",
    type_android: "Android tool",
    type_discord: "Discord bot",
    type_maintenance: "Maintenance",
    type_browser: "Browser extensions",
    type_ai: "AI workflows",
    p_rbx_manager: "New generation Roblox Manager with many features, designed to quickly manage multiple accounts and actions.",
    link_discord: "Join Discord",
    p_rbx_creation: "Creation of full experiences.",
    title_optimizer: "Technician Optimization Tool",
    p_optimizer: "Hyper-complete tool to speed up, clean, diagnose, and apply useful settings on PC.",
    title_cameras: "Exposed Cameras Audit",
    p_cameras: "Discovery of poorly secured cameras for audit, awareness, and prevention purposes.",
    title_anticheat: "GMod / DarkRP Anticheats",
    p_anticheat: "Work on anticheats in the early years of GMod/DarkRP, among the first projects of its kind.",
    title_restart: "Simple PC Restart",
    p_restart: "Minimalist software to restart a PC quickly with a clear and direct interface.",
    title_parallax: "Semi-3D Map Generation",
    p_parallax: "Automatic generation of maps with Parallax layers to produce a semi-3D rendering.",
    title_rbx_games: "Roblox Video Games",
    p_rbx_games: "Creation of several Roblox experiences with gameplay, progression, and interface systems.",
    title_rbx_exploit: "Roblox Exploit (Legacy)",
    p_rbx_exploit: "Massive creation of scripts (2K+) for Roblox. This activity is now closed but forged a solid expertise in Lua.",
    title_servers: "Ultra-Modded Game Servers",
    p_servers: "Creation of Minecraft, GMod, FiveM servers, and other heavily customized environments.",
    title_subtitles: "Bulk Subtitle Translator",
    p_subtitles: "Quick translation of subtitles into multiple languages, full local and easy to use.",
    title_android: "PC Android Debloater",
    p_android: "PC tool to clean an Android device, remove useless apps, and simplify maintenance.",
    title_discord: "Complete Discord Bot",
    p_discord: "Mini-games, complete dungeon/trading/farming game, moderation, logs, and continuous maintenance for 2+ years.",
    title_updater: "1-Click Software Update",
    p_updater: "Quick update of installed applications, with retrieval from official sources.",
    title_extension: "Chrome Extensions",
    p_extension: "Audio visualizer, price per kilo to compare food orders, web automations, and practical tools.",
    title_ai: "AI Experimentation & Local Models",
    p_ai: "Claude, Gemini, DeepSeek, CLI versions, and dozens of local models tested to compare behaviors and integrate them into tools.",
    skill_dev_title: "Development",
    skill_dev_1: "Desktop Applications",
    skill_dev_2: "Simple & Effective Interfaces",
    skill_dev_3: "Software created for my needs",
    skill_dev_4: "Creation of Personal APIs",
    skill_dev_5: "AI, LLMs & Local Models",
    skill_dev_6: "Parallel Projects",
    skill_dev_7: "Workflow Automation",
    skill_sys_title: "System & Maintenance",
    skill_sys_1: "Windows Optimization",
    skill_sys_2: "Diagnosis & Cleaning",
    skill_sys_3: "Software Update",
    skill_sys_4: "ADB / Android Debloating",
    skill_sys_5: "Technician Scripts",
    skill_game_title: "Gaming & Communities",
    skill_game_1: "Roblox / Lua",
    skill_game_2: "Lua as Primary Language",
    skill_game_3: "Gameplay Systems",
    skill_game_4: "Minecraft / GMod / FiveM Servers",
    skill_game_5: "GMod / DarkRP Anticheats",
    skill_game_6: "Discord Bots",
    skill_game_7: "Farming/Trading Economies",
    skill_web_title: "Web & Extensions",
    skill_web_1: "Chrome Extensions",
    skill_web_2: "Web Automation",
    skill_web_3: "Claude / Gemini / DeepSeek CLI",
    skill_web_4: "New Tech Watch",
    skill_web_5: "Audio Visualizers",
    skill_web_6: "Practical Comparators",
    skill_web_7: "Utility UX",
    contact_eyebrow: "Contact",
    contact_title: "Let's discuss a project or collaboration",
    contact_desc: "Email and Discord are available. Public demos can be added project by project.",
    copyright: "&copy; 2026 MSDOS - All rights reserved.",
    dialog_project: "Project"
  }
};

function updateLanguage(lang) {
  document.querySelectorAll("[data-t]").forEach(el => {
    const key = el.getAttribute("data-t");
    if (translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });

  document.querySelectorAll("[data-t-placeholder]").forEach(el => {
    const key = el.getAttribute("data-t-placeholder");
    if (translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  document.querySelectorAll("[data-t-content]").forEach(el => {
    const key = el.getAttribute("data-t-content");
    if (translations[lang][key]) {
      el.setAttribute("content", translations[lang][key]);
    }
  });

  if (langDot) {
    langDot.style.left = lang === "fr" ? "1.4rem" : "0.2rem";
  }

  document.documentElement.lang = lang;
}

langToggle?.addEventListener("click", () => {
  currentLang = currentLang === "en" ? "fr" : "en";
  localStorage.setItem("portfolio-lang", currentLang);
  updateLanguage(currentLang);
});

// Initialize language
updateLanguage(currentLang);
