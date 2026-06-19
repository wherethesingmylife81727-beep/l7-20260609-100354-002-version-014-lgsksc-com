(function () {
    var video = document.querySelector('[data-player-video]');
    var trigger = document.querySelector('[data-player-trigger]');

    if (!video || !trigger) {
        return;
    }

    var streamUrl = video.getAttribute('data-stream-url');
    var hlsInstance = null;

    function attachStream() {
        if (!streamUrl) {
            return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            if (video.getAttribute('src') !== streamUrl) {
                video.setAttribute('src', streamUrl);
            }
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            if (!hlsInstance) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                    backBufferLength: 90
                });
                hlsInstance.loadSource(streamUrl);
                hlsInstance.attachMedia(video);
            }
            return;
        }

        if (video.getAttribute('src') !== streamUrl) {
            video.setAttribute('src', streamUrl);
        }
    }

    function startPlayback() {
        attachStream();
        video.controls = true;
        trigger.classList.add('is-hidden');

        var playPromise = video.play();

        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
                trigger.classList.remove('is-hidden');
            });
        }
    }

    trigger.addEventListener('click', startPlayback);

    video.addEventListener('click', function () {
        if (video.paused) {
            startPlayback();
        }
    });
})();
