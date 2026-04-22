/**
 * dom.js — small DOM utility helpers used across modules.
 */

/**
 * Clamps a value between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/**
 * Query within a scope (defaults to document).
 * @param {string}      sel
 * @param {HTMLElement} [scope]
 * @returns {HTMLElement|null}
 */
export const qs = (sel, scope = document) => scope.querySelector(sel);

/**
 * Query all within a scope.
 * @param {string}      sel
 * @param {HTMLElement} [scope]
 * @returns {HTMLElement[]}
 */
export const qsa = (sel, scope = document) => [...scope.querySelectorAll(sel)];

/**
 * Create an element with optional className and innerHTML.
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [html]
 * @returns {HTMLElement}
 */
export function el(tag, className = '', html = '') {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html)      e.innerHTML = html;
  return e;
}
