(function () {
  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
      return;
    }
    document.addEventListener("DOMContentLoaded", callback);
  }

  function setupMenu() {
    var button = document.querySelector(".mobile-menu-button");
    var nav = document.querySelector(".site-nav");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function setupHeroCarousel() {
    var carousel = document.querySelector(".hero-carousel");
    if (!carousel) {
      return;
    }
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
    var prev = document.querySelector(".carousel-prev");
    var next = document.querySelector(".carousel-next");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      slides[index].classList.remove("is-active");
      index = (nextIndex + slides.length) % slides.length;
      slides[index].classList.add("is-active");
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (slides.length < 2) {
      return;
    }
    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }
    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    start();
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll(".movie-list-scope"));
    panels.forEach(function (scope) {
      var search = scope.querySelector(".movie-search");
      var typeFilter = scope.querySelector(".movie-type-filter");
      var yearFilter = scope.querySelector(".movie-year-filter");
      var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card, .rank-row"));
      var empty = scope.querySelector(".empty-state");

      function matchYear(cardYear, selected) {
        if (!selected) {
          return true;
        }
        var year = Number(cardYear || 0);
        if (selected === "2019") {
          return year <= 2019;
        }
        return String(year) === selected;
      }

      function apply() {
        var keyword = search ? search.value.trim().toLowerCase() : "";
        var selectedType = typeFilter ? typeFilter.value : "";
        var selectedYear = yearFilter ? yearFilter.value : "";
        var visible = 0;

        cards.forEach(function (card) {
          var text = [
            card.getAttribute("data-title") || "",
            card.getAttribute("data-year") || "",
            card.getAttribute("data-type") || "",
            card.getAttribute("data-region") || "",
            card.getAttribute("data-tags") || ""
          ].join(" ").toLowerCase();
          var cardType = card.getAttribute("data-type") || "";
          var cardYear = card.getAttribute("data-year") || "";
          var matched = (!keyword || text.indexOf(keyword) !== -1) && (!selectedType || cardType === selectedType) && matchYear(cardYear, selectedYear);
          card.style.display = matched ? "" : "none";
          if (matched) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }

      [search, typeFilter, yearFilter].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });
    });
  }

  window.initMoviePlayer = function (source) {
    var video = document.getElementById("movieVideo");
    var cover = document.querySelector(".player-cover");
    if (!video || !source) {
      return;
    }
    var hls = null;
    var loaded = false;

    function load() {
      if (loaded) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
      loaded = true;
    }

    function play() {
      load();
      if (cover) {
        cover.classList.add("is-hidden");
      }
      var request = video.play();
      if (request && typeof request.catch === "function") {
        request.catch(function () {});
      }
    }

    if (cover) {
      cover.addEventListener("click", play);
    }
    video.addEventListener("play", function () {
      if (cover) {
        cover.classList.add("is-hidden");
      }
    });
    video.addEventListener("click", function () {
      if (!loaded) {
        play();
      }
    });
    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  ready(function () {
    setupMenu();
    setupHeroCarousel();
    setupFilters();
  });
})();
