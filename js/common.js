/* Shared UI helpers. No dependencies. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var page = document.body ? document.body.dataset.page : "";
  var navGroup = {
    articles: "articles",
    notes: "articles",
    note: "articles",
  }[page] || page;

  if (navGroup) {
    var activeLink = document.querySelector(
      '.site-nav a[data-nav="' + navGroup + '"]'
    );
    if (activeLink) activeLink.setAttribute("aria-current", "page");
  }

  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  /* Mobile navigation ----------------------------------------------------- */
  var menuButton = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".site-nav");

  function setMenu(open) {
    if (!menuButton) return;
    document.body.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("click", function (event) {
      if (!document.body.classList.contains("menu-open")) return;
      if (!event.target.closest(".site-nav") && !event.target.closest(".menu-toggle")) {
        setMenu(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 720) setMenu(false);
    });
  }

  /* Reveal on scroll ------------------------------------------------------ */
  var revealObserver = null;
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.08 }
    );
  }

  function observeReveals() {
    document.querySelectorAll("[data-reveal]").forEach(function (node) {
      if (node.dataset.revealBound === "true") return;
      node.dataset.revealBound = "true";
      if (revealObserver) {
        revealObserver.observe(node);
      } else {
        node.classList.add("is-visible");
      }
    });
  }

  observeReveals();

  /* Helpers exposed to page scripts -------------------------------------- */
  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(value) {
    if (!value) return "";
    var parts = String(value).split("-");
    if (parts.length !== 3) return String(value);
    return parts[0] + "." + parts[1] + "." + parts[2];
  }

  function readQuery(name, fallback) {
    var params = new URLSearchParams(window.location.search);
    var value = params.get(name);
    return value === null || value === "" ? fallback : value;
  }

  function positiveInt(value, fallback) {
    var parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  /**
   * Render a compact pagination control.
   * createHref receives a page number and must return a safe href.
   */
  function renderPagination(options) {
    var pageNumber = options.page;
    var totalPages = options.totalPages;
    if (!totalPages || totalPages < 2) return "";

    var hrefFor = options.createHref;
    var label = options.label || "PAGE";
    var parts = [
      '<nav class="pagination" aria-label="分页导航">',
      '<span class="pagination__label">' + escapeHTML(label) + "</span>",
    ];

    if (pageNumber > 1) {
      parts.push(
        '<a class="page-button page-button--arrow" href="' +
          hrefFor(pageNumber - 1) +
          '" aria-label="上一页">←</a>'
      );
    } else {
      parts.push(
        '<span class="page-button page-button--arrow page-button--disabled" aria-hidden="true">←</span>'
      );
    }

    var start = Math.max(1, pageNumber - 2);
    var end = Math.min(totalPages, pageNumber + 2);

    if (start > 1) {
      parts.push(
        '<a class="page-button" href="' + hrefFor(1) + '" aria-label="第 1 页">1</a>'
      );
      if (start > 2) {
        parts.push('<span class="page-button page-button--disabled" aria-hidden="true">…</span>');
      }
    }

    for (var current = start; current <= end; current += 1) {
      if (current === pageNumber) {
        parts.push(
          '<span class="page-button" aria-current="page" aria-label="当前第 ' +
            current +
            ' 页">' +
            current +
            "</span>"
        );
      } else {
        parts.push(
          '<a class="page-button" href="' +
            hrefFor(current) +
            '" aria-label="第 ' +
            current +
            ' 页">' +
            current +
            "</a>"
        );
      }
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        parts.push('<span class="page-button page-button--disabled" aria-hidden="true">…</span>');
      }
      parts.push(
        '<a class="page-button" href="' +
          hrefFor(totalPages) +
          '" aria-label="第 ' +
          totalPages +
          ' 页">' +
          totalPages +
          "</a>"
      );
    }

    if (pageNumber < totalPages) {
      parts.push(
        '<a class="page-button page-button--arrow" href="' +
          hrefFor(pageNumber + 1) +
          '" aria-label="下一页">→</a>'
      );
    } else {
      parts.push(
        '<span class="page-button page-button--arrow page-button--disabled" aria-hidden="true">→</span>'
      );
    }

    parts.push("</nav>");
    return parts.join("");
  }

  window.BlogUI = {
    escapeHTML: escapeHTML,
    formatDate: formatDate,
    readQuery: readQuery,
    positiveInt: positiveInt,
    renderPagination: renderPagination,
    observeReveals: observeReveals,
    setMenu: setMenu,
  };
})();
