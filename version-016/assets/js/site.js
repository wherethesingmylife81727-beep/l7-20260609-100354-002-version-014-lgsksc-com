
const Hls = window.Hls || null;

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function setupMobileNav() {
  const button = qs('[data-menu-button]');
  const nav = qs('[data-mobile-nav]');

  if (!button || !nav) {
    return;
  }

  button.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

function setupHero() {
  const slides = qsa('[data-hero-slide]');
  const dots = qsa('[data-hero-dot]');

  if (slides.length <= 1) {
    return;
  }

  let current = 0;
  let timer = null;

  const show = (next) => {
    current = (next + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === current);
    });
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === current);
    });
  };

  const start = () => {
    stop();
    timer = window.setInterval(() => show(current + 1), 5200);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = Number(dot.dataset.heroDot || 0);
      show(index);
      start();
    });
  });

  const hero = qs('.hero-section');
  if (hero) {
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
  }

  start();
}

function setupFilters() {
  const inputs = qsa('.js-filter-input');

  inputs.forEach((input) => {
    const section = input.closest('section') || document;
    const count = qs('[data-filter-count]', section);
    const cards = qsa('.movie-card', section);

    const apply = () => {
      const keyword = input.value.trim().toLowerCase();
      let visible = 0;

      cards.forEach((card) => {
        const haystack = `${card.dataset.title || ''} ${card.dataset.meta || ''}`.toLowerCase();
        const matched = !keyword || haystack.includes(keyword);
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = `${visible} 部`;
      }
    };

    input.addEventListener('input', apply);
    apply();
  });
}

function setupPlayer() {
  const video = qs('#moviePlayer');
  const startButton = qs('[data-player-start]');

  if (!video || !startButton) {
    return;
  }

  let initialized = false;

  const setError = (message) => {
    const meta = qs('.player-meta span');
    if (meta) {
      meta.textContent = message;
      meta.classList.add('player-error');
    }
  };

  const init = async () => {
    const source = video.dataset.m3u8;

    if (!source) {
      setError('当前播放源未配置。');
      return;
    }

    if (!initialized) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (Hls && Hls.isSupported && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data && data.fatal) {
            setError('播放器初始化失败，请检查网络或播放源。');
          }
        });
      } else {
        setError('当前浏览器不支持 HLS 播放。');
        return;
      }
      initialized = true;
    }

    startButton.classList.add('hidden');

    try {
      await video.play();
    } catch (error) {
      startButton.classList.remove('hidden');
      setError('浏览器阻止了自动播放，请再次点击播放按钮。');
    }
  };

  startButton.addEventListener('click', init);
}

setupMobileNav();
setupHero();
setupFilters();
setupPlayer();
