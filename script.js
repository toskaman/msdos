const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const storedTheme = localStorage.getItem("portfolio-theme");

if (storedTheme) {
  root.dataset.theme = storedTheme;
}

themeToggle?.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem("portfolio-theme", nextTheme);
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
