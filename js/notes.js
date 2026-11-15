/* Paginated notes list for one folder. */
(function () {
  "use strict";

  var list = document.getElementById("notes-list");
  var pagination = document.getElementById("notes-pagination");
  if (!list) return;

  var folderId = BlogUI.readQuery("folder", "icpc");
  var requestedPage = BlogUI.positiveInt(BlogUI.readQuery("page", "1"), 1);
  var pageSize = 15;

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function setLoading() {
    list.setAttribute("aria-busy", "true");
    list.innerHTML = '<div class="loading-state"><p>正在读取笔记…</p></div>';
    pagination.innerHTML = "";
  }

  function showError(message) {
    list.innerHTML =
      '<div class="error-state"><div><p>' +
      BlogUI.escapeHTML(message || "笔记加载失败，请稍后再试。") +
      '</p><div class="error-state__actions"><button class="button button--ghost notes-retry" type="button">重新加载</button>' +
      '<a class="button button--ghost" href="articles.html">返回文章首页</a></div></div></div>';
    var retry = list.querySelector(".notes-retry");
    if (retry) retry.addEventListener("click", loadNotes);
  }

  function updateHeader(folder, result) {
    if (!folder) return;
    document.title = folder.name + " — Bring`s Blog";
    setText("notes-crumb", folder.name);
    setText("notes-description", folder.description);
    setText("notes-total", String(result.total).padStart(2, "0"));
    setText("notes-page-current", String(result.page).padStart(2, "0"));
    setText("notes-list-label", "Index / " + folder.glyph);

    var title = document.getElementById("notes-title");
    if (title) {
      title.innerHTML =
        BlogUI.escapeHTML(folder.name) + '<span class="title-dot">.</span>';
    }

    var eyebrow = document.getElementById("notes-eyebrow");
    if (eyebrow) {
      eyebrow.innerHTML =
        "<span>" +
        BlogUI.escapeHTML(folder.en || "Notes") +
        '</span><span class="eyebrow__line" aria-hidden="true"></span>Notes';
    }
  }

  function noteRow(note, index) {
    var number = String(index + 1).padStart(2, "0");

    return (
      '<a class="note-row" href="note.html?folder=' +
      encodeURIComponent(folderId) +
      "&amp;id=" +
      encodeURIComponent(note.id) +
      '" style="--order:' +
      index +
      '">' +
      '<span class="note-row__num">' +
      number +
      "</span>" +
      '<div class="note-row__body">' +
      "<h2>" +
      BlogUI.escapeHTML(note.title) +
      "</h2>" +
      '<span class="note-row__summary">' +
      BlogUI.escapeHTML(note.summary || "") +
      "</span>" +
      "</div>" +
      '<span class="note-row__arrow" aria-hidden="true">' +
      '<svg viewBox="0 0 16 16" fill="none"><path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      "</span>" +
      "</a>"
    );
  }

  function renderNotes(result) {
    var folder = result.folder;
    updateHeader(folder, result);

    if (!result.items.length) {
      list.innerHTML =
        '<div class="empty-state"><div><h2>这一页还没有笔记</h2><p>可以回到第一页看看。</p><a class="text-link" href="notes.html?folder=' +
        encodeURIComponent(folderId) +
        '">回到第 1 页</a></div></div>';
      pagination.innerHTML = "";
      return;
    }

    var start = (result.page - 1) * result.pageSize;
    list.innerHTML = result.items
      .map(function (note, index) {
        return noteRow(note, start + index);
      })
      .join("");

    pagination.innerHTML = BlogUI.renderPagination({
      page: result.page,
      totalPages: result.totalPages,
      label: "Pages",
      createHref: function (page) {
        return (
          "notes.html?folder=" +
          encodeURIComponent(folderId) +
          "&amp;page=" +
          page
        );
      },
    });
  }

  async function loadNotes() {
    setLoading();
    try {
      var result = await BlogAPI.getNotes(folderId, requestedPage, pageSize);

      if (result.totalPages > 0 && requestedPage > result.totalPages) {
        window.location.replace(
          "notes.html?folder=" +
            encodeURIComponent(folderId) +
            "&page=" +
            result.totalPages
        );
        return;
      }

      renderNotes(result);
    } catch (error) {
      setText("notes-title", "没有找到这个文件夹");
      setText("notes-description", "换一个文件夹，或者返回文章首页。");
      showError(error.message);
    } finally {
      list.setAttribute("aria-busy", "false");
    }
  }

  loadNotes();
})();
