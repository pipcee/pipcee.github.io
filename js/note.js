/* Single note view. Body HTML comes from the trusted mock/backend. */
(function () {
  "use strict";

  var title = document.getElementById("note-title");
  var summary = document.getElementById("note-summary");
  var meta = document.getElementById("note-meta");
  var body = document.getElementById("note-body");
  var end = document.getElementById("note-end");
  var series = document.getElementById("note-series");
  if (!body) return;

  var noteId = BlogUI.readQuery("id", "");

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function folderHref(folder) {
    return folder
      ? "notes.html?folder=" + encodeURIComponent(folder.id)
      : "notes.html";
  }

  function seriesCard(label, note, folder, direction) {
    if (!note) return "";
    return (
      '<a class="note-series__card note-series__card--' +
      direction +
      '" href="note.html?id=' +
      encodeURIComponent(note.id) +
      '">' +
      '<span class="note-series__label">' +
      label +
      "</span>" +
      "<h2>" +
      BlogUI.escapeHTML(note.title) +
      "</h2>" +
      '<span class="note-series__meta">' +
      BlogUI.formatDate(note.date) +
      " · " +
      (Number(note.readingTime) || 1) +
      " min</span>" +
      "</a>"
    );
  }

  function showError(message, folder) {
    document.title = "没有找到这篇笔记 — Bring`s Blog";
    setText("note-title", "没有找到这篇笔记");
    summary.textContent = "";
    meta.innerHTML = "";
    setText("note-crumb-title", "未找到");
    body.innerHTML =
      '<div class="error-state"><div><p>' +
      BlogUI.escapeHTML(message || "这篇笔记可能已经移动或删除。") +
      '</p><a class="button button--ghost" href="' +
      (folder ? folderHref(folder) : "articles.html") +
      '">返回笔记列表</a></div></div>';
    end.hidden = true;
    series.innerHTML = "";
  }

  function renderNote(result) {
    var note = result.note;
    var folder = result.folder || null;
    var pageTitle = (folder ? folder.name + " · " : "") + note.title;
    document.title = pageTitle + " — Bring`s Blog";

    var kicker = document.getElementById("note-kicker");
    if (kicker) {
      kicker.innerHTML =
        "<span>" +
        BlogUI.escapeHTML(folder ? folder.en : "Note") +
        '</span><span class="eyebrow__line" aria-hidden="true"></span>' +
        BlogUI.formatDate(note.date);
    }

    title.textContent = note.title;
    summary.textContent = note.summary || "";
    setText("note-crumb-title", note.title);

    var crumbFolder = document.getElementById("note-crumb-folder");
    if (crumbFolder) {
      crumbFolder.textContent = folder ? folder.name : "笔记";
      crumbFolder.href = folderHref(folder);
    }

    var tags = (note.tags || [])
      .map(function (tag) {
        return '<span class="tag">' + BlogUI.escapeHTML(tag) + "</span>";
      })
      .join("");

    meta.innerHTML =
      '<span class="note-meta__item">' +
      BlogUI.escapeHTML(note.date) +
      "</span>" +
      '<span class="note-meta__divider" aria-hidden="true"></span>' +
      '<span class="note-meta__item">' +
      (Number(note.readingTime) || 1) +
      " 分钟阅读</span>" +
      (tags ? '<span class="tag-list note-meta__tags">' + tags + "</span>" : "");

    body.innerHTML = note.body || "<p>这篇笔记还没有正文。</p>";
    end.hidden = false;

    var back = document.getElementById("note-back");
    if (back) {
      back.href = folder ? folderHref(folder) + "&page=1" : "articles.html";
    }

    series.innerHTML =
      seriesCard("Newer note", result.previous, folder, "prev") +
      seriesCard("Older note", result.next, folder, "next");
    if (!series.innerHTML) series.hidden = true;
  }

  async function loadNote() {
    if (!noteId) {
      showError("链接里缺少笔记编号。", null);
      return;
    }

    try {
      var result = await BlogAPI.getNote(noteId);
      renderNote(result);
    } catch (error) {
      showError(error.message, null);
    }
  }

  loadNote();
})();
