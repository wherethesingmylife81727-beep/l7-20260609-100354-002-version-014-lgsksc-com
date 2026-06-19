(() => {
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const mobilePanel = document.querySelector('[data-mobile-panel]');

    if (menuToggle && mobilePanel) {
        menuToggle.addEventListener('click', () => {
            mobilePanel.classList.toggle('open');
        });
    }

    const hero = document.querySelector('[data-hero]');

    if (hero) {
        const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
        const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
        let current = 0;

        const showSlide = (index) => {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;
            slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
            dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
        };

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => showSlide(index));
        });

        window.setInterval(() => showSlide(current + 1), 5200);
    }

    const searchInput = document.querySelector('[data-search-input]');
    const cards = Array.from(document.querySelectorAll('[data-search-card]'));
    const emptyState = document.querySelector('[data-empty-state]');

    if (searchInput && cards.length) {
        const params = new URLSearchParams(window.location.search);
        const initial = params.get('q');

        if (initial) {
            searchInput.value = initial;
        }

        const filterCards = () => {
            const keyword = searchInput.value.trim().toLowerCase();
            let visible = 0;

            cards.forEach((card) => {
                const haystack = (card.getAttribute('data-search') || '').toLowerCase();
                const matched = !keyword || haystack.includes(keyword);
                card.style.display = matched ? '' : 'none';
                if (matched) {
                    visible += 1;
                }
            });

            if (emptyState) {
                emptyState.classList.toggle('show', visible === 0);
            }
        };

        searchInput.addEventListener('input', filterCards);
        filterCards();
    }

    const playerArea = document.querySelector('[data-player-area]');
    const video = document.querySelector('#moviePlayer');
    const playButton = document.querySelector('[data-player-button]');
    let hlsInstance = null;

    const initializePlayer = () => {
        if (!video || video.dataset.ready === '1') {
            return;
        }

        const source = video.getAttribute('data-src');
        if (!source) {
            return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
                enableWorker: true,
                lowLatencyMode: false
            });
            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
        } else {
            video.src = source;
        }

        video.dataset.ready = '1';
    };

    const playVideo = () => {
        initializePlayer();

        if (!video) {
            return;
        }

        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
        }
    };

    if (playButton) {
        playButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            playVideo();
        });
    }

    if (playerArea && video) {
        playerArea.addEventListener('click', (event) => {
            if (event.target.closest('button')) {
                return;
            }

            if (event.target === video && video.dataset.ready === '1') {
                return;
            }

            playVideo();
        });

        video.addEventListener('play', () => {
            if (playButton) {
                playButton.classList.add('hide');
            }
        });

        video.addEventListener('pause', () => {
            if (playButton && video.currentTime === 0) {
                playButton.classList.remove('hide');
            }
        });
    }

    window.addEventListener('beforeunload', () => {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
})();
