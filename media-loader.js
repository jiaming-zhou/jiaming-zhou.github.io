(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const featuredVideos = Array.from(document.querySelectorAll('.featured-publication-video'));
  const zeroPreview = document.querySelector('.zero-wam-publication-preview');
  const zeroCoreVideos = zeroPreview ? Array.from(zeroPreview.querySelectorAll(
    '.zero-wam-preview-robot-data video, .zero-wam-preview-paired-data video, .zero-wam-preview-instruction video'
  )) : [];
  const zeroGroups = zeroPreview ? [
    ['.zero-wam-preview-multi-human video', '.zero-wam-preview-multi-robot video'],
    ['.zero-wam-preview-long-human video', '.zero-wam-preview-long-robot video'],
    ['.zero-wam-preview-fine-human video', '.zero-wam-preview-fine-robot video'],
    ['.zero-wam-preview-simulation-human video', '.zero-wam-preview-simulation-robot video'],
  ].map((selectors) => selectors.map((selector) => zeroPreview.querySelector(selector))) : [];

  let zeroGroupIndex = -1;
  let zeroTimer = null;

  const loadAndPlay = (video) => {
    if (!video || reduceMotion || document.hidden) return;

    if (video.dataset.loaded !== 'true') {
      video.querySelectorAll('source[data-src]').forEach((source) => {
        source.src = source.dataset.src;
      });
      video.load();
      video.dataset.loaded = 'true';
    }

    const playRequest = video.play();
    if (playRequest) playRequest.catch(() => {});
  };

  const pause = (video) => {
    if (video) video.pause();
  };

  const showNextZeroGroup = () => {
    if (zeroGroupIndex >= 0) zeroGroups[zeroGroupIndex].forEach(pause);
    zeroGroupIndex = (zeroGroupIndex + 1) % zeroGroups.length;
    zeroGroups[zeroGroupIndex].forEach(loadAndPlay);
  };

  const startZeroPreview = () => {
    if (!zeroPreview || reduceMotion || document.hidden || zeroTimer) return;
    zeroCoreVideos.forEach(loadAndPlay);
    showNextZeroGroup();
    zeroTimer = window.setInterval(showNextZeroGroup, 2500);
  };

  const stopZeroPreview = () => {
    if (zeroTimer) window.clearInterval(zeroTimer);
    zeroTimer = null;
    zeroGroupIndex = -1;
    if (zeroPreview) zeroPreview.querySelectorAll('video').forEach(pause);
  };

  if (!('IntersectionObserver' in window)) {
    startZeroPreview();
    featuredVideos.forEach(loadAndPlay);
    return;
  }

  if (zeroPreview) {
    const zeroObserver = new IntersectionObserver(([entry]) => {
      zeroPreview.dataset.inView = String(entry.isIntersecting);
      if (entry.isIntersecting) startZeroPreview();
      else stopZeroPreview();
    }, { threshold: 0.1 });
    zeroObserver.observe(zeroPreview);
  }

  const featuredObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.dataset.inView = String(entry.isIntersecting);
      if (entry.isIntersecting) loadAndPlay(entry.target);
      else pause(entry.target);
    });
  }, { threshold: 0.1 });

  featuredVideos.forEach((video) => featuredObserver.observe(video));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopZeroPreview();
      featuredVideos.forEach(pause);
      return;
    }

    if (zeroPreview && zeroPreview.dataset.inView === 'true') startZeroPreview();
    featuredVideos.forEach((video) => {
      if (video.dataset.inView === 'true') loadAndPlay(video);
    });
  });
})();
