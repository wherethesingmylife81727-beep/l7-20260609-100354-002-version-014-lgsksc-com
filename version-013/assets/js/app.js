(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupHeader() {
    var searchToggle = document.querySelector(".search-toggle");
    var menuToggle = document.querySelector(".menu-toggle");
    var searchPanel = document.querySelector(".search-panel");
    var mobileNav = document.querySelector(".mobile-nav");

    if (searchToggle && searchPanel) {
      searchToggle.addEventListener("click", function () {
        searchPanel.hidden = !searchPanel.hidden;
        if (!searchPanel.hidden) {
          var input = searchPanel.querySelector("input");
          if (input) {
            input.focus();
          }
        }
      });
    }

    if (menuToggle && mobileNav) {
      menuToggle.addEventListener("click", function () {
        mobileNav.hidden = !mobileNav.hidden;
      });
    }
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var previous = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;

    function show(target) {
      if (!slides.length) {
        return;
      }
      slides[index].classList.remove("active");
      index = (target + slides.length) % slides.length;
      slides[index].classList.add("active");
    }

    if (previous) {
      previous.addEventListener("click", function () {
        show(index - 1);
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
      });
    }

    window.setInterval(function () {
      show(index + 1);
    }, 5600);
  }

  function movieCard(movie) {
    var tagHtml = movie.tags.slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");

    return "" +
      "<article class=\"movie-card\">" +
        "<a class=\"movie-cover\" href=\"" + escapeHtml(movie.url) + "\">" +
          "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" class=\"cover-image\" loading=\"lazy\" onerror=\"this.remove();\">" +
          "<span class=\"play-chip\">播放</span>" +
        "</a>" +
        "<div class=\"movie-card-body\">" +
          "<div class=\"movie-meta\"><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.year) + "</span></div>" +
          "<h2><a href=\"" + escapeHtml(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h2>" +
          "<p>" + escapeHtml(movie.oneLine) + "</p>" +
          "<div class=\"tag-row\">" + tagHtml + "</div>" +
        "</div>" +
      "</article>";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>\"]/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
      }[char];
    });
  }

  function setupSearchPage() {
    var form = document.querySelector("[data-search-form]");
    var results = document.querySelector("[data-search-results]");
    if (!form || !results || !window.MOVIES) {
      return;
    }

    var queryInput = form.querySelector("input[name='q']");
    var regionSelect = document.querySelector("[data-filter-region]");
    var typeSelect = document.querySelector("[data-filter-type]");
    var yearSelect = document.querySelector("[data-filter-year]");
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";

    queryInput.value = initial;

    function matches(movie, query, region, type, year) {
      var bag = [
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        movie.tags.join(" "),
        movie.oneLine
      ].join(" ").toLowerCase();
      var q = query.trim().toLowerCase();
      return (!q || bag.indexOf(q) !== -1) &&
        (!region || movie.region === region) &&
        (!type || movie.type === type) &&
        (!year || movie.year === year);
    }

    function render() {
      var query = queryInput.value || "";
      var region = regionSelect ? regionSelect.value : "";
      var type = typeSelect ? typeSelect.value : "";
      var year = yearSelect ? yearSelect.value : "";
      var html = window.MOVIES.filter(function (movie) {
        return matches(movie, query, region, type, year);
      }).map(movieCard).join("");

      results.innerHTML = html || "<div class=\"text-panel\"><h2>未找到相关影片</h2><p>请尝试其他关键词或调整筛选条件。</p></div>";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      render();
    });

    [queryInput, regionSelect, typeSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener("input", render);
        control.addEventListener("change", render);
      }
    });

    render();
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));

    players.forEach(function (player) {
      var video = player.querySelector("video");
      var button = player.querySelector("[data-play]");
      var message = player.querySelector("[data-player-message]");
      var stream = player.getAttribute("data-stream");
      var prepared = false;
      var hlsInstance = null;

      if (!video || !button || !stream) {
        return;
      }

      function showMessage(value) {
        if (message) {
          message.textContent = value || "";
        }
      }

      function prepare() {
        if (prepared) {
          return true;
        }

        prepared = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
          return true;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.ERROR, function (_event, data) {
            if (data && data.fatal) {
              showMessage("播放暂时中断，请稍后再试");
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                hlsInstance.startLoad();
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                hlsInstance.recoverMediaError();
              }
            }
          });
          return true;
        }

        showMessage("播放器暂时无法启动");
        return false;
      }

      function start() {
        if (!prepare()) {
          return;
        }

        button.classList.add("is-hidden");
        video.setAttribute("controls", "controls");
        video.play().catch(function () {
          showMessage("点击视频区域继续播放");
          button.classList.remove("is-hidden");
        });
      }

      button.addEventListener("click", start);
      video.addEventListener("click", function () {
        if (video.paused) {
          start();
        }
      });

      window.addEventListener("pagehide", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  ready(function () {
    setupHeader();
    setupHero();
    setupSearchPage();
    setupPlayers();
  });
})();
