/* Paginated resource downloads. */
(function () {
  "use strict";

  var list = document.getElementById("resource-list");
  var pagination = document.getElementById("resource-pagination");
  var metaLine = document.getElementById("resources-meta");
  if (!list) return;

  var requestedPage = BlogUI.positiveInt(BlogUI.readQuery("page", "1"), 1);
  var pageSize = 4;

  function safeLink(value) {
    var trimmed = String(value || "").trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return "";
  }

  function downloadLink(value) {
    var trimmed = String(value || "").trim();
    if (!trimmed || /^(javascript|data|vbscript):/i.test(trimmed)) return "";
    return trimmed;
  }

  function fileBadge(type) {
    return (
      '<span class="file-badge" aria-hidden="true">' +
      '<svg viewBox="0 0 32 40" fill="none"><path d="M4 1.5h16l8 8V38.5H4V1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M20 1.5v8h8" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M9 21h14M9 26h9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".5"/></svg>' +
      '<span class="file-badge__type">' +
      BlogUI.escapeHTML(type || "FILE") +
      "</span>" +
      "</span>"
    );
  }

  function resourceCard(resource, index) {
    var href = safeLink(resource.url);
    var downloadHref = downloadLink(resource.downloadUrl || resource.file);
    var version = BlogUI.escapeHTML(resource.version || "v1.0");
    var source = href
      ? '<a class="button button--ghost resource-url" href="' +
        BlogUI.escapeHTML(href) +
        '" target="_blank" rel="noopener noreferrer" aria-label="打开 ' +
        BlogUI.escapeHTML(resource.name) +
        ' 的来源 URL（新窗口）">URL</a>'
      : '<span class="button button--ghost button--disabled" aria-disabled="true">URL</span>';
    var download = downloadHref
      ? '<a class="button button--dark resource-download" href="' +
        BlogUI.escapeHTML(downloadHref) +
        '" download="' +
        BlogUI.escapeHTML(resource.filename) +
        '" data-download-id="' +
        BlogUI.escapeHTML(resource.id) +
        '" aria-label="下载 ' +
        BlogUI.escapeHTML(resource.name + "（" + resource.filename + "）") +
        '">下载</a>'
      : '<span class="button button--dark button--disabled" aria-disabled="true">下载</span>';

    return (
      '<article class="resource-card" style="--order:' +
      index +
      '">' +
      '<div class="resource-card__main">' +
      fileBadge(resource.type) +
      '<div class="resource-card__identity">' +
      '<div class="resource-card__title-row">' +
      "<h2>" +
      BlogUI.escapeHTML(resource.name) +
      "</h2>" +
      '<span class="version-pill">' +
      version +
      "</span>" +
      "</div>" +
      '<p class="resource-card__filename">' +
      BlogUI.escapeHTML(resource.filename) +
      "</p>" +
      '<p class="resource-card__description">' +
      BlogUI.escapeHTML(resource.description || "") +
      "</p>" +
      "</div>" +
      "</div>" +
      '<div class="resource-card__footer">' +
      '<div class="resource-card__meta">' +
      '<div class="md5-field"><span>MD5</span><code>' +
      BlogUI.escapeHTML(resource.md5 || "—") +
      "</code></div>" +
      '<p class="resource-card__submeta"><span>更新 ' +
      BlogUI.escapeHTML(resource.updated || "—") +
      "</span><span>" +
      BlogUI.escapeHTML(resource.size || "—") +
      "</span></p>" +
      "</div>" +
      '<div class="resource-card__actions">' +
      '<span class="resource-file-index">FILE / ' +
      String(index + 1).padStart(2, "0") +
      "</span>" +
      '<div class="resource-actions">' +
      source +
      download +
      "</div>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function renderResources(result) {
    if (!result.items.length) {
      list.innerHTML =
        '<div class="empty-state"><div><h2>这一页还没有文件</h2><p>回到第一页看看。</p><a class="text-link" href="resources.html">回到第 1 页</a></div></div>';
      pagination.innerHTML = "";
      return;
    }

    list.innerHTML = result.items
      .map(function (resource, index) {
        return resourceCard(resource, (result.page - 1) * result.pageSize + index);
      })
      .join("");

    pagination.innerHTML = BlogUI.renderPagination({
      page: result.page,
      totalPages: result.totalPages,
      label: "Pages",
      createHref: function (page) {
        return "resources.html?page=" + page;
      },
    });

    if (metaLine) {
      metaLine.innerHTML =
        "<span>" +
        String(result.total).padStart(2, "0") +
        ' files</span><span aria-hidden="true">/</span><span>' +
        String(result.totalPages).padStart(2, "0") +
        " pages · MD5 可校验</span>";
    }
  }

  function setLoading() {
    list.setAttribute("aria-busy", "true");
    list.innerHTML = '<div class="loading-state"><p>正在读取文件列表…</p></div>';
    pagination.innerHTML = "";
  }

  function showError(message) {
    list.innerHTML =
      '<div class="error-state"><div><p>' +
      BlogUI.escapeHTML(message || "文件列表加载失败，请稍后再试。") +
      '</p><button class="button button--ghost resource-retry" type="button">重新加载</button></div></div>';
    var retry = list.querySelector(".resource-retry");
    if (retry) retry.addEventListener("click", loadResources);
  }

  async function loadResources() {
    setLoading();
    try {
      var result = await BlogAPI.getResources(requestedPage, pageSize);

      if (result.totalPages > 0 && requestedPage > result.totalPages) {
        window.location.replace("resources.html?page=" + result.totalPages);
        return;
      }

      renderResources(result);
    } catch (error) {
      showError(error.message);
    } finally {
      list.setAttribute("aria-busy", "false");
    }
  }

  // [后端预留] Fire-and-forget download logging; actual download is a plain
  // browser navigation, so analytics failure can never block the file.
  list.addEventListener("click", function (event) {
    var download = event.target.closest("[data-download-id]");
    if (!download) return;
    BlogAPI.logDownload(download.getAttribute("data-download-id")).catch(
      function () {
        /* intentionally silent */
      }
    );
  });

  loadResources();
})();
