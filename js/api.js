/* ==========================================================================
   Blog API boundary.
   界面只通过 window.BlogAPI 取数；数据唯一来源是仓库内的 data/ 目录：
     data/content/            索引 JSON（manifest / site / awards / folders / ...）
     data/note_html/{id}.json 已处理好的笔记正文（{ id, body }）
   没有内置 Mock，也没有远程接口；请用 `python server.py` 启动后访问。
   协议版本见 data/content/manifest.json（brings-blog-content/2）。
   ========================================================================== */
window.BLOG_API_CONFIG = {
  contentRoot: "data/content/",
  dataRoot: "data/",
  noteBodyPattern: "note_html/{id}.json",
};

(function () {
  "use strict";

  var config = window.BLOG_API_CONFIG;
  var store = null;
  var loading = null;

  function root() {
    return config.contentRoot || "data/content/";
  }

  function dataRoot() {
    return config.dataRoot || "data/";
  }

  function fetchJSON(path) {
    return fetch(path, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " · " + path);
      return res.json();
    });
  }

  function loadContent() {
    if (loading) return loading;

    loading = fetchJSON(root() + "manifest.json")
      .then(function (manifest) {
        var files = manifest.files || {};
        return Promise.all([
          fetchJSON(root() + (files.site || "site.json")),
          fetchJSON(root() + (files.awards || "awards.json")),
          fetchJSON(root() + (files.articleFolders || "article-folders.json")),
          fetchJSON(root() + (files.gallery || "gallery.json")),
          fetchJSON(root() + (files.resources || "resources.json")),
          fetchJSON(root() + (files.notesIndex || "notes-index.json")),
        ]).then(function (result) {
          store = {
            base: root(),
            dataRoot: dataRoot(),
            manifest: manifest,
            site: result[0].site || {},
            profile: result[0].profile || {},
            awards: result[1] || [],
            articleFolders: result[2] || [],
            gallery: result[3] || [],
            resources: result[4] || [],
            notes: result[5] || [],
          };
          return store;
        });
      })
      .catch(function (error) {
        loading = null;
        throw new Error(
          "内容文件加载失败（" +
            error.message +
            "）。请确认已运行 python server.py，并通过 http://127.0.0.1:4173/ 访问。"
        );
      });

    return loading;
  }

  function ready() {
    if (store) return Promise.resolve(store);
    return loadContent();
  }

  function data() {
    return store || {};
  }

  function fail(message) {
    return Promise.reject(new Error(message));
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
        return note.folder === folderId && note.status !== "draft";
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
      date: note.date,
      readingTime: note.readingTime,
    };
  }

  function noteBodyPath(noteId) {
    var pattern =
      (data().manifest &&
        data().manifest.files &&
        data().manifest.files.noteBodyPattern) ||
      config.noteBodyPattern ||
      "note_html/{id}.json";
    return dataRoot() + pattern.replace("{id}", encodeURIComponent(noteId));
  }

  var BlogAPI = {
    config: config,

    getSite: function () {
      return ready().then(function () {
        return data().site || {};
      });
    },

    getProfile: function () {
      return ready().then(function () {
        return data().profile || {};
      });
    },

    getAwards: function () {
      return ready().then(function () {
        return data().awards || [];
      });
    },

    getOverview: function () {
      return ready().then(function () {
        var notes = data().notes || [];
        var gallery = data().gallery || [];
        var resources = data().resources || [];
        return {
          notes: notes.filter(function (note) {
            return note.status !== "draft";
          }).length,
          albums: gallery.length,
          photos: gallery.reduce(function (sum, album) {
            return sum + (album.photos ? album.photos.length : 0);
          }, 0),
          resources: resources.length,
        };
      });
    },

    getArticleFolders: function () {
      return ready().then(function () {
        var folders = (data().articleFolders || []).map(function (folder) {
          var notes = notesFor(folder.id);
          return Object.assign({}, folder, {
            count: notes.length,
            latest: notes.length ? notes[0].date : "",
          });
        });
        return folders;
      });
    },

    getNotes: function (folderId, page, pageSize) {
      var safePage = Math.max(1, parseInt(page, 10) || 1);
      var safeSize = Math.max(1, parseInt(pageSize, 10) || 15);

      return ready().then(function () {
        var folder = (data().articleFolders || []).find(function (item) {
          return item.id === folderId;
        });
        if (!folder) {
          if (!(data().articleFolders || []).length) {
            return fail("还没有创建任何文章文件夹。");
          }
          return fail("没有找到这个文章文件夹。");
        }

        return BlogAPI.getArticleFolders().then(function (folders) {
          var meta =
            folders.find(function (item) {
              return item.id === folderId;
            }) || folder;
          var result = makePage(notesFor(folderId).map(noteMeta), safePage, safeSize);
          result.folder = meta;
          return result;
        });
      });
    },

    getNote: function (noteId) {
      return ready().then(function () {
        var all = data().notes || [];
        var current = all.find(function (note) {
          return note.id === noteId;
        });
        if (!current) return fail("没有找到这篇笔记。");

        var notes = notesFor(current.folder);
        var index = notes.findIndex(function (note) {
          return note.id === noteId;
        });
        if (index < 0) return fail("没有找到这篇笔记。");

        var note = notes[index];
        var folder =
          (data().articleFolders || []).find(function (item) {
            return item.id === note.folder;
          }) || null;
        var result = {
          folder: folder,
          previous: index > 0 ? noteMeta(notes[index - 1]) : null,
          next: index < notes.length - 1 ? noteMeta(notes[index + 1]) : null,
          note: Object.assign({}, note, { body: "", generated: false }),
        };

        return fetch(noteBodyPath(noteId), {
          headers: { Accept: "application/json" },
          cache: "no-cache",
        })
          .then(function (res) {
            if (!res.ok) return null;
            return res.json();
          })
          .then(function (body) {
            if (body && typeof body.body === "string") {
              result.note.body = body.body;
              result.note.generated = true;
            }
            return result;
          })
          .catch(function () {
            return result;
          });
      });
    },

    getGalleryAlbums: function () {
      return ready().then(function () {
        return (data().gallery || []).map(function (album) {
          return Object.assign({}, album, {
            count: album.photos ? album.photos.length : 0,
          });
        });
      });
    },

    getGalleryAlbum: function (albumId) {
      return ready().then(function () {
        var album = (data().gallery || []).find(function (item) {
          return item.id === albumId;
        });
        return album ? album : fail("没有找到这个图集。");
      });
    },

    getResources: function (page, pageSize) {
      var safePage = Math.max(1, parseInt(page, 10) || 1);
      var safeSize = Math.max(1, parseInt(pageSize, 10) || 4);

      return ready().then(function () {
        var items = (data().resources || []).map(function (resource) {
          return Object.assign({}, resource, {
            downloadUrl: resource.downloadUrl || resource.file,
          });
        });
        return makePage(items, safePage, safeSize);
      });
    },

    logDownload: function () {
      return Promise.resolve({ ok: true });
    },
  };

  window.BlogAPI = BlogAPI;
})();
