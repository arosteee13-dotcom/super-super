/* ============================================================
   SúperSúper — Cliente frontend (app.js)
   JavaScript Vanilla. Sin dependencias externas.
   Se comunica con el backend en GET /api/buscar?q=...
   ============================================================ */

// =============================================================
// 1.  COLORES CORPORATIVOS (coinciden con filtros del HTML)
// =============================================================

const COLORES_SUPER = {
  Mercadona: '#00a650',
  Dia: '#e21119',
  Bonpreu: '#ff7900',
  Condis: '#e30613',
  'bonÀrea': '#004B87',
  Caprabo: '#009ee0',
  Lidl: '#0050aa',
  'Ametller Origen': '#314638',
  'La Sirena': '#003399'
};

// Mapeo de supermercado → ruta de su logotipo SVG
// 5 logos reales descargados de Wikipedia Commons (Mercadona, Dia, Bonpreu, Caprabo, Lidl)
// 4 logos simplificados creados para los que no estaban disponibles en Commons
const BRANDFETCH_BASE = 'https://cdn.brandfetch.io';
const BRANDFETCH_PARAMS = 'w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667599901347';

const LOGOS_SUPER = {
  Mercadona: `${BRANDFETCH_BASE}/mercadona.es/${BRANDFETCH_PARAMS}`,
  Dia: `${BRANDFETCH_BASE}/dia.es/${BRANDFETCH_PARAMS}`,
  Bonpreu: `https://cdn.brandfetch.io/idzWmvu6t1/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1773741883570`,
  Condis: `${BRANDFETCH_BASE}/condis.es/${BRANDFETCH_PARAMS}`,
  'bonÀrea': `${BRANDFETCH_BASE}/bonarea.com/${BRANDFETCH_PARAMS}`,
  Caprabo: `${BRANDFETCH_BASE}/caprabo.com/${BRANDFETCH_PARAMS}`,
  Lidl: `${BRANDFETCH_BASE}/lidl.es/${BRANDFETCH_PARAMS}`,
  'Ametller Origen': `${BRANDFETCH_BASE}/ametllerorigen.com/${BRANDFETCH_PARAMS}`,
  'La Sirena': `${BRANDFETCH_BASE}/lasirena.es/${BRANDFETCH_PARAMS}`
};

// Abreviaturas como fallback por si una imagen no carga
const ABREVIATURAS_SUPER = {
  Mercadona: 'M',
  Dia: 'D',
  Bonpreu: 'B',
  Condis: 'Co',
  'bonÀrea': 'bA',
  Caprabo: 'Ca',
  Lidl: 'L',
  'Ametller Origen': 'A',
  'La Sirena': 'S'
};


// =============================================================
// 2.  ESTADO DE LA APLICACIÓN
// =============================================================

const estado = {
  busqueda: '',
  resultados: [],               // datos devueltos por el backend
  supermercadosActivos: new Set(
    Object.keys(COLORES_SUPER)  // por defecto todos activos
  ),
  timeoutId: null,               // para el debounce
  vistaFiltros: localStorage.getItem('super_vista_filtros') || 'logo-name'
};


// =============================================================
// 3.  FUNCIONES AUXILIARES
// =============================================================

/**
 * Formatea un número decimal como precio en euros (ES).
 * Ejemplo: 1.5 → "1,50 €"
 */
function formatearPrecio(precio) {
  return precio.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}


// =============================================================
// 4.  PETICIÓN AL BACKEND
// =============================================================

/**
 * Llama al backend (GET /api/buscar?q=...) y devuelve el JSON.
 * Lanza error si la respuesta HTTP no es OK.
 */
async function buscarEnBackend(termino) {
  const url = `/api/buscar?q=${encodeURIComponent(termino)}`;
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
  }

  return respuesta.json();
}


// =============================================================
// 5.  DEBOUNCE + LANZAMIENTO DE BÚSQUEDA
// =============================================================

/**
 * Se ejecuta en cada pulsación del input.
 * - Si < 3 caracteres → limpia resultados y muestra aviso.
 * - Si >= 3 caracteres → espera 300ms (debounce) y lanza fetch.
 */
function manejarCambioBusqueda() {
  const input = document.getElementById('buscador-input');
  const termino = input.value.trim();

  // Cancelar el timeout pendiente
  if (estado.timeoutId) {
    clearTimeout(estado.timeoutId);
    estado.timeoutId = null;
  }

  // Limpiar mensaje de error previo
  document.getElementById('error-msg').textContent = '';

  // Mínimo 3 caracteres
  if (termino.length < 3) {
    estado.busqueda = '';
    estado.resultados = [];
    estado.timeoutId = null;

    const contenedor = document.getElementById('products-container');
    contenedor.innerHTML =
      '<p class="resultados-vacio">Escribe al menos 3 caracteres para buscar productos.</p>';
    return;
  }

  // Debounce: esperar 300ms a que el usuario deje de escribir
  estado.timeoutId = setTimeout(async () => {
    estado.busqueda = termino;

    try {
      const datos = await buscarEnBackend(termino);
      estado.resultados = datos;
      aplicarFiltros();
    } catch (error) {
      estado.resultados = [];
      document.getElementById('error-msg').textContent =
        'Error al conectar con el servidor. Asegúrate de que el backend esté corriendo en http://localhost:3000.';
      console.error('Error en la búsqueda:', error);
      aplicarFiltros();
    }
  }, 300);
}


// =============================================================
// 6.  FILTRADO LOCAL (por supermercados activos)
// =============================================================

/**
 * Toma los resultados almacenados en estado.resultados y filtra
 * los supermercados según los que el usuario tenga activos.
 *
 * Si un producto no tiene datos para TODOS los supermercados
 * activos, se oculta entero.
 */
function aplicarFiltros() {
  const contenedor = document.getElementById('products-container');

  if (estado.resultados.length === 0) {
    contenedor.innerHTML =
      '<p class="resultados-vacio">No se encontraron productos.</p>';
    return;
  }

  // 1. Filtrar productos que cubran TODOS los supermercados activos
  let filtrados = estado.resultados;
  if (estado.supermercadosActivos.size > 0) {
    filtrados = filtrados.filter(p => {
      const disponibles = p.supermercados.map(s => s.nombre);
      return [...estado.supermercadosActivos]
        .every(s => disponibles.includes(s));
    });
  }

  // 2. Dentro de cada producto, filtrar solo los supermercados activos
  filtrados = filtrados.map(p => ({
    ...p,
    supermercados: p.supermercados.filter(s =>
      estado.supermercadosActivos.has(s.nombre)
    )
  }));

  renderizarProductos(filtrados);
}


// =============================================================
// 7.  RENDERIZADO DE TARJETAS
// =============================================================

function renderizarProductos(productos) {
  const contenedor = document.getElementById('products-container');
  contenedor.innerHTML = '';

  if (productos.length === 0) {
    const vacio = document.createElement('p');
    vacio.className = 'resultados-vacio';
    vacio.textContent = 'No se encontraron productos con los filtros seleccionados.';
    contenedor.appendChild(vacio);
    return;
  }

  for (const producto of productos) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta-producto';

    // ── Imagen del producto ──
    if (producto.imagen_url) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'tarjeta-imagen-wrapper';

      const img = document.createElement('img');
      img.src = producto.imagen_url;
      img.alt = producto.nombre;
      img.loading = 'lazy';
      imgWrapper.appendChild(img);
      tarjeta.appendChild(imgWrapper);
    }

    // ── Nombre del producto ──
    const nombre = document.createElement('h3');
    nombre.className = 'producto-nombre';
    nombre.textContent = producto.nombre;
    tarjeta.appendChild(nombre);

    // ── Lista de precios ──
    const lista = document.createElement('ul');
    lista.className = 'producto-precios';

    // Los supermercados ya vienen ordenados por precio ascendente
    // desde el backend, pero lo re-ordenamos por si acaso.
    const ordenados = [...producto.supermercados]
      .sort((a, b) => a.precio - b.precio);

    const mejorPrecio = ordenados.length > 0 ? ordenados[0].precio : null;

    for (const item of ordenados) {
      const li = document.createElement('li');
      li.className = 'precio-item';

      // Marcar la fila más barata
      if (item.precio === mejorPrecio) {
        li.classList.add('mejor-precio');
      }

      // Color corporativo en la fila (para el borde lateral)
      li.style.setProperty(
        '--super-color',
        COLORES_SUPER[item.nombre] || '#aaa'
      );

      // Avatar circular con logotipo SVG
      const avatar = document.createElement('img');
      avatar.className = 'super-avatar';
      avatar.src = LOGOS_SUPER[item.nombre] || '';
      avatar.alt = item.nombre;
      avatar.loading = 'lazy';
      // Fallback: si la imagen no carga, muestra la abreviatura
      avatar.onerror = function () {
        this.onerror = null;
        const fallback = document.createElement('span');
        fallback.className = 'super-avatar super-avatar--fallback';
        fallback.textContent = ABREVIATURAS_SUPER[item.nombre] || item.nombre.charAt(0);
        this.replaceWith(fallback);
      };
      li.appendChild(avatar);

      // Nombre del supermercado
      const nombreSpan = document.createElement('span');
      nombreSpan.className = 'super-nombre';
      nombreSpan.textContent = item.nombre;
      li.appendChild(nombreSpan);

      // Columna precio (valor + precio unitario)
      const colPrecio = document.createElement('span');
      colPrecio.className = 'precio-col';

      const precioSpan = document.createElement('span');
      precioSpan.className = 'precio-valor';
      precioSpan.textContent = formatearPrecio(item.precio);
      colPrecio.appendChild(precioSpan);

      // Precio por unidad (enviado por el backend)
      if (item.precio_unidad) {
        const unidadSpan = document.createElement('span');
        unidadSpan.className = 'precio-unidad';
        unidadSpan.textContent = item.precio_unidad;
        colPrecio.appendChild(unidadSpan);
      }

      li.appendChild(colPrecio);
      lista.appendChild(li);
    }

    tarjeta.appendChild(lista);
    contenedor.appendChild(tarjeta);
  }
}


// =============================================================
// 8.  EVENTOS E INICIALIZACIÓN
// =============================================================

function inicializar() {
  const inputBusqueda = document.getElementById('buscador-input');
  const botonesFiltro = document.querySelectorAll('.filtro-btn');
  const errorMsg = document.getElementById('error-msg');

  // ── Búsqueda en tiempo real con debounce ──
  inputBusqueda.addEventListener('input', manejarCambioBusqueda);

  // ── Toggle de supermercados ──
  for (const btn of botonesFiltro) {
    btn.addEventListener('click', function () {
      const supermercado = this.dataset.super;

      if (estado.supermercadosActivos.has(supermercado)) {
        // No permitir desactivar el último
        if (estado.supermercadosActivos.size === 1) return;
        estado.supermercadosActivos.delete(supermercado);
        this.classList.remove('activo');
      } else {
        estado.supermercadosActivos.add(supermercado);
        this.classList.add('activo');
      }

      // Re-filtrar los resultados que ya tenemos
      if (estado.resultados.length > 0) {
        aplicarFiltros();
      }
    });
  }

  // ── Bottom Navigation ──
  inicializarTabs();

  // ── Ajustes ──
  aplicarVistaFiltros(estado.vistaFiltros);
  inicializarAjustes();

  // ── Estado inicial ──
  document.getElementById('products-container').innerHTML =
    '<p class="resultados-vacio">Escribe al menos 3 caracteres para buscar productos.</p>';
}


// =============================================================
// 9.  BOTTOM NAVIGATION — cambio de pestañas
// =============================================================

function inicializarTabs() {
  const tabs = document.querySelectorAll('.bottom-nav-btn');
  const sectionIds = ['tab-buscar', 'tab-listas', 'tab-chollos', 'tab-ajustes'];

  const sections = {};
  for (const id of sectionIds) {
    sections[id] = document.getElementById(id);
  }

  for (const tab of tabs) {
    tab.addEventListener('click', function () {
      const tabName = this.dataset.tab;
      const sectionId = 'tab-' + tabName;

      // Desactivar todas las pestañas
      tabs.forEach(t => t.classList.remove('activo'));
      for (const id of sectionIds) {
        sections[id].classList.remove('tab-section--active');
      }

      // Activar la seleccionada
      this.classList.add('activo');
      sections[sectionId].classList.add('tab-section--active');
    });
  }
}


// =============================================================
// 10. AJUSTES — vista de los filtros
// =============================================================

function aplicarVistaFiltros(vista) {
  const filtros = document.getElementById('filtros');
  if (!filtros) return;
  filtros.classList.remove('filtros-logo-only', 'filtros-logo-name', 'filtros-name-only');
  if (vista === 'logo-only') {
    filtros.classList.add('filtros-logo-only');
  } else if (vista === 'name-only') {
    filtros.classList.add('filtros-name-only');
  } else {
    filtros.classList.add('filtros-logo-name');
  }
}

function inicializarAjustes() {
  const radios = document.querySelectorAll('input[name="filtro-vista"]');
  if (!radios.length) return;

  // Marcar la opción guardada
  for (const radio of radios) {
    if (radio.value === estado.vistaFiltros) {
      radio.checked = true;
    }
    radio.addEventListener('change', function () {
      if (!this.checked) return;
      estado.vistaFiltros = this.value;
      try {
        localStorage.setItem('super_vista_filtros', this.value);
      } catch (e) { /* localStorage no disponible */ }
      aplicarVistaFiltros(this.value);
    });
  }
}


// =============================================================
// 11. ARRANQUE
// =============================================================

document.addEventListener('DOMContentLoaded', inicializar);
