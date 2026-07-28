"use strict";

function initializeCompassMenu() {
  const menu = document.getElementById("compassMenu");
  const wheel = document.getElementById("compassWheel");
  const openButton = document.getElementById("heroCompassButton");
  const closeButton = document.getElementById("compassMenuClose");
  const overlay = document.getElementById("compassMenuOverlay");
  const status = document.getElementById("compassMenuStatus");
  const actions = [...document.querySelectorAll("[data-compass-section]")];

  if (!menu || !wheel || !openButton || !closeButton || !overlay) return;

  let lastFocusedElement = null;
  let isLaunching = false;
  let compassRotation = 0;

  const getFocusableElements = () =>
    [...menu.querySelectorAll("a[href], button:not([disabled])")].filter(
      (element) => element.offsetParent !== null,
    );


  function pointCompassTo(clientX, clientY) {
    const rect = wheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientX - centerX, centerY - clientY) * (180 / Math.PI);

    compassRotation = angle;
    wheel.style.setProperty("--compass-rotation", `${angle.toFixed(2)}deg`);
  }

  function pointCompassToAction(action) {
    const rect = action.getBoundingClientRect();
    pointCompassTo(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  function resetCompassDirection() {
    compassRotation = 0;
    wheel.style.setProperty("--compass-rotation", "0deg");
  }

  function setActiveAction(action) {
    if (isLaunching) return;

    actions.forEach((item) => item.classList.toggle("is-active", item === action));

    if (!action) {
      wheel.removeAttribute("data-active");
      resetCompassDirection();
      if (status) status.textContent = "Survole une destination";
      return;
    }

    const section = action.dataset.compassSection || "destination";
    const label = action.dataset.compassLabel || section;
    wheel.dataset.active = section;
    if (status) status.textContent = `${label} — ouvrir cette destination`;
  }

  function resetLaunchState() {
    isLaunching = false;
    wheel.classList.remove("is-launching");
    actions.forEach((action) => action.classList.remove("is-launching"));
  }

  function openCompassMenu() {
    resetLaunchState();
    lastFocusedElement = document.activeElement;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    openButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("compass-menu-open");
    window.requestAnimationFrame(() => closeButton.focus());
  }

  function closeCompassMenu() {
    if (isLaunching) return;

    setActiveAction(null);
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    openButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("compass-menu-open");

    if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
    else openButton.focus();
  }

  function completeCompassNavigation(action) {
    const section = action.dataset.compassSection || "destination";
    const label = action.dataset.compassLabel || section;

    const matchingSidebarItem = [...document.querySelectorAll("#mainNav .nav-item")].find(
      (item) => item.textContent.trim().toLowerCase().includes(label.toLowerCase()),
    );

    if (matchingSidebarItem) {
      matchingSidebarItem.click();
    } else {
      window.dispatchEvent(
        new CustomEvent("azer:compass-select", {
          detail: { section, label },
        }),
      );
    }

    resetLaunchState();
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    openButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("compass-menu-open");
  }

  function activateCompassSection(action) {
    if (isLaunching) return;

    isLaunching = true;
    actions.forEach((item) => {
      item.classList.toggle("is-active", item === action);
      item.classList.toggle("is-launching", item === action);
    });

    wheel.dataset.active = action.dataset.compassSection || "destination";
    wheel.classList.add("is-launching");

    const label = action.dataset.compassLabel || "Destination";
    if (status) status.textContent = `${label} — ouverture...`;

    window.setTimeout(() => completeCompassNavigation(action), 440);
  }

  openButton.addEventListener("click", openCompassMenu);
  closeButton.addEventListener("click", closeCompassMenu);
  overlay.addEventListener("click", closeCompassMenu);

  actions.forEach((action) => {
    action.addEventListener("mouseenter", () => {
      setActiveAction(action);
      pointCompassToAction(action);
    });
    action.addEventListener("mousemove", (event) => pointCompassTo(event.clientX, event.clientY));
    action.addEventListener("focus", () => {
      setActiveAction(action);
      pointCompassToAction(action);
    });
    action.addEventListener("click", (event) => {
      event.preventDefault();
      activateCompassSection(action);
    });
  });

  wheel.addEventListener("mouseleave", () => setActiveAction(null));

  document.addEventListener("keydown", (event) => {
    if (!menu.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeCompassMenu();
      return;
    }

    if (event.key !== "Tab" || isLaunching) return;

    const focusableElements = getFocusableElements();
    if (!focusableElements.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });
}

document.addEventListener("DOMContentLoaded", initializeCompassMenu);
