/* ==========================================================================
   Blog API boundary.
   界面只通过 window.BlogAPI 取数。
   两种模式：
     mode: "static" → 读取仓库内 content/ 目录下的自定义文件协议
                      （由服务器端 tools/build.py 从共享存储生成）
     mode: "mock"   → 使用 js/data.js + js/notes-data.js 的内置数据
   文件协议见 content/manifest.json（brings-blog-content/1）。
   ========================================================================== */
window.BLOG_API_CONFIG = {
  mode: "static",
  contentRoot: "content/",
  mockDelay: 0,
};

(function () {
  "use strict";

  var config = window.BLOG_API_CONFIG;
  var store = null;
  var loading = null;

  function root() {
    return config.contentRoot || "content/";
  }

  function fetchJSON(path) {
    return fetch(path, {
      headers: { Accept: "application/json" },
      cache: "no-cache",
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " · " + path);
      return res.json();
    });
  }

  function loadContent() {
    if (loading) return loading;
    var base = root();
    loading = fetchJSON(base + "manifest.json")
      .then(function (man) {
        var f = man.files || {};
        return Promise.all([
          fetchJSON(base + (f.site || "site.json")),
          fetchJSON(base + (f.awards || "awards.json")),
          fetchJSON(base + (f.articleFolders || "article-folders.json")),
          fetchJSON(base + (f.gallery || "gallery.json")),
          fetchJSON(base + (f.resources || "resources.json")),
          fetchJSON(base + (f.notesIndex || "notes-index.json")),
        ]).then(function (r) {
          return {
            mock: false,
            base: base,
            manifest: man,
            site: r[0].site || {},
            profile: r[0].profile || {},
            awards: r[1] || [],
            articleFolders: r[2] || [],
            gallery: r[3] || [],
            resources: r[4] || [],
            notes: r[5] || [],
          };
        });
      })
      .catch(function (err) {
        if (window.console) {
          console.warn("[BlogAPI] 内容文件加载失败，回退到内置 Mock：" + err.message);
        }
        return { mock: true };
      });
    return loading;
  }

  function ready() {
    if (config.mode === "mock") return Promise.resolve();
    return loadContent();
  }

  function data() {
    if (store && !store.mock) return store;
    return window.BLOG_DATA || {};
  }

  function isStatic() {
    return !!(store && !store.mock);
  }

  function delayed(value) {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        resolve(JSON.parse(JSON.stringify(value)));
      }, config.mockDelay || 0);
    });
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
      return ready().then(function () {
        return delayed(data().site || {});
      });
    },

    getProfile: function () {
      return ready().then(function () {
        return delayed(data().profile || {});
      });
    },

    getAwards: function () {
      return ready().then(function () {
        return delayed(data().awards || []);
      });
    },

    getOverview: function () {
      return ready().then(function () {
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
        return delayed(folders);
      });
    },

    getNotes: function (folderId, page, pageSize) {
      var safePage = Math.max(1, parseInt(page, 10) || 1);
      var safeSize = Math.max(1, parseInt(pageSize, 10) || 15);

      return ready().then(function () {
        var folder = (data().articleFolders || []).find(function (item) {
          return item.id === folderId;
        });
        if (!folder) return fail("没有找到这个文章文件夹。");

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
        var notes = notesFor(
          (data().notes || []).find(function (note) {
            return note.id === noteId;
          })?.folder
        );
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
        };

        if (isStatic()) {
          return fetchJSON(root() + "notes/" + encodeURIComponent(noteId) + ".json")
            .then(function (body) {
              result.note = Object.assign({}, note, { body: body.body || "" });
              return result;
            })
            .catch(function () {
              result.note = Object.assign({}, note, { body: "" });
              return result;
            });
        }

        result.note = note;
        return delayed(result);
      });
    },

    getGalleryAlbums: function () {
      return ready().then(function () {
        var albums = (data().gallery || []).map(function (album) {
          return Object.assign({}, album, {
            count: album.photos ? album.photos.length : 0,
          });
        });
        return delayed(albums);
      });
    },

    getGalleryAlbum: function (albumId) {
      return ready().then(function () {
        var album = (data().gallery || []).find(function (item) {
          return item.id === albumId;
        });
        return album ? delayed(album) : fail("没有找到这个图集。");
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
        return delayed(makePage(items, safePage, safeSize));
      });
    },

    logDownload: function () {
      return Promise.resolve({ ok: true });
    },
  };

  window.BlogAPI = BlogAPI;
})();
