(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function setupMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-nav-panel]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var root = document.querySelector('[data-hero]');
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    if (!slides.length) {
      return;
    }
    var index = 0;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
      });
    });
    window.setInterval(function () {
      show(index + 1);
    }, 5200);
  }

  function setupFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));
    if (!scopes.length) {
      return;
    }
    scopes.forEach(function (scope) {
      var input = scope.querySelector('[data-movie-search]');
      var root = scope.parentElement || document;
      var list = root.querySelector('[data-movie-list]');
      if (!list) {
        return;
      }
      var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));
      var year = '全部';
      var type = '全部';
      var empty = document.createElement('div');
      empty.className = 'empty-tip is-hidden';
      empty.textContent = '没有找到匹配影片，请换一个关键词。';
      list.appendChild(empty);

      function activate(buttons, current) {
        buttons.forEach(function (button) {
          button.classList.toggle('is-active', button.textContent.trim() === current);
        });
      }

      var yearButtons = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-year]'));
      var typeButtons = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-type]'));
      activate(yearButtons, year);
      activate(typeButtons, type);

      function apply() {
        var query = input ? input.value.trim().toLowerCase() : '';
        var visible = 0;
        cards.forEach(function (card) {
          var text = card.getAttribute('data-search') || '';
          var cardYear = card.getAttribute('data-year') || '';
          var cardType = card.getAttribute('data-type') || '';
          var hitQuery = !query || text.indexOf(query) !== -1;
          var hitYear = year === '全部' || cardYear === year;
          var hitType = type === '全部' || cardType.indexOf(type) !== -1;
          var show = hitQuery && hitYear && hitType;
          card.classList.toggle('is-hidden', !show);
          if (show) {
            visible += 1;
          }
        });
        empty.classList.toggle('is-hidden', visible !== 0);
      }

      if (input) {
        input.addEventListener('input', apply);
      }
      yearButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          year = button.getAttribute('data-filter-year') || '全部';
          activate(yearButtons, year);
          apply();
        });
      });
      typeButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          type = button.getAttribute('data-filter-type') || '全部';
          activate(typeButtons, type);
          apply();
        });
      });
    });
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (box) {
      var video = box.querySelector('video');
      var button = box.querySelector('[data-play-button]');
      var source = box.getAttribute('data-hls');
      if (!video || !source) {
        return;
      }

      function attachSource() {
        if (video.getAttribute('data-ready') === '1') {
          return Promise.resolve();
        }
        video.setAttribute('data-ready', '1');
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          return Promise.resolve();
        }
        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            maxBufferLength: 30,
            enableWorker: true
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          return new Promise(function (resolve) {
            hls.on(window.Hls.Events.MANIFEST_PARSED, resolve);
            window.setTimeout(resolve, 1200);
          });
        }
        video.src = source;
        return Promise.resolve();
      }

      function play() {
        box.classList.add('is-playing');
        attachSource().then(function () {
          var attempt = video.play();
          if (attempt && typeof attempt.catch === 'function') {
            attempt.catch(function () {
              box.classList.remove('is-playing');
            });
          }
        });
      }

      if (button) {
        button.addEventListener('click', function (event) {
          event.preventDefault();
          play();
        });
      }
      video.addEventListener('play', function () {
        box.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        if (video.currentTime === 0) {
          box.classList.remove('is-playing');
        }
      });
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayers();
  });
})();
