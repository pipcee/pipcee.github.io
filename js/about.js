/* About page — profile, status and awards. */
(function () {
  "use strict";

  var awardGrid = document.getElementById("awards-grid");
  var awardsNote = document.getElementById("awards-note");
  var awardsSection = document.querySelector(".awards-section");

  if (!awardGrid) return;

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node && value) node.textContent = value;
  }

  function renderProfile(profile) {
    if (!profile) return;

    var avatar = document.getElementById("profile-avatar");
    if (avatar) {
      avatar.src = profile.avatar || avatar.src;
      avatar.alt = profile.avatarAlt || avatar.alt;
    }

    setText("profile-status-label", profile.status && profile.status.label);
    setText("profile-status-value", profile.status && profile.status.value);
    setText("profile-status-detail", profile.status && profile.status.detail);
    setText("profile-status-term", profile.status && profile.status.term);

    var bio = document.getElementById("profile-bio");
    if (bio) {
      var paragraphs = [];
      if (profile.intro) paragraphs.push(profile.intro);
      (profile.bio || []).forEach(function (item) {
        paragraphs.push(item);
      });
      bio.innerHTML = paragraphs
        .map(function (paragraph) {
          return "<p>" + BlogUI.escapeHTML(paragraph) + "</p>";
        })
        .join("");
    }
  }

  function renderAwards(awards) {
    var allowedTones = { sage: true, sand: true, mist: true, rose: true };

    awardGrid.innerHTML = awards
      .map(function (award, index) {
        var tone = allowedTones[award.tone] ? award.tone : "sage";
        var order = Math.min(index, 8);
        return (
          '<article class="award-card award-card--' +
          tone +
          '" style="--order:' +
          order +
          '">' +
          '<div class="award-card__top">' +
          '<span class="award-index">Award / ' +
          String(index + 1).padStart(2, "0") +
          "</span>" +
          '<span class="award-honor">' +
          BlogUI.escapeHTML(award.honor || "获奖") +
          "</span>" +
          "</div>" +
          "<h3>" +
          BlogUI.escapeHTML(award.title) +
          "</h3>" +
          '<p class="award-event">' +
          BlogUI.escapeHTML(award.detail || "") +
          "</p>" +
          '<p class="award-description">' +
          BlogUI.escapeHTML(award.description || "") +
          "</p>" +
          '<div class="award-card__bottom">' +
          '<span class="award-issuer">' +
          BlogUI.escapeHTML(award.issuer || "") +
          "</span>" +
          '<span class="award-date">' +
          BlogUI.escapeHTML(award.date || award.year || "") +
          "</span>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    if (!awards.length) {
      awardGrid.innerHTML =
        '<div class="empty-state"><div><h2>奖项整理中</h2><p>这里很快会有新的记录。</p></div></div>';
    }
  }

  async function loadAbout() {
    try {
      var results = await Promise.all([
        BlogAPI.getProfile(),
        BlogAPI.getAwards(),
        BlogAPI.getOverview(),
      ]);
      var profile = results[0];
      var awards = results[1];
      var overview = results[2];

      renderProfile(profile);
      renderAwards(awards);

      if (awardsNote) {
        awardsNote.textContent =
          awards.length +
          " 项荣誉 · " +
          overview.notes +
          " 篇笔记 · " +
          overview.resources +
          " 份分享";
      }
      if (awardsSection) awardsSection.classList.add("is-visible");
    } catch (error) {
      awardGrid.innerHTML =
        '<div class="error-state"><div><p>' +
        BlogUI.escapeHTML(error.message || "内容加载失败，请稍后再试。") +
        '</p><button class="button button--ghost about-retry" type="button">重新加载</button></div></div>';
      var retry = awardGrid.querySelector(".about-retry");
      if (retry) retry.addEventListener("click", loadAbout);
    }
  }

  loadAbout();
})();
