/* Duriti - comportamiento interactivo
   Autor: Juan Sebastián Nieto Preciado - GA7-220501102-AA1-EV01
   Módulos: 1) menú activo, 2) revelar al desplazar, 3) cotizador, 4) formulario con validación,
            5) enlace de WhatsApp. Los precios son valores de ejemplo. */
(function () {
  'use strict';

  var WHATSAPP = '573000000000'; // número de ejemplo, reemplazar por el real de Duriti
  var money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  /* ---------- 1. Marcar la página actual en el menu ---------- */
  function marcarMenu() {
    var actual = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(function (a) {
      var destino = (a.getAttribute('href') || '').split('#')[0] || 'index.html';
      var hash = a.getAttribute('href').indexOf('#') > -1;
      if (!hash && destino === actual) { a.classList.add('activo'); a.setAttribute('aria-current', 'page'); }
    });
  }

  /* ---------- 2. Revelar elementos al desplazar (IntersectionObserver) ---------- */
  function revelar() {
    var els = document.querySelectorAll('.revelar');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('visible'); }); return; }
    var obs = new IntersectionObserver(function (items) {
      items.forEach(function (it) { if (it.isIntersecting) { it.target.classList.add('visible'); obs.unobserve(it.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { obs.observe(e); });
  }

  /* ---------- 3. Cotizador: calcula un estimado según plan y extras ---------- */
  var PRECIOS = { basico: 490000, profesional: 1200000, premium: 2400000 };
  var PAGINAS_INCLUIDAS = { basico: 4, profesional: 8, premium: Infinity };
  var PAGINA_EXTRA = 90000, EXTRA_TIENDA = 600000, EXTRA_SEO = 200000, EXTRA_BLOG = 150000;

  function calcularCotizacion(plan, paginas, tienda, seo, blog) {
    var total = PRECIOS[plan];
    var extraPag = Math.max(0, paginas - PAGINAS_INCLUIDAS[plan]);
    total += extraPag * PAGINA_EXTRA;
    if (tienda && plan !== 'premium') total += EXTRA_TIENDA;
    if (seo && plan === 'basico') total += EXTRA_SEO;
    if (blog && plan === 'basico') total += EXTRA_BLOG;
    return total;
  }

  function iniciarCotizador() {
    var f = document.getElementById('cotizador');
    if (!f) return;
    var salida = document.getElementById('cot-monto');
    var detalle = document.getElementById('cot-detalle');
    var enlace = document.getElementById('cot-enlace');
    function actualizar() {
      var plan = f.plan.value;
      var paginas = Math.max(1, parseInt(f.paginas.value, 10) || 1);
      var t = f.tienda.checked, s = f.seo.checked, b = f.blog.checked;
      var total = calcularCotizacion(plan, paginas, t, s, b);
      salida.textContent = money.format(total);
      var incl = PAGINAS_INCLUIDAS[plan] === Infinity ? 'ilimitadas' : PAGINAS_INCLUIDAS[plan];
      detalle.textContent = 'Plan ' + plan + ' con ' + paginas + ' página(s); incluye ' + incl + '. Valor de ejemplo, sin IVA.';
      enlace.href = 'contacto.html?plan=' + plan + '&paginas=' + paginas;
    }
    f.addEventListener('input', actualizar);
    f.addEventListener('change', actualizar);
    actualizar();
  }

  /* ---------- 4. Formulario de cotización con validación ---------- */
  var REGLAS = {
    nombre: function (v) { return v.trim().length >= 3 && /^[A-Za-zÀ-ſ' .-]+$/.test(v.trim()) ? '' : 'Escribe tu nombre (mínimo 3 letras, sin números).'; },
    correo: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Escribe un correo válido, por ejemplo nombre@empresa.com.'; },
    telefono: function (v) { return v.trim() === '' || /^3\d{9}$/.test(v.replace(/[\s-]/g, '')) ? '' : 'El celular debe tener 10 dígitos y empezar por 3 (opcional).'; },
    servicio: function (v) { return v !== '' ? '' : 'Elige el servicio que te interesa.'; },
    mensaje: function (v) { return v.trim().length >= 20 ? '' : 'Cuéntanos un poco más de tu proyecto (mínimo 20 caracteres).'; },
    acepto: function (v, el) { return el.checked ? '' : 'Debes aceptar el tratamiento de tus datos para enviar la solicitud.'; }
  };

  function validarCampo(el) {
    var regla = REGLAS[el.name];
    if (!regla) return true;
    var error = regla(el.value, el);
    var msg = document.getElementById('err-' + el.name);
    if (msg) { msg.textContent = error; msg.classList.toggle('visible', error !== ''); }
    el.classList.toggle('campo-error', error !== '');
    el.classList.toggle('campo-ok', error === '' && (el.value.trim() !== '' || el.type === 'checkbox'));
    el.setAttribute('aria-invalid', error !== '' ? 'true' : 'false');
    return error === '';
  }

  function iniciarFormulario() {
    var f = document.getElementById('form-cotizacion');
    if (!f) return;
    var campos = Array.prototype.slice.call(f.querySelectorAll('input[name], select[name], textarea[name]'));
    var contador = document.getElementById('contador');

    // precargar el plan que llega por la URL (?plan=profesional&paginas=6)
    var p = new URLSearchParams(location.search);
    var plan = p.get('plan');
    if (plan && ['basico', 'profesional', 'premium'].indexOf(plan) > -1) {
      f.servicio.value = 'plan-' + plan;
      var aviso = document.getElementById('aviso-plan');
      if (aviso) { aviso.textContent = 'Plan elegido: ' + plan.charAt(0).toUpperCase() + plan.slice(1) + (p.get('paginas') ? ' con ' + p.get('paginas') + ' páginas' : ''); aviso.hidden = false; }
    }

    campos.forEach(function (c) {
      c.addEventListener('blur', function () { validarCampo(c); });
      c.addEventListener('input', function () { if (c.classList.contains('campo-error')) validarCampo(c); });
    });
    f.mensaje.addEventListener('input', function () { contador.textContent = f.mensaje.value.length + ' caracteres'; });

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var primero = null;
      campos.forEach(function (c) { if (!validarCampo(c) && !primero) primero = c; });
      if (primero) { primero.focus(); return; }
      // Prototipo: aquí iría el envio al servidor (por ejemplo, un plugin de formularios de WordPress).
      var ok = document.getElementById('confirmacion');
      ok.querySelector('strong').textContent = f.nombre.value.trim().split(' ')[0];
      ok.classList.add('visible');
      ok.focus();
      f.reset();
      campos.forEach(function (c) { c.classList.remove('campo-ok', 'campo-error'); });
      contador.textContent = '0 caracteres';
    });
  }

  /* ---------- 5. Enlace de WhatsApp con mensaje prellenado ---------- */
  function construirWhatsApp(texto) { return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto); }
  function iniciarWhatsApp() {
    document.querySelectorAll('[data-whatsapp]').forEach(function (a) {
      a.href = construirWhatsApp(a.getAttribute('data-whatsapp') || 'Hola, quiero una cotización para mi sitio web.');
      a.target = '_blank'; a.rel = 'noopener';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    marcarMenu(); revelar(); iniciarCotizador(); iniciarFormulario(); iniciarWhatsApp();
  });
})();
