/* Gallery folders + accessible lightbox. */
(function () {
  "use strict";

  var grid = document.getElementById("gallery-grid");
  var metaLine = document.getElementById("gallery-meta");
  var modal = document.getElementById("album-modal");
  if (!grid || !modal) return;

  var dialog = modal.querySelector(".album-dialog");
  var image = document.getElementById("album-image");
  var caption = document.getElementById("album-caption");
  var photoIndex = document.getElementById("album-photo-index");
  var title = document.getElementById("album-modal-title");
  var description = document.getElementById("album-modal-description");
  var dateNode = document.getElementById("album-date");
  var countNode = document.getElementById("album-photo-count");
  var thumbs = document.getElementById("album-thumbs");
  var prevButton = document.getElementById("album-prev");
  var nextButton = document.getElementById("album-next");
  var closeButton = modal.querySelector(".album-modal__close");

  var albums = [];
  var activeAlbum = null;
  var activeIndex = 0;
  var lastFocused = null;

  function albumIndexLabel(index) {
    return String(index + 1).padStart(2, "0");
  }

  function renderAlbums(items) {
    grid.innerHTML = items
      .map(function (album, index) {
        return (
          '<button class="album-card" type="button" data-album="' +
          BlogUI.escapeHTML(album.id) +
          '" style="--order:' +
          index +
          '" aria-label="打开图集：' +
          BlogUI.escapeHTML(album.title) +
          '，共 ' +
          (album.photos ? album.photos.length : 0) +
          ' 张图片">' +
          '<span class="album-card__cover">' +
          '<img src="' +
          BlogUI.escapeHTML(album.cover) +
          '" alt="' +
          BlogUI.escapeHTML(album.title) +
          ' 图集封面" loading="lazy" width="1200" height="900">' +
          '<span class="album-card__folder">' +
          '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1.8 4.2h4.1l1.2 1.5h6.9v6.1H1.8V4.2Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>' +
          "Album / " +
          albumIndexLabel(index) +
          "</span>" +
          '<span class="album-card__count">' +
          String(album.photos ? album.photos.length : 0).padStart(2, "0") +
          " 张</span>" +
          "</span>" +
          '<span class="album-card__body">' +
          '<span class="album-card__title">' +
          BlogUI.escapeHTML(album.title) +
          "</span>" +
          '<span class="album-card__meta">' +
          '<span>' +
          BlogUI.escapeHTML(album.en || "") +
          "</span>" +
          "<span>" +
          BlogUI.escapeHTML(album.date || "") +
          "</span>" +
          "</span>" +
          "</span>" +
          "</button>"
        );
      })
      .join("");

    if (!items.length) {
      grid.innerHTML =
        '<div class="empty-state"><div><h2>图库还是空的</h2><p>照片正在路上。</p></div></div>';
    }
  }

  function preloadAround() {
    if (!activeAlbum) return;
    var photos = activeAlbum.photos || [];
    [activeIndex - 1, activeIndex + 1].forEach(function (index) {
      var photo = photos[(index + photos.length) % photos.length];
      if (photo) {
        var preload = new Image();
        preload.src = photo.src;
      }
    });
  }

  function updateThumbs() {
    if (!activeAlbum) return;
    thumbs.innerHTML = (activeAlbum.photos || [])
      .map(function (photo, index) {
        return (
          '<button class="album-thumb' +
          (index === activeIndex ? " is-active" : "") +
          '" type="button" data-thumb-index="' +
          index +
          '" aria-label="查看第 ' +
          (index + 1) +
          " 张图片：" +
          BlogUI.escapeHTML(photo.caption || "") +
          '"' +
          (index === activeIndex ? ' aria-current="true"' : "") +
          ">" +
          '<img src="' +
          BlogUI.escapeHTML(photo.src) +
          '" alt="" loading="lazy" width="1200" height="900">' +
          "</button>"
        );
      })
      .join("");
  }

  function showPhoto(index) {
    if (!activeAlbum) return;
    var photos = activeAlbum.photos || [];
    if (!photos.length) return;

    activeIndex = (index + photos.length) % photos.length;
    var photo = photos[activeIndex];

    image.classList.remove("is-fading");
    void image.offsetWidth;
    image.classList.add("is-fading");
    image.src = photo.src;
    image.alt = photo.alt || photo.caption || activeAlbum.title;
    caption.textContent = photo.caption || "";
    photoIndex.textContent =
      albumIndexLabel(activeIndex) + " / " + String(photos.length).padStart(2, "0");

    updateThumbs();
    preloadAround();

    var single = photos.length < 2;
    prevButton.hidden = single;
    nextButton.hidden = single;
    prevButton.disabled = single;
    nextButton.disabled = single;
  }

  function openAlbum(albumId) {
    var album = albums.find(function (item) {
      return item.id === albumId;
    });
    if (!album) return;

    activeAlbum = album;
    activeIndex = 0;
    lastFocused = document.activeElement;

    title.textContent = album.title;
    description.textContent = album.description || "";
    dateNode.textContent = album.date || "";
    countNode.textContent =
      String(album.photos ? album.photos.length : 0).padStart(2, "0") + " photos";

    showPhoto(0);
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.setAttribute("aria-hidden", "false");

    window.requestAnimationFrame(function () {
      if (closeButton) closeButton.focus();
    });
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    activeAlbum = null;
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  function movePhoto(direction) {
    if (!activeAlbum) return;
    showPhoto(activeIndex + direction);
  }

  function trapFocus(event) {
    if (event.key !== "Tab" || !dialog) return;
    var focusable = dialog.querySelectorAll(
      'button:not([hidden]):not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  grid.addEventListener("click", function (event) {
    var card = event.target.closest("[data-album]");
    if (card) openAlbum(card.getAttribute("data-album"));
  });

  modal.addEventListener("click", function (event) {
    if (event.target.closest("[data-modal-close]")) closeModal();

    var thumb = event.target.closest("[data-thumb-index]");
    if (thumb) showPhoto(Number(thumb.getAttribute("data-thumb-index")));
  });

  prevButton.addEventListener("click", function () {
    movePhoto(-1);
  });

  nextButton.addEventListener("click", function () {
    movePhoto(1);
  });

  image.addEventListener("load", function () {
    window.setTimeout(function () {
      image.classList.remove("is-fading");
    }, 30);
  });

  document.addEventListener("keydown", function (event) {
    if (modal.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      movePhoto(-1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      movePhoto(1);
      return;
    }
    trapFocus(event);
  });

  async function loadGallery() {
    grid.setAttribute("aria-busy", "true");
    try {
      albums = await BlogAPI.getGalleryAlbums();
      renderAlbums(albums);
      if (metaLine) {
        var photos = albums.reduce(function (sum, album) {
          return sum + (album.photos ? album.photos.length : 0);
        }, 0);
        metaLine.innerHTML =
          "<span>" +
          String(albums.length).padStart(2, "0") +
          ' albums</span><span aria-hidden="true">/</span><span>' +
          String(photos).padStart(2, "0") +
          " photos · 每行三个</span>";
      }
    } catch (error) {
      grid.innerHTML =
        '<div class="error-state"><div><p>' +
        BlogUI.escapeHTML(error.message || "图库加载失败，请稍后再试。") +
        '</p><button class="button button--ghost gallery-retry" type="button">重新加载</button></div></div>';
      var retry = grid.querySelector(".gallery-retry");
      if (retry) retry.addEventListener("click", loadGallery);
    } finally {
      grid.setAttribute("aria-busy", "false");
    }
  }

  loadGallery();
})();
