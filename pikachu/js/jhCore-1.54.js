/*
 * Offline DOM helper.
 *
 * The original game only needs ready(), attr(), and val(). Keeping those small
 * operations local removes the legacy library's unused AJAX/network code.
 */
(function (window, document) {
  "use strict";

  function Collection(elements) {
    this.elements = elements;
    this[0] = elements[0] || null;
  }

  Collection.prototype.attr = function (name, value) {
    if (typeof value === "undefined") {
      return this[0] ? this[0].getAttribute(name) : undefined;
    }
    this.elements.forEach(function (element) {
      element.setAttribute(name, value);
    });
    return this;
  };

  Collection.prototype.val = function (value) {
    if (typeof value === "undefined") {
      return this[0] ? this[0].value : undefined;
    }
    this.elements.forEach(function (element) {
      element.value = value;
    });
    return this;
  };

  function jh(selector) {
    if (typeof selector === "function") {
      return jh.ready(selector);
    }
    if (selector instanceof Element) {
      return new Collection([selector]);
    }
    return new Collection(Array.prototype.slice.call(document.querySelectorAll(selector)));
  }

  jh.ready = function (callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  };

  window.jh = jh;
})(window, document);