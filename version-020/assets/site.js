(function () {
  "use strict";

  var SELECTOR = {
    menuToggle: "[data-menu-toggle]",
    mobilePanel: "[data-mobile-panel]",
    heroSlider: "[data-hero-slider]",
    heroSlide: "[data-hero-slide]",
    heroDot: "[data-hero-dot]",
    globalSearchForm: "[data-global-search-form]",
    globalSearch: "[data-global-search]",
    searchPanel: "[data-search-panel]",
    localFilter: "[data-local-filter]",
    filterList: "[data-filter-list]",
    filterCount: "[data-filter-count]",
    playButton: "[data-play-button]"
  };

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function setupMobileMenu() {
    var button = document.querySelector(SELECTOR.menuToggle);
    var panel = document.querySelector(SELECTOR.mobilePanel);

    if (!button || !panel) {
      return;
    }

    button.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupHeroSlider() {
    var slider = document.querySelector(SELECTOR.heroSlider);

    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll(SELECTOR.heroSlide));
    var dots = Array.prototype.slice.call(slider.querySelectorAll(SELECTOR.heroDot));
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);

    if (slides.length > 1) {
      start();
    }
  }

  function setupLocalFilter() {
    var input = document.querySelector(SELECTOR.localFilter);
    var list = document.querySelector(SELECTOR.filterList);
    var count = document.querySelector(SELECTOR.filterCount);

    if (!input || !list) {
      return;
    }

    var cards = Array.prototype.slice.call(list.querySelectorAll(".searchable-card"));
    var suffix = count ? count.textContent.replace(/^\d+\s*/, "") : "";

    input.addEventListener("input", function () {
      var keyword = normalize(input.value);
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize((card.dataset.title || "") + " " + (card.dataset.meta || ""));
        var matched = !keyword || haystack.indexOf(keyword) !== -1;
        card.classList.toggle("is-hidden", !matched);
        if (matched) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = visible + " " + suffix;
      }
    });
  }

  function renderSearchResults(panel, keyword) {
    var index = window.MOVIE_SEARCH_INDEX || [];
    var value = normalize(keyword);

    if (!panel || !value) {
      if (panel) {
        panel.classList.remove("is-open");
        panel.innerHTML = "";
      }
      return;
    }

    var matches = [];
    for (var i = 0; i < index.length; i += 1) {
      var item = index[i];
      var haystack = normalize(item.title + " " + item.region + " " + item.year + " " + item.genre + " " + item.category);
      if (haystack.indexOf(value) !== -1) {
        matches.push(item);
      }
      if (matches.length >= 12) {
        break;
      }
    }

    if (!matches.length) {
      panel.innerHTML = '<div class="search-empty">没有找到匹配影片</div>';
      panel.classList.add("is-open");
      return;
    }

    panel.innerHTML = matches.map(function (item) {
      return [
        '<a class="search-result" href="' + item.url + '">',
        '  <img src="' + item.cover + '" alt="' + item.title.replace(/"/g, "&quot;") + '封面" loading="lazy">',
        '  <span>',
        '    <strong>' + item.title + '</strong>',
        '    <small>' + item.year + ' · ' + item.region + ' · ' + item.category + '</small>',
        '  </span>',
        '</a>'
      ].join("");
    }).join("");
    panel.classList.add("is-open");
  }

  function setupGlobalSearch() {
    var forms = Array.prototype.slice.call(document.querySelectorAll(SELECTOR.globalSearchForm));

    forms.forEach(function (form) {
      var input = form.querySelector(SELECTOR.globalSearch);
      var panel = form.querySelector(SELECTOR.searchPanel);

      if (!input || !panel) {
        return;
      }

      input.addEventListener("input", function () {
        renderSearchResults(panel, input.value);
      });

      input.addEventListener("focus", function () {
        renderSearchResults(panel, input.value);
      });

      form.addEventListener("submit", function (event) {
        var index = window.MOVIE_SEARCH_INDEX || [];
        var value = normalize(input.value);
        event.preventDefault();

        if (!value) {
          window.location.href = "./categories.html";
          return;
        }

        for (var i = 0; i < index.length; i += 1) {
          var item = index[i];
          var haystack = normalize(item.title + " " + item.region + " " + item.year + " " + item.genre + " " + item.category);
          if (haystack.indexOf(value) !== -1) {
            window.location.href = item.url;
            return;
          }
        }

        renderSearchResults(panel, input.value);
      });
    });

    document.addEventListener("click", function (event) {
      forms.forEach(function (form) {
        if (!form.contains(event.target)) {
          var panel = form.querySelector(SELECTOR.searchPanel);
          if (panel) {
            panel.classList.remove("is-open");
          }
        }
      });
    });
  }

  function loadHlsScript() {
    return new Promise(function (resolve, reject) {
      if (window.Hls) {
        resolve(window.Hls);
        return;
      }

      var existing = document.querySelector('script[data-hls-loader="true"]');
      if (existing) {
        existing.addEventListener("load", function () {
          resolve(window.Hls);
        });
        existing.addEventListener("error", reject);
        return;
      }

      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      script.async = true;
      script.defer = true;
      script.dataset.hlsLoader = "true";
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function playVideo(video, src, shell, message) {
    if (!video || !src) {
      return;
    }

    function setMessage(text) {
      if (message) {
        message.textContent = text || "";
      }
    }

    setMessage("正在准备播放...");

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.play().then(function () {
        shell.classList.add("is-playing");
        setMessage("");
      }).catch(function () {
        setMessage("播放被浏览器拦截，请再次点击播放按钮。");
      });
      return;
    }

    loadHlsScript().then(function (Hls) {
      if (!Hls || !Hls.isSupported()) {
        setMessage("当前浏览器不支持该在线播放格式，请更换新版浏览器访问。");
        return;
      }

      if (video._hlsInstance) {
        video._hlsInstance.destroy();
      }

      var hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      video._hlsInstance = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        video.play().then(function () {
          shell.classList.add("is-playing");
          setMessage("");
        }).catch(function () {
          setMessage("播放被浏览器拦截，请再次点击播放按钮。");
        });
      });
      hls.on(Hls.Events.ERROR, function (_event, data) {
        if (data && data.fatal) {
          setMessage("视频加载失败，请稍后重试或切换网络。");
        }
      });
    }).catch(function () {
      setMessage("播放器组件加载失败，请检查网络后重试。");
    });
  }

  function setupPlayers() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll(SELECTOR.playButton));

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var targetId = button.dataset.playerTarget;
        var src = button.dataset.src;
        var video = document.getElementById(targetId);
        var shell = button.closest("[data-video-shell]");
        var message = shell ? shell.querySelector("[data-player-message]") : null;
        playVideo(video, src, shell || document.body, message);
      });
    });
  }

  ready(function () {
    setupMobileMenu();
    setupHeroSlider();
    setupLocalFilter();
    setupGlobalSearch();
    setupPlayers();
  });
})();
