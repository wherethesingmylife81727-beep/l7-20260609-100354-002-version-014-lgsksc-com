(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var menuButton = document.querySelector(".menu-toggle");
    var mobilePanel = document.querySelector(".mobile-panel");

    if (menuButton && mobilePanel) {
      menuButton.addEventListener("click", function () {
        var isOpen = mobilePanel.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    var hero = document.querySelector("[data-hero-carousel]");

    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
      var current = 0;
      var timer = null;

      function showSlide(index) {
        if (!slides.length) {
          return;
        }

        current = (index + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === current);
        });

        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === current);
        });
      }

      function startHero() {
        stopHero();
        timer = window.setInterval(function () {
          showSlide(current + 1);
        }, 5200);
      }

      function stopHero() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      }

      dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
          showSlide(index);
          startHero();
        });
      });

      hero.addEventListener("mouseenter", stopHero);
      hero.addEventListener("mouseleave", startHero);
      startHero();
    }

    var searchPage = document.querySelector("[data-search-page]");

    if (searchPage) {
      var input = document.getElementById("site-search-input");
      var clearButton = document.getElementById("site-search-clear");
      var items = Array.prototype.slice.call(searchPage.querySelectorAll(".search-item"));
      var categoryButtons = Array.prototype.slice.call(searchPage.querySelectorAll("[data-filter-category]"));
      var yearButtons = Array.prototype.slice.call(searchPage.querySelectorAll("[data-filter-year]"));
      var activeCategory = "";
      var activeYear = "";
      var urlQuery = new URLSearchParams(window.location.search).get("q") || "";

      if (input && urlQuery) {
        input.value = urlQuery;
      }

      function normalize(value) {
        return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
      }

      function refresh() {
        var query = normalize(input ? input.value : "");

        items.forEach(function (item) {
          var text = normalize([
            item.getAttribute("data-title"),
            item.getAttribute("data-year"),
            item.getAttribute("data-category"),
            item.getAttribute("data-genre"),
            item.getAttribute("data-tags"),
            item.textContent
          ].join(" "));
          var itemCategory = item.getAttribute("data-category") || "";
          var itemYear = item.getAttribute("data-year") || "";
          var matchesQuery = !query || text.indexOf(query) !== -1;
          var matchesCategory = !activeCategory || itemCategory === activeCategory;
          var matchesYear = !activeYear || itemYear === activeYear;
          item.style.display = matchesQuery && matchesCategory && matchesYear ? "" : "none";
        });
      }

      function activateButton(buttons, currentButton) {
        buttons.forEach(function (button) {
          button.classList.toggle("is-active", button === currentButton);
        });
      }

      categoryButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          activeCategory = button.getAttribute("data-filter-category") || "";
          activateButton(categoryButtons, button);
          refresh();
        });
      });

      yearButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          activeYear = button.getAttribute("data-filter-year") || "";
          activateButton(yearButtons, button);
          refresh();
        });
      });

      if (input) {
        input.addEventListener("input", refresh);
      }

      if (clearButton && input) {
        clearButton.addEventListener("click", function () {
          input.value = "";
          activeCategory = "";
          activeYear = "";
          activateButton(categoryButtons, categoryButtons[0]);
          activateButton(yearButtons, yearButtons[0]);
          refresh();
          input.focus();
        });
      }

      refresh();
    }
  });
})();

function bindMoviePlayer(videoId, overlayId, buttonId, streamUrl) {
  var video = document.getElementById(videoId);
  var overlay = document.getElementById(overlayId);
  var button = document.getElementById(buttonId);
  var hlsInstance = null;
  var hasLoaded = false;

  if (!video || !overlay || !button || !streamUrl) {
    return;
  }

  function loadStream() {
    if (hasLoaded) {
      return Promise.resolve();
    }

    hasLoaded = true;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      return Promise.resolve();
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);
      return new Promise(function (resolve) {
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          resolve();
        });
      });
    }

    video.src = streamUrl;
    return Promise.resolve();
  }

  function start() {
    overlay.classList.add("is-hidden");
    loadStream().then(function () {
      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          overlay.classList.remove("is-hidden");
        });
      }
    });
  }

  overlay.addEventListener("click", start);
  button.addEventListener("click", start);
  video.addEventListener("click", function () {
    if (video.paused) {
      start();
    }
  });
  video.addEventListener("play", function () {
    overlay.classList.add("is-hidden");
  });
}
