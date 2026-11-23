/* Viewport Studio 3D — interacción de la web. Sin dependencias. */
(function () {
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = root.lang === 'en' ? 'en' : 'es';
  try { localStorage.setItem('vs3d-locale', lang); } catch (e) {}

  /* Menú móvil: bloquea el scroll, se cierra con Esc, al elegir enlace o al pasar a escritorio */
  var burger = d.querySelector('.burger');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    burger && burger.setAttribute('aria-expanded', String(open));
    d.body.style.overflow = open ? 'hidden' : '';
    var menu = d.getElementById('menu');
    if (menu) { menu.inert = !open; menu.setAttribute('aria-hidden', String(!open)); }
  }
  if (burger) {
    setMenu(false);
    burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    d.querySelectorAll('#menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width:1024px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* Sección activa en la navegación */
  var navLinks = Array.prototype.slice.call(d.querySelectorAll('.nav-links a[href^="#"]'));
  if ('IntersectionObserver' in window && navLinks.length) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var s = d.querySelector(a.getAttribute('href')); s && navIo.observe(s); });
  }

  /* Revelado al entrar en pantalla */
  var reveals = d.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduce) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
    // Seguridad: si algo falla, nada se queda invisible
    setTimeout(function () { d.querySelectorAll('[data-reveal]:not(.in)').forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }); }, 2500);
  }

  /* Vídeos de las tarjetas: solo se reproducen mientras se ven */
  var cardVideos = d.querySelectorAll('.card video');
  if ('IntersectionObserver' in window && !reduce) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (v.preload === 'none') v.preload = 'auto';
          // Algunos vídeos empiezan en negro: arrancan en su mejor momento la primera vez
          if (v.dataset.start && !v.dataset.started) {
            v.dataset.started = '1';
            var go = function () { try { v.currentTime = parseFloat(v.dataset.start); } catch (e) {} };
            v.readyState >= 1 ? go() : v.addEventListener('loadedmetadata', go, { once: true });
          }
          var p = v.play(); p && p.catch(function () {});
        }
        else v.pause();
      });
    }, { threshold: 0.25 });
    cardVideos.forEach(function (v) { vio.observe(v); });
  }

  /* Reel del hero: recorre los proyectos con barras de progreso tipo "stories" */
  var reel = d.querySelector('.reel');
  if (reel) {
    var vids = Array.prototype.slice.call(reel.querySelectorAll('video'));
    var bars = Array.prototype.slice.call(reel.querySelectorAll('.reel-bars b'));
    var cap = reel.querySelector('[data-cap]'), capTag = reel.querySelector('[data-cap-tag]'), capIdx = reel.querySelector('[data-cap-idx]');
    var cur = 0, raf = 0;
    function show(i) {
      var prev = vids[cur];
      cur = (i + vids.length) % vids.length;
      var v = vids[cur];
      vids.forEach(function (x, k) { x.classList.toggle('on', k === cur); });
      bars.forEach(function (b, k) { b.style.width = k < cur ? '100%' : '0%'; });
      if (cap) { cap.textContent = v.dataset.name; capTag.textContent = v.dataset.tag; capIdx.textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(vids.length).padStart(2, '0'); }
      if (prev && prev !== v) setTimeout(function () { prev.pause(); }, 900);
      if (reduce) return;
      v.preload = 'auto';
      try { v.currentTime = 0; } catch (e) {}
      var p = v.play(); p && p.catch(function () {});
      // precarga el siguiente
      var n = vids[(cur + 1) % vids.length]; if (n.preload === 'none') n.preload = 'metadata';
    }
    function tick() {
      var v = vids[cur];
      if (v.duration) {
        var limit = Math.min(v.duration, 9);
        bars[cur].style.width = Math.min(100, (v.currentTime / limit) * 100) + '%';
        if (v.currentTime >= limit - 0.05) { show(cur + 1); }
      }
      raf = requestAnimationFrame(tick);
    }
    vids.forEach(function (v) { v.addEventListener('ended', function () { if (v === vids[cur]) show(cur + 1); }); });
    reel.addEventListener('click', function (e) {
      var r = reel.getBoundingClientRect();
      show(e.clientX - r.left < r.width / 3 ? cur - 1 : cur + 1);
    });
    show(0);
    if (!reduce) raf = requestAnimationFrame(tick);
    d.addEventListener('visibilitychange', function () {
      if (d.hidden) { vids[cur].pause(); cancelAnimationFrame(raf); }
      else if (!reduce) { var p = vids[cur].play(); p && p.catch(function () {}); raf = requestAnimationFrame(tick); }
    });
  }

  /* Manifiesto: las palabras se encienden según avanza el scroll */
  var man = d.querySelector('.manifesto');
  if (man && !reduce) {
    var words = man.querySelectorAll('.mw'), ticking = false;
    function lit() {
      ticking = false;
      var r = man.getBoundingClientRect(), vh = innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      var n = Math.round(Math.max(0, Math.min(1, p)) * words.length);
      words.forEach(function (w, i) { w.classList.toggle('lit', i < n); });
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(lit); } }, { passive: true });
    lit();
  }

  /* Visor a pantalla completa */
  var lb = d.getElementById('lb');
  if (lb) {
    var lbVideo = lb.querySelector('video'), lbTitle = lb.querySelector('.t'), list = [], li = 0, opener = null;
    var prevBtn = lb.querySelector('[data-prev]'), nextBtn = lb.querySelector('[data-next]');
    function load() {
      var it = list[li];
      lbVideo.innerHTML = '<source src="' + it + '.webm" type="video/webm"><source src="' + it + '.mp4" type="video/mp4">';
      lbVideo.load(); var p = lbVideo.play(); p && p.catch(function () {});
      prevBtn.hidden = nextBtn.hidden = list.length < 2;
    }
    function open(btn) {
      opener = btn; list = btn.dataset.videos.split(','); li = 0;
      lbTitle.textContent = btn.dataset.title;
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); lb.inert = false;
      d.body.style.overflow = 'hidden'; load();
      lb.querySelector('[data-close]').focus();
    }
    function close() {
      lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); lb.inert = true;
      lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.innerHTML = ''; d.body.style.overflow = '';
      opener && opener.focus();
    }
    lb.inert = true;
    d.querySelectorAll('[data-videos]').forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
    lb.querySelector('[data-close]').addEventListener('click', close);
    prevBtn.addEventListener('click', function () { li = (li - 1 + list.length) % list.length; load(); });
    nextBtn.addEventListener('click', function () { li = (li + 1) % list.length; load(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
  }

  /* Formulario: prepara el correo en la aplicación del visitante */
  var form = d.getElementById('order');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var f = new FormData(form);
      var subject = (lang === 'es' ? 'Presupuesto 3D · ' : '3D quote · ') + f.get('name');
      var body = f.get('message') + '\n\n— ' + f.get('name') + ' (' + f.get('email') + ')';
      location.href = 'mailto:' + form.dataset.to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  /* Cookies: medición solo si se acepta (misma clave que el resto de páginas) */
  var KEY = 'vs3d-cookies', box = d.getElementById('cookies');
  function consent(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
    if (v === 'granted') { window.gtag && gtag('consent', 'update', { analytics_storage: 'granted' }); window.vsLoadGTM && vsLoadGTM(); }
    else { window.gtag && gtag('consent', 'update', { analytics_storage: 'denied' }); }
    box.classList.remove('show');
  }
  if (box) {
    var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved === 'granted') consent('granted'); else if (saved !== 'denied') box.classList.add('show');
    box.querySelector('[data-accept]').addEventListener('click', function () { consent('granted'); });
    box.querySelector('[data-reject]').addEventListener('click', function () { consent('denied'); });
    d.querySelectorAll('[data-cookie-settings]').forEach(function (b) { b.addEventListener('click', function () { box.classList.add('show'); }); });
  }

  var y = d.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
