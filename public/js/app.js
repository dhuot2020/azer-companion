'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('mobileMenuButton');
    const menu = document.getElementById('sideMenu');

    if (!button || !menu) {
        return;
    }

    button.addEventListener('click', () => {
        menu.classList.toggle('is-open');
    });
});
