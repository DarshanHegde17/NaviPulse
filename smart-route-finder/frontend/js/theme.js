const THEME_KEY = 'navipulse_theme';

function applyTheme(theme) {
    const root = document.documentElement;
    const isLight = theme === 'light';
    root.classList.toggle('theme-light', isLight);

    document.querySelectorAll('.fa-moon, .fa-sun').forEach((icon) => {
        icon.classList.remove('fa-moon', 'fa-sun');
        icon.classList.add(isLight ? 'fa-sun' : 'fa-moon');
        icon.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
    });
}

function toggleTheme() {
    const current = localStorage.getItem(THEME_KEY) || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
}

function initThemeToggle() {
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(saved);

    document.querySelectorAll('.fa-moon, .fa-sun').forEach((icon) => {
        icon.style.cursor = 'pointer';
        icon.addEventListener('click', toggleTheme);
    });
}

document.addEventListener('DOMContentLoaded', initThemeToggle);
