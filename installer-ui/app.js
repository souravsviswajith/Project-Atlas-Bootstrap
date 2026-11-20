const views = [...document.querySelectorAll(".view")];
const navLinks = [...document.querySelectorAll("[data-view]")];
const breadcrumb = document.querySelector("#breadcrumb-current");
const sidebar = document.querySelector("#sidebar");

function showView(name) {
  const target = document.querySelector("#view-" + name);
  if (!target) return;
  views.forEach((view) => view.classList.toggle("active", view === target));
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.view === name));
  const activeLink = navLinks.find((link) => link.dataset.view === name);
  breadcrumb.textContent = activeLink ? activeLink.textContent.trim() : "Overview";
  sidebar.classList.remove("open");
  document.querySelector("#mobile-menu").setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navLinks.forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  const name = link.dataset.view;
  history.replaceState(null, "", "#" + name);
  showView(name);
}));

const mobileMenu = document.querySelector("#mobile-menu");
mobileMenu.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  mobileMenu.setAttribute("aria-expanded", String(open));
});

const targetOs = document.querySelector("#target-os");
const distroField = document.querySelector("#distro-field");
const environmentField = document.querySelector("#environment-field");
const wslField = document.querySelector("#wsl-field");
const targetEnvironment = document.querySelector("#target-environment");

function updateTargetFields() {
  const linux = targetOs.value === "linux";
  distroField.classList.toggle("hidden", !linux);
  environmentField.classList.toggle("hidden", !linux);
  wslField.classList.toggle("hidden", !linux || targetEnvironment.value !== "wsl");
}
targetOs.addEventListener("change", updateTargetFields);
targetEnvironment.addEventListener("change", updateTargetFields);

const catalogue = document.querySelector("#catalogue");
const search = document.querySelector("#catalogue-search");
const category = document.querySelector("#catalogue-category");
const cards = [...catalogue.querySelectorAll(".software-card")];
const selectedCount = document.querySelector("#selected-count");
const selectionSummary = document.querySelector("#selection-summary");
const reviewList = document.querySelector("#review-list");

function selectedItems() {
  return cards.filter((card) => card.querySelector("input").checked);
}

function refreshSelection() {
  const selected = selectedItems();
  selectedCount.textContent = String(selected.length);
  selectionSummary.textContent = selected.length
    ? selected.map((card) => card.querySelector("strong").textContent).join(" · ")
    : "Nothing selected yet";
  reviewList.replaceChildren();
  if (!selected.length) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = "No components selected.";
    reviewList.append(empty);
  } else {
    selected.forEach((card) => {
      const item = document.createElement("li");
      item.textContent = card.querySelector("strong").textContent;
      reviewList.append(item);
    });
  }
  filterCatalogue();
}

function filterCatalogue() {
  const query = search.value.trim().toLowerCase();
  const selectedCategory = category.value;
  let visible = 0;
  cards.forEach((card) => {
    const matchesQuery = (card.dataset.name + " " + card.textContent).toLowerCase().includes(query);
    const matchesCategory = selectedCategory === "all" || card.dataset.category === selectedCategory;
    const show = matchesQuery && matchesCategory;
    card.classList.toggle("hidden", !show);
    if (show) visible += 1;
  });
  document.querySelector("#catalogue-empty").classList.toggle("hidden", visible !== 0);
}
cards.forEach((card) => card.querySelector("input").addEventListener("change", refreshSelection));
search.addEventListener("input", filterCatalogue);
category.addEventListener("change", filterCatalogue);

const stacks = {
  "python-backend": ["python", "git", "postgres"],
  "modern-web": ["node", "git", "vscode"],
  flutter: ["flutter", "android", "git"],
  devops: ["docker", "kubernetes", "terraform", "cloud-cli"],
  systems: ["cpp", "cmake", "git"],
  data: ["python", "postgres", "redis", "docker"]
};

document.querySelectorAll(".stack-select").forEach((button) => {
  button.addEventListener("click", () => {
    const ids = stacks[button.dataset.stack] || [];
    ids.forEach((id) => {
      const input = catalogue.querySelector('input[value="' + id + '"]');
      if (input) input.checked = true;
    });
    refreshSelection();
    button.textContent = "Added to selection";
    button.classList.add("button-primary");
    window.setTimeout(() => {
      button.textContent = "Add stack";
      button.classList.remove("button-primary");
    }, 1400);
  });
});

document.querySelector("#clear-selection").addEventListener("click", () => {
  cards.forEach((card) => { card.querySelector("input").checked = false; });
  refreshSelection();
});

document.querySelectorAll(".check-row input").forEach((input) => {
  input.addEventListener("change", () => {
    const badge = input.closest(".check-row").querySelector(".state-badge");
    badge.textContent = input.checked ? "Marked for review" : "Not checked";
    badge.classList.toggle("state-pending", !input.checked);
  });
});

const initialView = location.hash.replace("#", "");
showView(views.some((view) => view.id === "view-" + initialView) ? initialView : "overview");
refreshSelection();
