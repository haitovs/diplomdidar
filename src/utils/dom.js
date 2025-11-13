export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

export const formatPercent = (value) => `${Math.round(value * 100)}%`;

export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export const lerp = (start, end, t) => start + (end - start) * t;

export const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
