"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("mobileMenuButton");
  const menu = document.getElementById("sideMenu");

  if (!button || !menu) {
    return;
  }

  button.addEventListener("click", () => {
    menu.classList.toggle("is-open");
  });
});
/*==========================================================
  SIDEBAR NAVIGATION
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("mainNav");

  if (!nav) return;

  const items = [...nav.querySelectorAll(".nav-item")];

  let current = items.findIndex((item) => item.classList.contains("active"));

  if (current < 0) current = 0;

  function select(index) {
    index = Math.max(0, Math.min(index, items.length - 1));

    items.forEach((item) => item.classList.remove("active"));

    items[index].classList.add("active");

    items[index].focus({
      preventScroll: true,
    });

    current = index;
  }

  items.forEach((item, index) => {
    item.setAttribute("tabindex", "0");

    item.addEventListener("click", (e) => {
      e.preventDefault();

      select(index);
    });
  });

  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();

        select(current + 1);

        break;

      case "ArrowUp":
        e.preventDefault();

        select(current - 1);

        break;

      case "Home":
        e.preventDefault();

        select(0);

        break;

      case "End":
        e.preventDefault();

        select(items.length - 1);

        break;

      case "Enter":

      case " ":
        e.preventDefault();

        items[current].click();

        break;
    }
  });
});
