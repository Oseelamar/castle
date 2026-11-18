/* Castle Group homepage — behaviour. No dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  var calm = root.classList.contains('calm');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k) { try { sessionStorage.setItem(k, '1'); } catch (e) {} }
  };

  /* --- Links: this is a prototype, so nothing leaves the page. Placeholder links (href="#") do nothing on click. --- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#"]');
    if (a) e.preventDefault();
  });

  /* --- Loader: once per session, never under reduced motion, hard cap 2.5s --- */
  function heroIn() { root.classList.add('hero-in'); }
  if (root.classList.contains('loading')) {
    store.set('cg-intro');
    var finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      root.classList.add('loading-done');
      heroIn();
      setTimeout(function () { root.classList.remove('loading', 'loading-open', 'loading-done'); }, 380);
    };
    setTimeout(function () { root.classList.add('loading-open'); }, 550);
    setTimeout(finish, 2100);
    setTimeout(finish, 2500);
  }

  /* --- Header: transparent over the hero, slim black bar after --- */
  var hdr = $('#hdr');
  function onScrollHeader() { hdr.classList.toggle('is-stuck', window.scrollY > 40); }
  requestAnimationFrame(onScrollHeader); /* first read waits for the first frame instead of forcing layout during load */
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* Dropdowns: hover and focus are CSS; the caret button covers touch, Esc closes. */
  var subs = $$('.nav__list > .has-sub');
  function closeSubs(except) {
    subs.forEach(function (li) {
      if (li === except) return;
      li.classList.remove('open');
      $('.nav__tog', li).setAttribute('aria-expanded', 'false');
    });
  }
  subs.forEach(function (li) {
    var tog = $('.nav__tog', li);
    tog.addEventListener('click', function () {
      var open = !li.classList.contains('open');
      closeSubs(li);
      li.classList.toggle('open', open);
      li.classList.remove('shut');
      tog.setAttribute('aria-expanded', String(open));
    });
    li.addEventListener('mouseleave', function () { li.classList.remove('shut'); });
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) li.classList.remove('shut', 'open'); });
    li.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      li.classList.add('shut');
      li.classList.remove('open');
      tog.setAttribute('aria-expanded', 'false');
      $('a', li).focus();
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.has-sub')) closeSubs(); });

  /* --- Mobile menu: built from the header so every link stays in one place --- */
  var mm = $('#mm'), mmBody = $('#mm-body');
  /* Each section with sub-pages is a dropdown: tap the heading to open its list, one open at a time. */
  var mmGroups = [];
  function mmSet(g, open) {
    g.classList.toggle('open', open);
    var b = $('.mm__head', g); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  $$('.nav__list > li').forEach(function (li, i) {
    var g = document.createElement('div');
    g.className = 'mm__group';
    var link = $('a', li), sub = $('.sub', li);
    if (!sub) { g.appendChild(link.cloneNode(true)); mmBody.appendChild(g); return; }
    var head = document.createElement('button');
    head.type = 'button'; head.className = 'mm__head';
    head.setAttribute('aria-expanded', 'false'); head.setAttribute('aria-controls', 'mm-sub-' + i);
    head.innerHTML = '<span>' + link.textContent + '</span><i aria-hidden="true"></i>';
    var panel = document.createElement('div');
    panel.className = 'mm__panel'; panel.id = 'mm-sub-' + i;
    var u = sub.cloneNode(true); u.className = '';
    var wrap = document.createElement('div'); wrap.appendChild(u); panel.appendChild(wrap);
    head.addEventListener('click', function () {
      var open = !g.classList.contains('open');
      mmGroups.forEach(function (o) { mmSet(o, false); });
      mmSet(g, open);
    });
    g.appendChild(head); g.appendChild(panel);
    mmGroups.push(g); mmBody.appendChild(g);
  });
  mm.addEventListener('close', function () { mmGroups.forEach(function (o) { mmSet(o, false); }); });
  var mu = document.createElement('div');
  mu.className = 'mm__util';
  $$('.util a').forEach(function (a) { mu.appendChild(a.cloneNode(true)); });
  mmBody.appendChild(mu);
  $('#burger').addEventListener('click', function () { mm.showModal(); });
  $('#mm-close').addEventListener('click', function () { mm.close(); });
  mm.addEventListener('click', function (e) { if (e.target.closest('a')) mm.close(); });
  /* review aid: ?menu=1 opens the menu, ?menu=2 opens it with Who We Are expanded */
  var mmQ = /[?&]menu=(\d)/.exec(location.search);
  if (mmQ) { mm.showModal(); if (mmQ[1] === '2' && mmGroups[0]) mmSet(mmGroups[0], true); }

  /* --- Videos: muted, pausable. Each keeps its file in data-src until needed: the hero video after the
         page has finished loading, the careers video when it nears the screen. A photo sits underneath
         and the video fades in once it is actually playing. --- */
  function loadVid(v) {
    if (!v || !v.dataset.src) return;
    var small = v.dataset.srcSm && window.innerWidth < 760;
    v.src = small ? v.dataset.srcSm : v.dataset.src;
    v.removeAttribute('data-src'); v.removeAttribute('data-src-sm');
    v.load();
  }
  $$('video').forEach(function (v) {
    v.addEventListener('playing', function () { v.classList.add('is-playing'); });
  });
  var heroVid = $('#hero-video');
  if (heroVid && !calm) {
    var startHero = function () {
      if (heroVid.dataset.userPaused) return;
      loadVid(heroVid);
      heroVid.play().catch(function () {});
    };
    var afterLoad = function () { setTimeout(startHero, 1200); };
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad);
  }
  $$('.vctl').forEach(function (btn) {
    var v = document.getElementById(btn.dataset.video);
    if (!v || (!v.dataset.src && !v.currentSrc)) return; /* no video file yet: the control stays hidden (hidden in the markup) */
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var paused = btn.getAttribute('aria-pressed') === 'true';
      if (paused) { loadVid(v); v.play(); } else { v.pause(); }
      btn.setAttribute('aria-pressed', String(!paused));
      $('.vctl__txt', btn).textContent = paused ? 'Pause' : 'Play';
      v.dataset.userPaused = paused ? '' : '1';
    });
  });
  if (calm) {
    $$('video').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
    $$('.vctl').forEach(function (b) { b.setAttribute('aria-pressed', 'true'); $('.vctl__txt', b).textContent = 'Play'; });
  }

  /* --- Masked text reveal: headings are cut into their rendered lines, each line sits in a mask
         and rises into view from below, line after line. Numbers rise digit by digit.
         Once a heading has revealed, its original markup is put back so nothing is left split. --- */
  var SPLIT = '.hero__display, .intro__display, .ab4__lead, .h-serif, .display, .statement, .tile__t, .quote__name, .card__t, .row__t, .pillar__a, .pillar__b';
  var splitEls = calm ? [] : $$(SPLIT).filter(function (el) { return !el.closest('dialog'); });
  var digitEls = calm ? [] : $$('.fig__n');
  function lineStep(el) { return el.classList.contains('card__t') || el.classList.contains('row__t') ? 0.06 : 0.09; }
  /* Splitting runs in three passes over all headings (wrap words, measure, build lines), so the page lays out
     once for the whole set instead of once per heading. */
  function wrapWords(el) {
    if (el._orig == null) el._orig = el.innerHTML;
    else el.innerHTML = el._orig;
    var words = [], frag = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w'; w.textContent = t;
          frag.appendChild(w); words.push(w);
        });
      } else if (n.nodeName === 'BR') {
        frag.appendChild(n); words.push(n);
      } else {
        var w2 = document.createElement('span'); w2.className = 'w'; w2.appendChild(n);
        frag.appendChild(w2); words.push(w2);
      }
    });
    el.innerHTML = ''; el.appendChild(frag);
    return words;
  }
  function measureLines(words) {
    var lines = [], cur = null, top = null;
    words.forEach(function (w) {
      if (w.nodeName === 'BR') { cur = null; top = null; return; }
      var t = w.offsetTop;
      if (!cur || Math.abs(t - top) > 4) { cur = []; lines.push(cur); top = t; }
      cur.push(w);
    });
    return lines;
  }
  function buildLines(el, lines) {
    var step = lineStep(el);
    el.innerHTML = '';
    lines.forEach(function (ws, i) {
      var ln = document.createElement('span'); ln.className = 'ln';
      var inner = document.createElement('span'); inner.className = 'ln__i';
      inner.style.transitionDelay = 'calc(var(--d, 0s) + ' + (i * step).toFixed(2) + 's)';
      ws.forEach(function (w, j) {
        if (j) inner.appendChild(document.createTextNode(' '));
        while (w.firstChild) inner.appendChild(w.firstChild);
      });
      ln.appendChild(inner); el.appendChild(ln);
    });
    el._lines = lines.length;
    el.classList.add('split');
  }
  function splitDigits(el) {
    el._orig = el.innerHTML;
    var txt = el.textContent.trim();
    el.setAttribute('aria-label', txt);
    var ln = document.createElement('span'); ln.className = 'ln'; ln.setAttribute('aria-hidden', 'true');
    txt.split('').forEach(function (c, i) {
      var d = document.createElement('span'); d.className = 'ln__i';
      d.style.transitionDelay = 'calc(var(--d, 0s) + ' + (i * 0.07).toFixed(2) + 's)';
      d.textContent = c; ln.appendChild(d);
    });
    el.innerHTML = ''; el.appendChild(ln);
    el._lines = txt.length;
    el.classList.add('split', 'rv');
  }
  function unsplit(el) {
    if (el._orig == null || el._restored || el._unsplitting) return;
    el._unsplitting = true;
    var d = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
    var wait = (d + (el._lines || 1) * 0.09 + 1.3) * 1000;
    if (el.classList.contains('hero__display')) wait += 450;
    setTimeout(function () {
      el._restored = true;
      el.innerHTML = el._orig;
      el.removeAttribute('aria-label');
      el.classList.remove('split');
      el.classList.add('split-done');
    }, wait);
  }
  function doSplit(list) {
    var todo = list.filter(function (el) {
      return !(el.classList.contains('in') || el._restored || el._unsplitting);
    });
    if (!todo.length) return;
    var words = todo.map(wrapWords);                 /* writes */
    var lines = words.map(measureLines);             /* one layout, then reads */
    todo.forEach(function (el, i) { buildLines(el, lines[i]); }); /* writes */
  }
  function splitAgain() { doSplit(splitEls.filter(function (el) { return el.classList.contains('split'); })); }
  if (splitEls.length || digitEls.length) {
    digitEls.forEach(splitDigits);
    /* on a repeat visit the hero is already showing, so it is not split at all */
    if (root.classList.contains('hero-in')) splitEls = splitEls.filter(function (el) { return !el.classList.contains('hero__display'); });
    splitEls.forEach(function (el) { if (!el.classList.contains('hero__display')) el.classList.add('rv'); });
    /* headings are split only as they come within a screen of view, a batch at a time, so loading the page
       does not pay for measuring every heading on it */
    if ('IntersectionObserver' in window) {
      var splitIO = new IntersectionObserver(function (entries) {
        var els = entries.filter(function (en) { return en.isIntersecting; }).map(function (en) { return en.target; });
        els.forEach(function (el) { splitIO.unobserve(el); });
        doSplit(els);
      }, { rootMargin: '0px 0px 100% 0px' });
      splitEls.forEach(function (el) { splitIO.observe(el); });
    } else doSplit(splitEls);
    /* re-measure split headings once the display font has loaded, and if the width changes before they reveal */
    if (document.fonts && document.fonts.status !== 'loaded' && document.fonts.ready) document.fonts.ready.then(splitAgain);
    var lastW = window.innerWidth, rsT;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth; clearTimeout(rsT); rsT = setTimeout(splitAgain, 150);
    });
    var hd = $('.hero__display');
    if (hd) {
      if (root.classList.contains('hero-in')) unsplit(hd);
      else new MutationObserver(function (m, obs) {
        if (root.classList.contains('hero-in')) { obs.disconnect(); unsplit(hd); }
      }).observe(root, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* --- Reveals, shaped image reveals, colour-block wipes --- */
  var watch = $$('.rv, .shape, .wipe, .card__img, .ab4__panel');
  if (calm || !('IntersectionObserver' in window)) {
    watch.forEach(function (el) { el.classList.add('in'); });
  } else {
    var targets = [];
    var reveal = function (t) {
      if (t._rvDone) return;
      t._rvDone = true;
      (t._rvList || [t]).forEach(function (el) { el.classList.add('in'); if (el.classList.contains('split') && el._orig != null) unsplit(el); });
      io.unobserve(t);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) reveal(en.target); });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
    /* backup for fast flicks: anything a scroll carried straight past (never "entering" the screen) still reveals */
    var sweepT = 0;
    /* Sections off screen are skipped by the browser (content-visibility), so the sweep measures each
       target's section first and only measures the target itself once its section is near the screen. */
    var sweep = function () {
      sweepT = 0;
      var vh = window.innerHeight, secTop = new Map();
      targets = targets.filter(function (t) {
        if (t._rvDone) return false;
        var sec = t._sec || (t._sec = t.closest('main > section, footer') || document.body);
        if (!secTop.has(sec)) secTop.set(sec, sec.getBoundingClientRect().top);
        if (secTop.get(sec) > vh) return true;
        if (t.getBoundingClientRect().top < vh * 0.9) { reveal(t); return false; }
        return true;
      });
      if (!targets.length) window.removeEventListener('scroll', onSweep);
    };
    var onSweep = function () { if (!sweepT) sweepT = setTimeout(sweep, 180); };
    window.addEventListener('scroll', onSweep, { passive: true });
    /* a .shape starts fully clipped, which the browser reports as never on screen,
       so watch its unclipped parent and reveal the shape from there */
    watch.forEach(function (el) {
      var t = el;
      if ((el.classList.contains('shape') || el.classList.contains('card__img') || el.classList.contains('ab4__panel')) && el.parentElement) t = el.parentElement;
      if (t._rvList) { t._rvList.push(el); } else { t._rvList = [el]; targets.push(t); }
      io.observe(t);
    });

    var lazyVid = $('video[data-autoplay]');
    if (lazyVid) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { if (!lazyVid.dataset.userPaused) { loadVid(lazyVid); lazyVid.play().catch(function () {}); } }
          else lazyVid.pause();
        });
      }, { rootMargin: '200px 0px' }).observe(lazyVid);
    }
  }

  /* --- Gentle parallax on floating images --- */
  var floats = $$('[data-parallax]');
  if (!calm && floats.length) {
    var ticking = false;
    var move = function () {
      ticking = false;
      var vh = window.innerHeight;
      var wide = window.innerWidth >= 1100;
      floats.forEach(function (el) {
        if (!wide) { el.style.translate = ''; return; }
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var off = (r.top + r.height / 2) - vh / 2;
        el.style.translate = '0 ' + (off * parseFloat(el.dataset.parallax)).toFixed(1) + 'px';
      });
    };
    var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(move); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    requestAnimationFrame(move);
  }

  /* --- Keyword tags: once the statement and tags are all in view the stage holds still, and as you keep
         scrolling every tag shrinks and drifts inward, as if sinking into the screen. Scroll-driven only;
         same on desktop and phones. --- */
  var pin = $('.intro__pin'), stage = $('.intro__stage');
  if (pin && stage) {
    var pFixed = /[?&]p=([\d.]+)/.exec(location.search); /* review aid: freeze depth, 0 to 1 */
    var pTick = false;
    var setP = function () {
      pTick = false;
      if (pFixed) { stage.style.setProperty('--p', pFixed[1]); return; }
      if (calm) return;
      var r = pin.getBoundingClientRect(), run = r.height - window.innerHeight;
      if (run <= 0) return;
      var p = Math.min(1, Math.max(0, -r.top / run));
      p = p * p * (3 - 2 * p); /* ease in and out */
      stage.style.setProperty('--p', p.toFixed(4));
    };
    var reqP = function () { if (!pTick) { pTick = true; requestAnimationFrame(setP); } };
    window.addEventListener('scroll', reqP, { passive: true });
    window.addEventListener('resize', reqP);
    reqP();
  }

  /* --- Off-screen sections are skipped by the browser until close, which would also hold back their lazy
         photos; start each section's photos loading about two screens ahead so they are ready on arrival. --- */
  if ('IntersectionObserver' in window) {
    var imgIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        imgIO.unobserve(en.target);
        $$('img[loading="lazy"]', en.target).forEach(function (img) { img.loading = 'eager'; });
      });
    }, { rootMargin: '200% 0px' });
    $$('main > section, footer').forEach(function (s) { imgIO.observe(s); });
  }

  /* --- Images that fail to load become labelled placeholders instead of broken icons --- */
  $$('main img, footer img').forEach(function (img) {
    img.addEventListener('error', function () {
      var ph = document.createElement('div');
      ph.className = 'ph ph--img';
      ph.innerHTML = '<span class="ph__label">Placeholder — image failed to load: ' + img.src.split('/').pop() + '</span>';
      img.replaceWith(ph);
    });
  });

  /* --- Newsletter form: state and county options are the live form's own lists --- */
  var STATES = 'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
  var BOTH = 'Clay,Duval,Franklin,Hamilton,Jackson,Jefferson,Lee,Leon,Levy,Liberty,Madison,Marion,Martin,Orange,Polk,Taylor'.split(',');
  var COUNTIES = {
    FL: 'Alachua,Baker,Bay,Bradford,Brevard,Broward,Charlotte,Citrus,Collier,Columbia,DeSoto,Dixie,Escambia,Flagler,Gadsden,Gilchrist,Glades,Gulf,Hardee,Hendry,Hernando,Highlands,Hillsborough,Holmes,Indian River,Lafayette,Lake,Manatee,Miami-Dade,Monroe,Nassau,Okaloosa,Okeechobee,Osceola,Palm Beach,Pasco,Pinellas,Putnam,Santa Rosa,Sarasota,Seminole,St. Johns,St. Lucie,Sumter,Suwannee,Union,Volusia,Wakulla,Walton'.split(',').concat(BOTH).sort(),
    TX: 'Aransas,Atascosa,Athens,Austin,Bandera,Barrington,Bastrop,Bell,Bexar,Blanco,Brazoria,Brazos,Burnet,Caldwell,Calhoun,Cameron,Chambers,Collin,Comal,Dallas,Denton,Ellis,El Paso,Fort Bend,Galveston,Gillespie,Grayson,Guadalupe,Harris,Hays,Henderson,Hidalgo,Hill,Hood,Hunt,Jasper,Johnson,Kaufman,Kendall,Kerr,Llano,Mabank,McLennan,Medina,Montgomery,Navarro,Nueces,Palo Pinto,Parker,Potter,Rockwall,San Jacinto,Tarrant,Tom Green,Travis,Van Zandt,Walker,Waller,Washington,Webb,Wharton,Williamson,Wilson,Wise'.split(',').concat(BOTH).sort()
  };
  function fill(sel, list) {
    sel.innerHTML = '<option value=""></option>' + list.map(function (v) { return '<option>' + v + '</option>'; }).join('');
  }
  function wireForm(form) {
    var state = $('[data-state]', form), county = $('[data-county]', form);
    var sms = $('[data-sms]', form), mobile = $('[data-mobile]', form);
    fill(state, STATES);
    var sync = function () {
      var list = COUNTIES[state.value] || [];
      fill(county, list);
      county.disabled = !list.length;
      county.required = !!list.length;
    };
    state.addEventListener('change', sync);
    sync();
    sms.addEventListener('change', function () { mobile.required = sms.checked; });
    /* Prototype: no endpoint is wired. The live form posts to Salesforce Web-to-Lead. */
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }
  var nlForm = $('#nl-form');
  wireForm(nlForm);

  /* --- Newsletter popup: same form, after 60% scroll or 30s, once per session, never on a phone's first screen --- */
  var pop = $('#pop');
  var popForm = nlForm.cloneNode(true);
  popForm.id = 'pop-nl-form';
  $$('[id]', popForm).forEach(function (el) { el.id = 'pop-' + el.id; });
  $$('label[for]', popForm).forEach(function (l) { l.htmlFor = 'pop-' + l.htmlFor; });
  $('#pop-form').appendChild(popForm);
  wireForm(popForm);

  function openPop() {
    if (pop.open || store.get('cg-pop') || mm.open || root.classList.contains('loading')) return false;
    store.set('cg-pop');
    pop.showModal();
    window.removeEventListener('scroll', popOnScroll);
    return true;
  }
  function scrolled() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  }
  var timeUp = false;
  function popOnScroll() {
    var phone = window.innerWidth < 760;
    if (scrolled() >= 0.6) openPop();
    else if (timeUp && (!phone || window.scrollY > window.innerHeight)) openPop();
  }
  if (!store.get('cg-pop') && !/[?&]nopop/.test(location.search)) {
    window.addEventListener('scroll', popOnScroll, { passive: true });
    setTimeout(function () { timeUp = true; popOnScroll(); }, 30000);
  }
  if (/[?&]pop=1/.test(location.search)) pop.showModal();
  $('#pop-close').addEventListener('click', function () { pop.close(); });
  pop.addEventListener('click', function (e) { if (e.target === pop) pop.close(); }); /* click outside (the backdrop) */
})();
