/* ============================================================================
   MUSTANER — Strategic Thinking for Growth
   Language switching, apply form, video, sticky quick-info, scroll reveal.
   No build step, no dependencies, no network calls. Runs from file:// too.
   ========================================================================== */
(function () {
  'use strict';

  var COPY = window.MUSTANER_COPY || { en: {}, ar: {} };
  var WA_NUMBER = '201092718547';
  var STORE_KEY = 'mustaner.lang';
  var THEME_KEY = 'mustaner.theme';

  /* ---------------------------------------------------------------- utils */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function resolve(dict, path) {
    var cur = dict, parts = path.split('.'), i;
    for (i = 0; i < parts.length; i++) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  /* ------------------------------------------------------------- language */
  var current = 'en';

  function applyLanguage(lang, opts) {
    var dict = COPY[lang];
    if (!dict) return;
    var keepScroll = !(opts && opts.silent);
    var ratio = keepScroll
      ? window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      : 0;

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    $$('[data-i18n]').forEach(function (el) {
      var val = resolve(dict, el.getAttribute('data-i18n'));
      if (typeof val === 'string') el.textContent = val;
    });

    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var bits = pair.split('|');
        if (bits.length !== 2) return;
        var val = resolve(dict, bits[1].trim());
        if (typeof val === 'string') el.setAttribute(bits[0].trim(), val);
      });
    });

    if (dict.meta && dict.meta.page_title) document.title = dict.meta.page_title;
    var desc = $('meta[name="description"]');
    if (desc && dict.meta && dict.meta.meta_description) desc.setAttribute('content', dict.meta.meta_description);

    // Each dictionary's lang_toggle is the label for the language it OFFERS:
    // the English deck says "العربية", the Arabic deck says "English".
    $$('.lang-toggle span').forEach(function (s) {
      s.textContent = (dict.ui && dict.ui.lang_toggle) || (lang === 'en' ? 'العربية' : 'English');
      s.removeAttribute('data-i18n');
    });

    current = lang;
    try { localStorage.setItem(STORE_KEY, lang); } catch (err) { /* file:// or private mode */ }

    if (keepScroll) {
      requestAnimationFrame(function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: ratio * max, behavior: 'auto' });
      });
    }

    syncWhatsAppLinks();
    try { window.dispatchEvent(new CustomEvent('mustaner:langchange')); } catch (err) { /* ignore */ }
  }

  function toggleLanguage() { applyLanguage(current === 'en' ? 'ar' : 'en'); }

  $$('.lang-toggle, .js-lang').forEach(function (btn) {
    btn.addEventListener('click', toggleLanguage);
  });

  // The English copy is already rendered server-side; only switch if the visitor
  // previously chose Arabic, or their browser asks for it and they have no choice stored.
  (function initLanguage() {
    var saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (err) { /* ignore */ }
    var wantsArabic = saved === 'ar' || (!saved && (navigator.language || '').toLowerCase().indexOf('ar') === 0);
    // Set the toggle label correctly even when we stay on English.
    applyLanguage(wantsArabic ? 'ar' : 'en', { silent: true });
  })();

  /* ---------------------------------------------------------------- theme
     The inline script in <head> already applied the stored theme before first
     paint. This only handles the toggle and keeps the choice. Light is the
     shipped default; there is deliberately no system-preference fallback —
     a marketing page should look the same to everyone until they choose. */
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.setAttribute('data-theme', 'light');
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#000000' : '#FBFCFC');
    try { localStorage.setItem(THEME_KEY, theme); } catch (err) { /* file:// or private mode */ }
  }

  applyTheme(currentTheme());

  $$('.js-theme').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });

  /* ------------------------------------------------------------ apply modal */
  var modal = $('#applyModal');
  var form = $('#applyForm');
  var success = $('#applySuccess');
  var formError = $('#formError');
  var formSubmit = $('#formSubmit');
  var lastTrigger = null;
  var closing = false;
  var submitted = false;

  function formCopy() {
    return (COPY[current] || COPY.en).form || {};
  }

  function showFormError(msg) {
    if (!formError) return;
    formError.hidden = !msg;
    formError.textContent = msg || '';
  }

  function clearFieldErrors() {
    if (!form) return;
    $$('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
    showFormError('');
  }

  function resetApplyView() {
    submitted = false;
    if (form) {
      form.hidden = false;
      form.reset();
    }
    if (success) success.hidden = true;
    if (formSubmit) formSubmit.disabled = false;
    clearFieldErrors();
  }

  function openModal(trigger) {
    if (!modal || closing) return;
    lastTrigger = trigger || null;
    resetApplyView();
    modal.classList.remove('is-closing', 'is-open');
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    document.documentElement.classList.add('modal-open');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        modal.classList.add('is-open');
      });
    });
    var first = $('#f-name');
    if (first) {
      setTimeout(function () {
        try { first.focus({ preventScroll: true }); } catch (err) { first.focus(); }
      }, 320);
    }
  }

  function finishClose() {
    closing = false;
    modal.classList.remove('is-closing', 'is-open');
    if (typeof modal.close === 'function' && modal.open) modal.close();
    else modal.removeAttribute('open');
    document.documentElement.classList.remove('modal-open');
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      try { lastTrigger.focus({ preventScroll: true }); } catch (err) { lastTrigger.focus(); }
    }
  }

  function closeModal() {
    if (!modal || !modal.open || closing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishClose();
      return;
    }
    closing = true;
    modal.classList.add('is-closing');
    var done = false;
    function onEnd(ev) {
      if (ev && ev.target !== modal) return;
      if (done) return;
      done = true;
      modal.removeEventListener('transitionend', onEnd);
      finishClose();
    }
    modal.addEventListener('transitionend', onEnd);
    setTimeout(onEnd, 400);
  }

  $$('.js-apply').forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(btn); });
  });

  var closeBtn = $('#modalClose');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  var doneBtn = $('#modalDone');
  if (doneBtn) doneBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', function (ev) {
      if (ev.target === modal) closeModal();
    });
    modal.addEventListener('cancel', function (ev) {
      ev.preventDefault();
      closeModal();
    });
  }

  if (form) {
    $$('input, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () {
        el.removeAttribute('aria-invalid');
        showFormError('');
      });
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (submitted) return;

      var f = formCopy();
      clearFieldErrors();

      var required = $$('input[required]', form);
      var missing = required.filter(function (i) { return !String(i.value || '').trim(); });
      if (missing.length) {
        missing.forEach(function (i) { i.setAttribute('aria-invalid', 'true'); });
        missing[0].focus();
        showFormError(f.error_required || 'Please fill in the required fields.');
        return;
      }

      var phone = ($('#f-phone') || {}).value || '';
      var phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 8) {
        var phoneEl = $('#f-phone');
        if (phoneEl) {
          phoneEl.setAttribute('aria-invalid', 'true');
          phoneEl.focus();
        }
        showFormError(f.error_phone || 'Enter a valid phone number.');
        return;
      }

      var emailEl = $('#f-email');
      var email = emailEl ? emailEl.value.trim() : '';
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailEl.setAttribute('aria-invalid', 'true');
        emailEl.focus();
        showFormError(f.error_email || 'Enter a valid email, or leave it blank.');
        return;
      }

      var val = function (id) {
        var el = $('#f-' + id);
        return el ? el.value.trim() : '';
      };

      var lines = [
        f.wa_intro || (current === 'ar'
          ? 'مرحبًا مُسْتَنِير، عايز أحجز مكان في كورس Strategic Thinking for Growth.'
          : 'Hello Mustaner, I would like a seat on Strategic Thinking for Growth.'),
        '',
        (f.f_name || 'Name') + ': ' + val('name'),
        (f.f_job || 'Job title') + ': ' + val('job'),
        (f.f_company || 'Company') + ': ' + val('company'),
        (f.f_phone || 'Phone') + ': ' + val('phone')
      ];
      if (val('email')) lines.push((f.f_email || 'Email') + ': ' + val('email'));
      if (val('challenge')) {
        lines.push('');
        lines.push((f.f_challenge || 'Challenge') + ': ' + val('challenge'));
      }

      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
      var fallback = $('#waFallback');
      if (fallback) fallback.href = url;

      submitted = true;
      if (formSubmit) formSubmit.disabled = true;
      form.hidden = true;
      if (success) success.hidden = false;

      /* Prefer a user-gesture link click — window.open is often blocked */
      var opener = document.createElement('a');
      opener.href = url;
      opener.target = '_blank';
      opener.rel = 'noopener';
      document.body.appendChild(opener);
      opener.click();
      opener.remove();
    });
  }

  /* ------------------------------------------------------------------ video
     Desktop: inline phone player.
     Mobile: compact teaser opens a popup with the real video. */
  var video = $('#courseVideo');
  var playBtn = $('#videoPlay');
  var videoTeaser = $('#videoTeaser');
  var videoModal = $('#videoModal');
  var videoModalClose = $('#videoModalClose');
  var videoModalPlayer = $('#courseVideoModal');
  var videoModalClosing = false;
  var videoMobileMq = window.matchMedia('(max-width: 900px)');

  if (playBtn && video) {
    playBtn.addEventListener('click', function () {
      if (videoMobileMq.matches) return;
      playBtn.hidden = true;
      video.controls = true;
      video.muted = false;
      var p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { /* blocked — controls visible */ });
      }
    });
    video.addEventListener('pause', function () {
      if (video.currentTime === 0) playBtn.hidden = false;
    });
  }

  function openVideoModal() {
    if (!videoModal || videoModalClosing) return;
    videoModal.classList.remove('is-closing', 'is-open');
    if (typeof videoModal.showModal === 'function') videoModal.showModal();
    else videoModal.setAttribute('open', '');
    document.documentElement.classList.add('modal-open');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        videoModal.classList.add('is-open');
      });
    });
    if (videoModalPlayer) {
      videoModalPlayer.muted = false;
      videoModalPlayer.controls = true;
      var playPromise = videoModalPlayer.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () { /* user can tap play */ });
      }
    }
  }

  function finishCloseVideoModal() {
    if (!videoModal) return;
    videoModal.classList.remove('is-closing', 'is-open');
    if (typeof videoModal.close === 'function' && videoModal.open) videoModal.close();
    else videoModal.removeAttribute('open');
    document.documentElement.classList.remove('modal-open');
    videoModalClosing = false;
    if (videoModalPlayer) {
      try {
        videoModalPlayer.pause();
        videoModalPlayer.currentTime = 0;
      } catch (err) { /* ignore */ }
    }
  }

  function closeVideoModal() {
    if (!videoModal || !videoModal.open || videoModalClosing) return;
    videoModalClosing = true;
    videoModal.classList.remove('is-open');
    videoModal.classList.add('is-closing');
    if (videoModalPlayer) {
      try { videoModalPlayer.pause(); } catch (err) { /* ignore */ }
    }
    var done = false;
    function end() {
      if (done) return;
      done = true;
      videoModal.removeEventListener('transitionend', onEnd);
      finishCloseVideoModal();
    }
    function onEnd(ev) {
      if (ev && ev.target !== videoModal) return;
      end();
    }
    videoModal.addEventListener('transitionend', onEnd);
    setTimeout(end, 300);
  }

  if (videoTeaser) {
    videoTeaser.addEventListener('click', openVideoModal);
  }
  if (videoModalClose) {
    videoModalClose.addEventListener('click', closeVideoModal);
  }
  if (videoModal) {
    videoModal.addEventListener('click', function (ev) {
      if (ev.target === videoModal) closeVideoModal();
    });
    videoModal.addEventListener('cancel', function (ev) {
      ev.preventDefault();
      closeVideoModal();
    });
  }

  /* -------------------------------------------------- sticky quick-info bar */
  var quickbar = $('#quickbar');
  var quickToggle = $('.quickbar-toggle');
  if (quickbar && quickToggle) {
    quickToggle.addEventListener('click', function () {
      var open = quickbar.getAttribute('data-open') === 'true';
      quickbar.setAttribute('data-open', open ? 'false' : 'true');
      quickToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  }

  /* ----------------------------------------------- curriculum sidebar tabs */
  var curShell = $('#curriculumShell');
  if (curShell) {
    var curTabs = $$('[data-cur-tab]', curShell);
    var curPanels = $$('[data-cur-panel]', curShell);
    var curTablist = curShell.querySelector('.cur-tabs');
    var curTabsMq = window.matchMedia('(max-width: 900px)');

    function syncCurTablistOrientation() {
      if (!curTablist) return;
      curTablist.setAttribute('aria-orientation', curTabsMq.matches ? 'horizontal' : 'vertical');
    }

    function openCurPhase(index) {
      var i = String(index);
      var activeTab = null;
      curTabs.forEach(function (tab) {
        var on = tab.getAttribute('data-cur-tab') === i;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) activeTab = tab;
      });
      curPanels.forEach(function (panel) {
        var on = panel.getAttribute('data-cur-panel') === i;
        panel.classList.toggle('is-active', on);
        if (on) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      });
      if (activeTab && curTabsMq.matches && activeTab.scrollIntoView) {
        activeTab.scrollIntoView({
          inline: 'center',
          block: 'nearest',
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      }
    }

    curTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        openCurPhase(tab.getAttribute('data-cur-tab'));
      });
    });
    syncCurTablistOrientation();
    if (curTabsMq.addEventListener) curTabsMq.addEventListener('change', syncCurTablistOrientation);
    else if (curTabsMq.addListener) curTabsMq.addListener(syncCurTablistOrientation);
  }

  /* -------------------------------------------------- WhatsApp conversion dock */
  var WA_BUBBLE_KEY = 'mustaner.waBubbleDismissed';
  var waBubble = $('#waBubble');
  var waBubbleClose = $('#waBubbleClose');

  function syncWhatsAppLinks() {
    var dict = COPY[current] || COPY.en;
    var prefill = (dict.ui && dict.ui.whatsapp_prefill) ||
      'Hello Mustaner, I have a question about Strategic Thinking for Growth.';
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(prefill);
    $$('.js-wa-link, .js-wa-hero').forEach(function (el) {
      el.setAttribute('href', url);
    });
  }

  function showWaBubble() {
    if (!waBubble) return;
    var dismissed = false;
    try { dismissed = sessionStorage.getItem(WA_BUBBLE_KEY) === '1'; } catch (err) { /* ignore */ }
    if (dismissed) return;
    waBubble.hidden = false;
  }

  function hideWaBubble(persist) {
    if (!waBubble) return;
    waBubble.hidden = true;
    if (persist) {
      try { sessionStorage.setItem(WA_BUBBLE_KEY, '1'); } catch (err) { /* ignore */ }
    }
  }

  if (waBubbleClose) {
    waBubbleClose.addEventListener('click', function () { hideWaBubble(true); });
  }

  syncWhatsAppLinks();
  // Appear after a short beat so it feels intentional, not aggressive
  setTimeout(showWaBubble, 700);

  // Re-show bubble on FAB hover/focus if previously only auto-hidden (not dismissed)
  var fab = $('.fab');
  if (fab) {
    fab.addEventListener('mouseenter', function () {
      try {
        if (sessionStorage.getItem(WA_BUBBLE_KEY) !== '1' && waBubble) waBubble.hidden = false;
      } catch (err) { if (waBubble) waBubble.hidden = false; }
    });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------- masthead scroll
     Transparent over the hero; solid white once the visitor leaves the fold. */
  var masthead = $('#masthead') || $('.masthead');
  var navLinks = $$('.nav a[data-nav], .mobile-nav-links a[data-nav]');
  var navBurger = $('#navBurger');
  var navScrim = $('#navScrim');
  var mobileNav = $('#mobileNav');
  var siteNav = $('#siteNav');
  var lastFocused = null;

  function syncMasthead() {
    if (!masthead) return;
    var y = window.scrollY;
    var solid = y > 24 || (masthead.classList.contains('nav-open'));
    masthead.classList.toggle('is-solid', solid);
    masthead.classList.toggle('is-scrolled', y > 120);
  }

  function setNavOpen(open) {
    if (!masthead || !mobileNav) return;
    var wasOpen = masthead.classList.contains('nav-open');
    masthead.classList.toggle('nav-open', open);
    document.documentElement.classList.toggle('nav-lock', open);
    mobileNav.classList.toggle('is-open', open);
    mobileNav.hidden = !open;
    mobileNav.setAttribute('aria-hidden', open ? 'false' : 'true');

    if (navBurger) {
      navBurger.setAttribute('aria-expanded', open ? 'true' : 'false');
      var dict = COPY[current] && COPY[current].ui;
      var label = open
        ? ((dict && dict.menu_close) || 'Close menu')
        : ((dict && dict.menu_open) || 'Open menu');
      navBurger.setAttribute('aria-label', label);
    }

    if (open && !wasOpen) {
      lastFocused = document.activeElement;
      var firstLink = siteNav && siteNav.querySelector('.mobile-nav-links a');
      if (firstLink) {
        window.setTimeout(function () { firstLink.focus(); }, 40);
      }
    } else if (!open && wasOpen && lastFocused && lastFocused.focus) {
      try { lastFocused.focus(); } catch (err) { /* ignore */ }
      lastFocused = null;
    }

    syncMasthead();
  }

  function closeNav() { setNavOpen(false); }
  function toggleNav() { setNavOpen(!masthead.classList.contains('nav-open')); }

  if (navBurger) {
    navBurger.addEventListener('click', function (ev) {
      ev.stopPropagation();
      toggleNav();
    });
  }
  if (navScrim) {
    navScrim.addEventListener('click', closeNav);
  }
  if (siteNav) {
    siteNav.addEventListener('click', function (ev) {
      var hit = ev.target.closest('a[href^="#"], .js-apply, a[target="_blank"]');
      if (hit) closeNav();
    });
  }
  if (masthead) {
    var brand = masthead.querySelector('.brand');
    if (brand) {
      brand.addEventListener('click', function () {
        if (masthead.classList.contains('nav-open')) closeNav();
      });
    }
  }
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && masthead && masthead.classList.contains('nav-open')) {
      closeNav();
      if (navBurger) navBurger.focus();
    }
  });
  window.addEventListener('resize', function () {
    if (window.matchMedia('(min-width: 961px)').matches) closeNav();
  }, { passive: true });

  function syncNavActive() {
    if (!navLinks.length) return;
    var marker = window.scrollY + (masthead ? masthead.offsetHeight + 48 : 80);
    var active = 'top';
    navLinks.forEach(function (link) {
      var id = link.getAttribute('data-nav');
      if (!id || id === 'top') return;
      var section = document.getElementById(id);
      if (section && section.offsetTop <= marker) active = id;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('data-nav') === active);
    });
  }

  syncMasthead();
  syncNavActive();
  window.addEventListener('scroll', function () {
    syncMasthead();
    syncNavActive();
  }, { passive: true });

  /* ---------------------------------------------------------- scroll to top */
  var scrollTopBtn = $('#scrollTop');
  function syncScrollTop() {
    if (!scrollTopBtn) return;
    var on = window.scrollY > 320;
    scrollTopBtn.classList.toggle('is-on', on);
    if (on) scrollTopBtn.removeAttribute('hidden');
    else scrollTopBtn.setAttribute('hidden', '');
  }
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    syncScrollTop();
    window.addEventListener('scroll', syncScrollTop, { passive: true });
  }

  /* ---------------------------------------------------------- mobile Swiper
     Proof / outcomes / media / audience roles become carousels under 900px. */
  var mobileSwiperMq = window.matchMedia('(max-width: 900px)');
  var mobileSwipers = [];

  function destroyMobileSwipers() {
    mobileSwipers.forEach(function (s) {
      try { s.destroy(true, true); } catch (err) { /* ignore */ }
    });
    mobileSwipers = [];
  }

  function initMobileSwipers() {
    destroyMobileSwipers();
    if (!mobileSwiperMq.matches || typeof window.Swiper !== 'function') return;
    var rtl = document.documentElement.dir === 'rtl';
    var prefersReduced = reduceMotion;

    $$('[data-m-swiper]').forEach(function (el) {
      var kind = el.getAttribute('data-m-swiper');
      var paginationEl = el.querySelector('.m-carousel-dots');
      var slideCount = el.querySelectorAll('.swiper-slide').length;
      if (paginationEl) {
        paginationEl.classList.add('swiper-pagination');
        paginationEl.innerHTML = '';
      }

      /* Force reveal slides visible — opacity/transform was hiding the next slide */
      $$('.swiper-slide.reveal', el).forEach(function (slide) {
        slide.classList.add('in');
      });

      var canLoop = slideCount >= 3;
      var opts = {
        slidesPerView: kind === 'media' ? 1.12 : 1.08,
        spaceBetween: 14,
        centeredSlides: true,
        loop: canLoop,
        loopAdditionalSlides: 2,
        loopPreventsSliding: false,
        speed: 650,
        grabCursor: true,
        watchOverflow: false,
        resistanceRatio: 0.85,
        threshold: 8,
        rtl: rtl,
        pagination: paginationEl ? {
          el: paginationEl,
          clickable: true,
          type: 'bullets'
        } : undefined,
        autoplay: prefersReduced || !canLoop ? false : {
          delay: kind === 'media' ? 3200 : 3800,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
          waitForTransition: true
        },
        breakpoints: {
          560: {
            slidesPerView: kind === 'media' ? 1.28 : 1.18,
            spaceBetween: 16
          }
        },
        on: {
          touchStart: function (swiper) {
            if (swiper.autoplay && swiper.autoplay.running) swiper.autoplay.pause();
          },
          touchEnd: function (swiper) {
            if (swiper.autoplay && !prefersReduced) {
              window.setTimeout(function () {
                if (swiper.autoplay && !swiper.destroyed) swiper.autoplay.resume();
              }, 1200);
            }
          },
          sliderFirstMove: function (swiper) {
            if (swiper.autoplay && swiper.autoplay.running) swiper.autoplay.pause();
          }
        }
      };

      var instance = new window.Swiper(el, opts);
      mobileSwipers.push(instance);
    });
  }

  initMobileSwipers();
  if (mobileSwiperMq.addEventListener) {
    mobileSwiperMq.addEventListener('change', initMobileSwipers);
  } else if (mobileSwiperMq.addListener) {
    mobileSwiperMq.addListener(initMobileSwipers);
  }
  window.addEventListener('mustaner:langchange', function () {
    initMobileSwipers();
  });

  /* ---------------------------------------------------------- phase rail progress
     Fills .phase-rail::after as the visitor scrolls through the four phases. */
  var phaseRail = $('.phase-rail');
  var phaseCards = phaseRail ? $$('.phase', phaseRail) : [];

  function syncPhaseRailProgress() {
    if (!phaseRail) return;
    if (reduceMotion || window.matchMedia('(max-width: 900px)').matches) {
      phaseRail.style.setProperty('--phase-progress', '1');
      phaseCards.forEach(function (card) { card.classList.add('is-done'); });
      return;
    }
    var rect = phaseRail.getBoundingClientRect();
    var view = window.innerHeight || document.documentElement.clientHeight;
    /* Fill while the rail travels through the middle of the viewport. */
    var start = view * 0.7;
    var end = view * 0.32;
    var travel = start - end + Math.max(0, rect.height * 0.25);
    var raw = (start - rect.top) / Math.max(1, travel);
    var progress = Math.max(0, Math.min(1, raw));
    phaseRail.style.setProperty('--phase-progress', progress.toFixed(4));
    phaseCards.forEach(function (card, i) {
      var n = phaseCards.length || 1;
      card.classList.toggle('is-done', progress >= (i + 0.55) / n);
    });
  }

  syncPhaseRailProgress();
  window.addEventListener('scroll', syncPhaseRailProgress, { passive: true });
  window.addEventListener('resize', syncPhaseRailProgress, { passive: true });

  /* ---------------------------------------------------------- media lightbox */
  var mosaic = $('#mediaMosaic');
  var lightbox = $('#mediaLightbox');
  var lbImg = $('#lightboxImg');
  var lbCap = $('#lightboxCap');
  var lbCount = $('#lightboxCount');
  var lbThumbs = $('#lightboxThumbs');
  var lbClose = $('#lightboxClose');
  var lbPrev = $('#lightboxPrev');
  var lbNext = $('#lightboxNext');
  var lbStage = $('#lightboxStage');
  var gallery = [];
  var galleryIndex = 0;
  var lbClosing = false;

  function mediaCopy() {
    return (COPY[current] && COPY[current].media) || {};
  }

  function buildGallery() {
    if (!mosaic) return;
    gallery = $$('.tile', mosaic).map(function (tile) {
      var img = tile.querySelector('img');
      var cap = tile.querySelector('.tile-cap');
      return {
        src: img ? img.getAttribute('src') : '',
        caption: cap ? cap.textContent.trim() : ''
      };
    }).filter(function (item) { return !!item.src; });

    if (!lbThumbs) return;
    lbThumbs.innerHTML = '';
    gallery.forEach(function (item, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lightbox-thumb';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', item.caption || ('Photo ' + (i + 1)));
      btn.setAttribute('data-thumb-index', String(i));
      var thumb = document.createElement('img');
      thumb.src = item.src;
      thumb.alt = '';
      thumb.loading = 'lazy';
      btn.appendChild(thumb);
      btn.addEventListener('click', function () { showGallery(i); });
      lbThumbs.appendChild(btn);
    });
  }

  function refreshGalleryCaptions() {
    if (!mosaic) return;
    $$('.tile', mosaic).forEach(function (tile, i) {
      if (!gallery[i]) return;
      var cap = tile.querySelector('.tile-cap');
      if (cap) gallery[i].caption = cap.textContent.trim();
    });
    if (lightbox && lightbox.open) showGallery(galleryIndex, true);
  }

  function showGallery(index, keepFocus) {
    if (!lightbox || !gallery.length) return;
    galleryIndex = (index + gallery.length) % gallery.length;
    var item = gallery[galleryIndex];
    var dict = mediaCopy();
    var ofWord = dict.of || 'of';

    if (lbImg) {
      lbImg.classList.remove('is-ready');
      lbImg.onload = function () { lbImg.classList.add('is-ready'); };
      lbImg.src = item.src;
      lbImg.alt = item.caption || '';
      if (lbImg.complete) lbImg.classList.add('is-ready');
    }
    if (lbCap) lbCap.textContent = item.caption || '';
    if (lbCount) {
      lbCount.textContent = (galleryIndex + 1) + ' / ' + gallery.length;
      lbCount.setAttribute('data-of', ofWord);
    }
    $$('.lightbox-thumb', lbThumbs).forEach(function (thumb, i) {
      thumb.classList.toggle('is-active', i === galleryIndex);
      thumb.setAttribute('aria-selected', i === galleryIndex ? 'true' : 'false');
    });
    var activeThumb = lbThumbs && lbThumbs.querySelector('.lightbox-thumb.is-active');
    if (activeThumb && activeThumb.scrollIntoView) {
      activeThumb.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (!keepFocus && lbClose) lbClose.focus();
  }

  function openLightbox(index) {
    if (!lightbox || lbClosing) return;
    buildGallery();
    refreshGalleryCaptions();
    if (!gallery.length) return;
    showGallery(index || 0);
    lightbox.classList.remove('is-closing', 'is-open');
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else lightbox.setAttribute('open', '');
    document.documentElement.classList.add('modal-open');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        lightbox.classList.add('is-open');
      });
    });
  }

  function finishCloseLightbox() {
    lightbox.classList.remove('is-closing', 'is-open');
    if (typeof lightbox.close === 'function' && lightbox.open) lightbox.close();
    else lightbox.removeAttribute('open');
    document.documentElement.classList.remove('modal-open');
    lbClosing = false;
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.open || lbClosing) return;
    lbClosing = true;
    lightbox.classList.remove('is-open');
    lightbox.classList.add('is-closing');
    var done = false;
    function end() {
      if (done) return;
      done = true;
      lightbox.removeEventListener('transitionend', onEnd);
      finishCloseLightbox();
    }
    function onEnd(ev) {
      if (ev && ev.target !== lightbox) return;
      end();
    }
    lightbox.addEventListener('transitionend', onEnd);
    setTimeout(end, 280);
  }

  if (mosaic) {
    mosaic.addEventListener('click', function (ev) {
      var hit = ev.target.closest('.tile-hit');
      if (!hit || !mosaic.contains(hit)) return;
      var idx = parseInt(hit.getAttribute('data-gallery-index'), 10);
      openLightbox(isNaN(idx) ? 0 : idx);
    });
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', function () { showGallery(galleryIndex - 1); });
  if (lbNext) lbNext.addEventListener('click', function () { showGallery(galleryIndex + 1); });

  if (lightbox) {
    lightbox.addEventListener('click', function (ev) {
      if (ev.target === lightbox) closeLightbox();
    });
    lightbox.addEventListener('cancel', function (ev) {
      ev.preventDefault();
      closeLightbox();
    });
  }

  document.addEventListener('keydown', function (ev) {
    if (!lightbox || !lightbox.open) return;
    if (ev.key === 'Escape') closeLightbox();
    if (ev.key === 'ArrowLeft') showGallery(document.documentElement.dir === 'rtl' ? galleryIndex + 1 : galleryIndex - 1);
    if (ev.key === 'ArrowRight') showGallery(document.documentElement.dir === 'rtl' ? galleryIndex - 1 : galleryIndex + 1);
  });

  /* Touch swipe on lightbox stage */
  if (lbStage) {
    var touchX = null;
    lbStage.addEventListener('touchstart', function (ev) {
      if (!ev.changedTouches || !ev.changedTouches[0]) return;
      touchX = ev.changedTouches[0].clientX;
    }, { passive: true });
    lbStage.addEventListener('touchend', function (ev) {
      if (touchX === null || !ev.changedTouches || !ev.changedTouches[0]) return;
      var dx = ev.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 48) return;
      var rtl = document.documentElement.dir === 'rtl';
      if (dx < 0) showGallery(rtl ? galleryIndex - 1 : galleryIndex + 1);
      else showGallery(rtl ? galleryIndex + 1 : galleryIndex - 1);
    }, { passive: true });
  }

  window.addEventListener('mustaner:langchange', function () {
    refreshGalleryCaptions();
  });

  /* ---------------------------------------------------------- schedule collapse
     Mobile: accordion phases. Desktop: all phases stay open. */
  var scheduleBody = $('#scheduleBody');
  var scheduleMq = window.matchMedia('(max-width: 960px)');

  function syncScheduleCollapse() {
    if (!scheduleBody) return;
    var groups = $$('.phase-group', scheduleBody);
    if (!groups.length) return;
    if (scheduleMq.matches) {
      groups.forEach(function (el, i) { el.open = i === 0; });
    } else {
      groups.forEach(function (el) { el.open = true; });
    }
  }

  if (scheduleBody) {
    scheduleBody.addEventListener('toggle', function (ev) {
      if (!scheduleMq.matches) return;
      var target = ev.target;
      if (!target || !target.classList || !target.classList.contains('phase-group')) return;
      if (!target.open) return;
      $$('.phase-group', scheduleBody).forEach(function (el) {
        if (el !== target) el.open = false;
      });
    }, true);
    syncScheduleCollapse();
    if (scheduleMq.addEventListener) scheduleMq.addEventListener('change', syncScheduleCollapse);
    else if (scheduleMq.addListener) scheduleMq.addListener(syncScheduleCollapse);
  }

  /* ---------------------------------------------------------- payment collapse
     Mobile: accordion cards. Desktop: all methods stay open. */
  var payGrid = $('#payGrid');
  var payMq = window.matchMedia('(max-width: 900px)');

  function syncPayCollapse() {
    if (!payGrid) return;
    var cards = $$('details.pay', payGrid);
    if (!cards.length) return;
    if (payMq.matches) {
      cards.forEach(function (el, i) { el.open = i === 0; });
    } else {
      cards.forEach(function (el) { el.open = true; });
    }
  }

  if (payGrid) {
    payGrid.addEventListener('toggle', function (ev) {
      if (!payMq.matches) return;
      var target = ev.target;
      if (!target || !target.classList || !target.classList.contains('pay')) return;
      if (!target.open) return;
      $$('details.pay', payGrid).forEach(function (el) {
        if (el !== target) el.open = false;
      });
    }, true);
    syncPayCollapse();
    if (payMq.addEventListener) payMq.addEventListener('change', syncPayCollapse);
    else if (payMq.addListener) payMq.addListener(syncPayCollapse);
  }

  /* ---------------------------------------------------------- scroll reveal */
  var revealables = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }
})();
