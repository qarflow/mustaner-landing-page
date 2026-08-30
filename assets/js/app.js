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
  var lastTrigger = null;

  function openModal(trigger) {
    if (!modal) return;
    lastTrigger = trigger || null;
    if (form) form.hidden = false;
    if (success) success.hidden = true;
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    var first = $('#f-name');
    if (first) setTimeout(function () { first.focus(); }, 40);
  }

  function closeModal() {
    if (!modal) return;
    if (typeof modal.close === 'function') modal.close();
    else modal.removeAttribute('open');
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  }

  $$('.js-apply').forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(btn); });
  });
  var closeBtn = $('#modalClose');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // click on the backdrop closes
  if (modal) {
    modal.addEventListener('click', function (ev) {
      if (ev.target === modal) closeModal();
    });
  }

  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var required = $$('input[required]', form);
      var missing = required.filter(function (i) { return !i.value.trim(); });
      if (missing.length) {
        missing[0].focus();
        missing.forEach(function (i) { i.setAttribute('aria-invalid', 'true'); });
        return;
      }
      required.forEach(function (i) { i.removeAttribute('aria-invalid'); });

      var dict = COPY[current] || COPY.en;
      var f = dict.form || {};
      var val = function (id) { var el = $('#f-' + id); return el ? el.value.trim() : ''; };

      var lines = [
        current === 'ar'
          ? 'مرحبًا مُسْتَنِير، عايز أحجز مكان في كورس Strategic Thinking for Growth.'
          : 'Hello Mustaner, I would like a seat on Strategic Thinking for Growth.',
        '',
        (f.f_name || 'Name') + ': ' + val('name'),
        (f.f_job || 'Job title') + ': ' + val('job'),
        (f.f_company || 'Company') + ': ' + val('company'),
        (f.f_phone || 'Phone') + ': ' + val('phone')
      ];
      if (val('email')) lines.push((f.f_email || 'Email') + ': ' + val('email'));
      if (val('challenge')) {
        lines.push('');
        lines.push((f.f_challenge || 'Challenge') + ' ' + val('challenge'));
      }

      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
      var fallback = $('#waFallback');
      if (fallback) fallback.href = url;

      form.hidden = true;
      if (success) success.hidden = false;
      window.open(url, '_blank', 'noopener');
    });
  }

  /* ------------------------------------------------------------------ video
     One <video> element. `#t=0.4` on the src makes the browser paint the frame
     at 0.4s as the poster, so no separate thumbnail file is needed. Clicking
     the overlay reveals the native controls and starts playback with sound. */
  var video = $('#courseVideo');
  var playBtn = $('#videoPlay');

  if (playBtn && video) {
    playBtn.addEventListener('click', function () {
      playBtn.hidden = true;
      video.controls = true;
      video.muted = false;
      var p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { /* blocked by the browser — controls are now visible */ });
      }
    });
    video.addEventListener('pause', function () {
      if (video.currentTime === 0) playBtn.hidden = false;
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
