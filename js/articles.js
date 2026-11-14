/* Article folders overview. */
(function () {
  "use strict";

  var grid = document.getElementById("folder-grid");
  if (!grid) return;

  var icons = {
    icpc: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 7 4 12l4 5M16 7l4 5-4 5M13.5 5l-3 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    algorithms:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="2.1" stroke="currentColor" stroke-width="1.4"/><circle cx="18" cy="7" r="2.1" stroke="currentColor" stroke-width="1.4"/><circle cx="9" cy="18" r="2.1" stroke="currentColor" stroke-width="1.4"/><circle cx="18" cy="17" r="2.1" stroke="currentColor" stroke-width="1.4"/><path d="m8 6.5 7.9.4M7 8l1.5 7.8M11 18h5M16.5 16l.9-7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    club: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="9" cy="8.5" r="2.7" stroke="currentColor" stroke-width="1.4"/><path d="M3.8 18c.4-3 2.4-4.7 5.2-4.7s4.8 1.7 5.2 4.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M15.4 6.4a2.5 2.5 0 0 1 0 4.8M16.6 13.6c2.1.4 3.3 1.9 3.6 4.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    misc: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v18M3.8 7.5l16.4 9M20.2 7.5l-16.4 9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/></svg>',
  };

  function safeText(value) {
    return BlogUI.escapeHTML(value || "");
  }

  function renderFolders(folders) {
    grid.innerHTML = folders
      .map(function (folder, index) {
        var count = Number(folder.count) || 0;
        var latest = folder.latest ? BlogUI.formatDate(folder.latest) : "尚未更新";
        return (
          '<a class="folder-card" href="notes.html?folder=' +
          encodeURIComponent(folder.id) +
          '" style="--folder-accent:' +
          safeText(folder.accent || "#34584b") +
          ";--folder-soft:" +
          safeText(folder.soft || "#edf3ef") +
          ";--order:" +
          index +
          '">' +
          '<span class="folder-card__top">' +
          '<span class="folder-card__icon">' +
          (icons[folder.id] || icons.misc) +
          "</span>" +
          '<span class="folder-card__index">Folder / ' +
          safeText(folder.glyph) +
          "</span>" +
          '<span class="folder-card__arrow" aria-hidden="true">' +
          '<svg viewBox="0 0 16 16" fill="none"><path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          "</span>" +
          "</span>" +
          '<span class="folder-card__en">' +
          safeText(folder.en) +
          "</span>" +
          "<h2>" +
          safeText(folder.name) +
          "</h2>" +
          '<span class="folder-card__description">' +
          safeText(folder.description) +
          "</span>" +
          '<span class="folder-card__bottom">' +
          "<span><strong>" +
          String(count).padStart(2, "0") +
          "</strong> 篇笔记</span>" +
          "<span>更新于 " +
          latest +
          "</span>" +
          "</span>" +
          "</a>"
        );
      })
      .join("");

    if (!folders.length) {
      grid.innerHTML =
        '<div class="empty-state"><div><h2>还没有文件夹</h2><p>等等再来看看。</p></div></div>';
    }
  }

  async function loadFolders() {
    grid.setAttribute("aria-busy", "true");
    try {
      var folders = await BlogAPI.getArticleFolders();
      renderFolders(folders);
    } catch (error) {
      grid.innerHTML =
        '<div class="error-state"><div><p>' +
        BlogUI.escapeHTML(error.message || "文件夹加载失败，请稍后再试。") +
        '</p><button class="button button--ghost folder-retry" type="button">重新加载</button></div></div>';
      var retry = grid.querySelector(".folder-retry");
      if (retry) retry.addEventListener("click", loadFolders);
    } finally {
      grid.setAttribute("aria-busy", "false");
    }
  }

  loadFolders();
})();
