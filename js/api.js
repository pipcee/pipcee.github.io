/* ==========================================================================
   Blog API boundary.
   The UI only talks to window.BlogAPI. Flip BLOG_API_CONFIG.useMock to false
   to use the documented HTTP endpoints. See continue/08-backend-api.md.
   ========================================================================== */
window.BLOG_API_CONFIG = {
  useMock: true,
  baseUrl: "/api",
  mockDelay: 90,
};

(function () {
  "use strict";

  var config = window.BLOG_API_CONFIG;

  function data() {
    return window.BLOG_DATA || {};
  }

  function delayed(value) {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        resolve(JSON.parse(JSON.stringify(value)));
      }, config.useMock ? config.mockDelay : 0);
    });
  }

  function fail(message) {
    return Promise.reject(new Error(message));
  }

  /**
   * [后端预留] Real HTTP transport.
   * The backend must answer JSON with the exact shapes documented in
   * continue/08-backend-api.md. Errors should use non-2xx status codes.
   */
  async function request(path, options) {
    var init = Object.assign(
      {
        headers: { Accept: "application/json" },
      },
      options || {}
    );

    if (init.body) {
      init.headers = Object.assign({}, init.headers, {
        "Content-Type": "application/json",
      });
    }

    var response = await fetch(config.baseUrl + path, init);
    if (!response.ok) {
      throw new Error("请求失败（HTTP " + response.status + "）");
    }
    return response.json();
  }

  function makePage(items, page, pageSize) {
    var safeSize = Math.max(1, pageSize || 1);
    var total = items.length;
    var totalPages = Math.ceil(total / safeSize);
    var safePage = Math.max(1, page || 1);
    var start = (safePage - 1) * safeSize;

    return {
      items: items.slice(start, start + safeSize),
      page: safePage,
      pageSize: safeSize,
      total: total,
      totalPages: totalPages,
    };
  }

  function notesFor(folderId) {
    return (data().notes || [])
      .filter(function (note) {
        return note.folder === folderId;
      })
      .slice()
      .sort(function (a, b) {
        return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
      });
  }

  function noteMeta(note) {
    if (!note) return null;
    return {
      id: note.id,
      folder: note.folder,
      title: note.title,
      summary: note.summary,
      date: note.date,
      readingTime: note.readingTime,
      tags: note.tags,
    };
  }

  var BlogAPI = {
    config: config,

    getSite: function () {
      if (!config.useMock) return request("/site");
      return delayed(data().site || {});
    },

    getProfile: function () {
      if (!config.useMock) return request("/profile");
      return delayed(data().profile || {});
    },

    getAwards: function () {
      if (!config.useMock) return request("/awards");
      return delayed(data().awards || []);
    },

    getOverview: function () {
      if (!config.useMock) return request("/overview");
      var notes = data().notes || [];
      var gallery = data().gallery || [];
      var resources = data().resources || [];
      return delayed({
        notes: notes.length,
        albums: gallery.length,
        photos: gallery.reduce(function (sum, album) {
          return sum + (album.photos ? album.photos.length : 0);
        }, 0),
        resources: resources.length,
      });
    },

    getArticleFolders: function () {
      if (!config.useMock) return request("/article-folders");
      var folders = (data().articleFolders || []).map(function (folder) {
        var notes = notesFor(folder.id);
        return Object.assign({}, folder, {
          count: notes.length,
          latest: notes.length ? notes[0].date : "",
        });
      });
      return delayed(folders);
    },

    getNotes: function (folderId, page, pageSize) {
      var safePage = Math.max(1, parseInt(page, 10) || 1);
      var safeSize = Math.max(1, parseInt(pageSize, 10) || 4);

      if (!config.useMock) {
        return request(
          "/article-folders/" +
            encodeURIComponent(folderId) +
            "/notes?page=" +
            safePage +
            "&pageSize=" +
            safeSize
        );
      }

      var folder = (data().articleFolders || []).find(function (item) {
        return item.id === folderId;
      });
      if (!folder) return fail("没有找到这个文章文件夹。");

      var folderResult = BlogAPI.getArticleFolders();
      return folderResult.then(function (folders) {
        var meta = folders.find(function (item) {
          return item.id === folderId;
        });
        var pageResult = makePage(notesFor(folderId).map(noteMeta), safePage, safeSize);
        pageResult.folder = meta || folder;
        return pageResult;
      });
    },

    getNote: function (noteId) {
      if (!config.useMock) return request("/notes/" + encodeURIComponent(noteId));

      var notes = notesFor(
        ((data().notes || []).find(function (note) {
          return note.id === noteId;
        }) || {}).folder
      );
      var index = notes.findIndex(function (note) {
        return note.id === noteId;
      });
      if (index < 0) return fail("没有找到这篇笔记。");

      var note = notes[index];
      var folder = (data().articleFolders || []).find(function (item) {
        return item.id === note.folder;
      });
      return delayed({
        note: note,
        folder: folder || null,
        previous: index > 0 ? noteMeta(notes[index - 1]) : null,
        next: index < notes.length - 1 ? noteMeta(notes[index + 1]) : null,
      });
    },

    getGalleryAlbums: function () {
      if (!config.useMock) return request("/gallery/albums");
      var albums = (data().gallery || []).map(function (album) {
        return Object.assign({}, album, {
          count: album.photos ? album.photos.length : 0,
        });
      });
      return delayed(albums);
    },

    getGalleryAlbum: function (albumId) {
      if (!config.useMock) {
        return request("/gallery/albums/" + encodeURIComponent(albumId));
      }
      var album = (data().gallery || []).find(function (item) {
        return item.id === albumId;
      });
      return album ? delayed(album) : fail("没有找到这个图集。");
    },

    getResources: function (page, pageSize) {
      var safePage = Math.max(1, parseInt(page, 10) || 1);
      var safeSize = Math.max(1, parseInt(pageSize, 10) || 4);

      if (!config.useMock) {
        return request("/resources?page=" + safePage + "&pageSize=" + safeSize);
      }

      var items = (data().resources || []).map(function (resource) {
        return Object.assign({}, resource, {
          // [后端预留] A real backend should provide a short-lived signed URL.
          downloadUrl: resource.file,
        });
      });
      return delayed(makePage(items, safePage, safeSize));
    },

    /**
     * [后端预留] POST /api/downloads/:id/log
     * Fire-and-forget analytics hook. Downloading must never depend on it.
     */
    logDownload: function (resourceId) {
      if (config.useMock) return delayed({ ok: true });
      return request(
        "/downloads/" + encodeURIComponent(resourceId) + "/log",
        { method: "POST", body: "{}" }
      );
    },
  };

  window.BlogAPI = BlogAPI;
})();
