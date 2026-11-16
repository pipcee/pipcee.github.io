/* Single note view. Body HTML comes from the trusted mock/backend. */
(function () {
  "use strict";

  var title = document.getElementById("note-title");
  var body = document.getElementById("note-body");
  var end = document.getElementById("note-end");
  if (!body) return;

  var noteId = BlogUI.readQuery("id", "");

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function folderById(folderId, folders) {
    return folders.filter(function (item) {
      return item.id === folderId;
    })[0] || null;
  }

  function crumbChain(folder, folders) {
    var chain = [];
    var node = folder;
    var guard = 0;
    while (node && guard < 50) {
      chain.unshift(node);
      node = node.parent ? folderById(node.parent, folders) : null;
      guard += 1;
    }
    return chain;
  }

  function folderHref(folder) {
    return folder
      ? "notes.html?folder=" + encodeURIComponent(folder.id)
      : "notes.html";
  }

  function showError(message, folder) {
    document.title = "没有找到这篇笔记 — Bring`s Blog";
    setText("note-title", "没有找到这篇笔记");
    setText("note-crumb-title", "未找到");
    body.innerHTML =
      '<div class="error-state"><div><p>' +
      BlogUI.escapeHTML(message || "这篇笔记可能已经移动或删除。") +
      '</p><a class="button button--ghost" href="' +
      (folder ? folderHref(folder) : "articles.html") +
      '">返回笔记列表</a></div></div>';
    end.hidden = true;
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
        '</span><span class="eyebrow__line" aria-hidden="true"></span>Notes';
    }

    title.textContent = note.title;
    setText("note-crumb-title", note.title);

    var crumbFolder = document.getElementById("note-crumb-folder");
    if (crumbFolder) {
      if (folder) {
        var chain = crumbChain(folder, result.folders || []);
        crumbFolder.innerHTML = chain
          .map(function (node, index) {
            var last = index === chain.length - 1;
            var label = BlogUI.escapeHTML(node.name);
            if (last) return label;
            return (
              '<a href="notes.html?folder=' + encodeURIComponent(node.id) + '">' + label + "</a>" +
              '<span class="breadcrumb__sep" aria-hidden="true">/</span>'
            );
          })
          .join("");
        crumbFolder.href = folderHref(folder);
      } else {
        crumbFolder.textContent = "笔记";
      }
    }

    if (note.body) {
      body.innerHTML = note.body;
    } else {
      body.innerHTML =
        '<div class="empty-state"><div><h3>正文还没有生成</h3>' +
        "<p>原始 Markdown 已经上传，等待后台把笔记处理成 HTML。</p></div></div>";
    }
    end.hidden = false;

    var back = document.getElementById("note-back");
    if (back) {
      back.href = folder ? folderHref(folder) + "&page=1" : "articles.html";
    }

  }

  async function loadNote() {
    if (!noteId) {
      showError("链接里缺少笔记编号。", null);
      return;
    }

    try {
      var result = await BlogAPI.getNote(noteId);
      result.folders = await BlogAPI.getArticleFolders();
      renderNote(result);
    } catch (error) {
      showError(error.message, null);
    }
  }

  loadNote();
})();
