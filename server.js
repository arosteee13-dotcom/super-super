/* ============================================================
   SúperSúper — Servidor Express (backend)
   ============================================================
   Sirve el frontend estático desde ./public
   Expone GET /api/buscar?q=... para búsqueda de productos
   Arrancar con: node server.js  →  http://localhost:3000
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// 1.  DEPENDENCIAS
// ─────────────────────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// ─────────────────────────────────────────────────────────────
// 2.  MIDDLEWARE
// ─────────────────────────────────────────────────────────────

// CORS abierto para permitir peticiones desde cualquier origen
// (útil si alguien usa el frontend desde otro puerto/servidor)
app.use(cors({ origin: '*' }));

// Archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));


// ─────────────────────────────────────────────────────────────
// 3.  FUNCIÓN AUXILIAR: formatear precio (ES)
// ─────────────────────────────────────────────────────────────

function formatearPrecio(precio) {
  return precio.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}


// ─────────────────────────────────────────────────────────────
// 4.  FUNCIÓN AUXILIAR: calcular precio por unidad
//
//     Extrae la cantidad y unidad del nombre del producto y
//     devuelve el precio normalizado formateado.
//     Ej: "Leche entera 1L" → "0,89 €/L"
// ─────────────────────────────────────────────────────────────

function calcularPrecioUnidad(nombreProducto, precio) {
  const regex = /(\d+[.,]?\d*)\s*(L|l|kg|g|cl|uds?|latas?|lavados?|unidad(?:es)?)\b/;
  const match = nombreProducto.match(regex);

  if (!match) return null;

  let cantidad = parseFloat(match[1].replace(',', '.'));
  const unidad = match[2].toLowerCase();
  let precioUnitario;
  let etiqueta;

  if (unidad === 'l') {
    precioUnitario = precio / cantidad;
    etiqueta = 'L';
  } else if (unidad === 'cl') {
    precioUnitario = precio / (cantidad / 100);
    etiqueta = 'L';
  } else if (unidad === 'kg') {
    precioUnitario = precio / cantidad;
    etiqueta = 'kg';
  } else if (unidad === 'g') {
    precioUnitario = precio / (cantidad / 1000);
    etiqueta = 'kg';
  } else {
    precioUnitario = precio / cantidad;
    etiqueta = 'ud.';
  }

  return `${formatearPrecio(precioUnitario)}/${etiqueta}`;
}


// ─────────────────────────────────────────────────────────────
// 5.  BASE DE DATOS SIMULADA
//
//     Array de productos con nombre, imagen y precios en los 9
//     supermercados. Cuando la integración real esté lista,
//     este array se sustituirá por los resultados agregados de
//     las APIs/scrapers (ver sección 7 al final del archivo).
//
//     Formato esperado por el frontend:
//
//       {
//         nombre: "Leche entera 1L",
//         imagen_url: "https://...",
//         supermercados: [
//           { nombre: "Dia", precio: 0.89 },
//           { nombre: "Lidl", precio: 0.91 },
//           ...
//         ]
//       }
// ─────────────────────────────────────────────────────────────

const productosDB = [
  {
    nombre: "Leche entera 1L",
    imagen_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 0.89 },
      { nombre: "Lidl", precio: 0.91 },
      { nombre: "Mercadona", precio: 0.95 },
      { nombre: "bonÀrea", precio: 0.99 },
      { nombre: "Caprabo", precio: 1.02 },
      { nombre: "Condis", precio: 1.04 },
      { nombre: "Bonpreu", precio: 1.10 },
      { nombre: "La Sirena", precio: 1.15 },
      { nombre: "Ametller Origen", precio: 1.25 }
    ]
  },
  {
    nombre: "Aceite de oliva virgen extra 1L",
    imagen_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 4.20 },
      { nombre: "Lidl", precio: 4.30 },
      { nombre: "Mercadona", precio: 4.50 },
      { nombre: "bonÀrea", precio: 4.65 },
      { nombre: "Condis", precio: 4.80 },
      { nombre: "Caprabo", precio: 4.90 },
      { nombre: "Bonpreu", precio: 5.20 },
      { nombre: "La Sirena", precio: 5.50 },
      { nombre: "Ametller Origen", precio: 5.95 }
    ]
  },
  {
    nombre: "Pechuga de pollo 1kg",
    imagen_url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Lidl", precio: 5.75 },
      { nombre: "Dia", precio: 5.89 },
      { nombre: "Mercadona", precio: 6.10 },
      { nombre: "bonÀrea", precio: 6.30 },
      { nombre: "Condis", precio: 6.55 },
      { nombre: "Caprabo", precio: 6.80 },
      { nombre: "Bonpreu", precio: 7.20 },
      { nombre: "La Sirena", precio: 7.50 },
      { nombre: "Ametller Origen", precio: 8.20 }
    ]
  },
  {
    nombre: "Arroz redondo 1kg",
    imagen_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 1.05 },
      { nombre: "Lidl", precio: 1.08 },
      { nombre: "Mercadona", precio: 1.20 },
      { nombre: "bonÀrea", precio: 1.25 },
      { nombre: "Condis", precio: 1.30 },
      { nombre: "Caprabo", precio: 1.40 },
      { nombre: "Bonpreu", precio: 1.50 },
      { nombre: "La Sirena", precio: 1.65 },
      { nombre: "Ametller Origen", precio: 1.80 }
    ]
  },
  {
    nombre: "Pan de molde integral 500g",
    imagen_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 1.95 },
      { nombre: "Lidl", precio: 1.99 },
      { nombre: "Mercadona", precio: 2.10 },
      { nombre: "bonÀrea", precio: 2.15 },
      { nombre: "Condis", precio: 2.25 },
      { nombre: "Caprabo", precio: 2.35 },
      { nombre: "Bonpreu", precio: 2.50 },
      { nombre: "La Sirena", precio: 2.60 },
      { nombre: "Ametller Origen", precio: 2.90 }
    ]
  },
  {
    nombre: "Huevos talla M (12 uds)",
    imagen_url: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 2.30 },
      { nombre: "Lidl", precio: 2.35 },
      { nombre: "Mercadona", precio: 2.50 },
      { nombre: "bonÀrea", precio: 2.55 },
      { nombre: "Condis", precio: 2.60 },
      { nombre: "Caprabo", precio: 2.65 },
      { nombre: "Bonpreu", precio: 2.90 },
      { nombre: "La Sirena", precio: 3.10 },
      { nombre: "Ametller Origen", precio: 3.40 }
    ]
  },
  {
    nombre: "Tomate frito 400g",
    imagen_url: "https://images.unsplash.com/photo-1596040033229-98237da283c4?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 1.20 },
      { nombre: "Lidl", precio: 1.22 },
      { nombre: "Mercadona", precio: 1.35 },
      { nombre: "bonÀrea", precio: 1.40 },
      { nombre: "Condis", precio: 1.48 },
      { nombre: "Caprabo", precio: 1.55 },
      { nombre: "Bonpreu", precio: 1.65 },
      { nombre: "La Sirena", precio: 1.70 },
      { nombre: "Ametller Origen", precio: 1.95 }
    ]
  },
  {
    nombre: "Café soluble 200g",
    imagen_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 2.95 },
      { nombre: "Lidl", precio: 3.00 },
      { nombre: "Mercadona", precio: 3.20 },
      { nombre: "bonÀrea", precio: 3.30 },
      { nombre: "Condis", precio: 3.40 },
      { nombre: "Caprabo", precio: 3.45 },
      { nombre: "Bonpreu", precio: 3.80 },
      { nombre: "La Sirena", precio: 4.00 },
      { nombre: "Ametller Origen", precio: 4.50 }
    ]
  },
  {
    nombre: "Yogur natural (4 uds)",
    imagen_url: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 1.45 },
      { nombre: "Lidl", precio: 1.48 },
      { nombre: "Mercadona", precio: 1.60 },
      { nombre: "bonÀrea", precio: 1.65 },
      { nombre: "Condis", precio: 1.75 },
      { nombre: "Caprabo", precio: 1.80 },
      { nombre: "Bonpreu", precio: 1.90 },
      { nombre: "La Sirena", precio: 2.00 },
      { nombre: "Ametller Origen", precio: 2.25 }
    ]
  },
  {
    nombre: "Agua mineral 1.5L",
    imagen_url: "https://images.unsplash.com/photo-1560023907-5f3392ea0d8e?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 0.39 },
      { nombre: "Lidl", precio: 0.41 },
      { nombre: "Mercadona", precio: 0.45 },
      { nombre: "bonÀrea", precio: 0.47 },
      { nombre: "Condis", precio: 0.48 },
      { nombre: "Caprabo", precio: 0.48 },
      { nombre: "Bonpreu", precio: 0.55 },
      { nombre: "La Sirena", precio: 0.60 },
      { nombre: "Ametller Origen", precio: 0.69 }
    ]
  },
  {
    nombre: "Cerveza 33cl (6 latas)",
    imagen_url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Lidl", precio: 4.35 },
      { nombre: "Dia", precio: 4.50 },
      { nombre: "Mercadona", precio: 4.80 },
      { nombre: "bonÀrea", precio: 4.90 },
      { nombre: "Caprabo", precio: 5.00 },
      { nombre: "Condis", precio: 5.10 },
      { nombre: "Bonpreu", precio: 5.50 },
      { nombre: "La Sirena", precio: 5.80 },
      { nombre: "Ametller Origen", precio: 6.30 }
    ]
  },
  {
    nombre: "Plátano de Canarias 1kg",
    imagen_url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11bda4?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 1.75 },
      { nombre: "Lidl", precio: 1.78 },
      { nombre: "Mercadona", precio: 1.90 },
      { nombre: "bonÀrea", precio: 1.95 },
      { nombre: "Condis", precio: 2.00 },
      { nombre: "Caprabo", precio: 2.00 },
      { nombre: "Bonpreu", precio: 2.30 },
      { nombre: "La Sirena", precio: 2.40 },
      { nombre: "Ametller Origen", precio: 2.70 }
    ]
  },
  {
    nombre: "Manzana Golden 1kg",
    imagen_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 1.99 },
      { nombre: "Lidl", precio: 2.05 },
      { nombre: "Mercadona", precio: 2.20 },
      { nombre: "bonÀrea", precio: 2.25 },
      { nombre: "Condis", precio: 2.30 },
      { nombre: "Caprabo", precio: 2.35 },
      { nombre: "Bonpreu", precio: 2.60 },
      { nombre: "La Sirena", precio: 2.80 },
      { nombre: "Ametller Origen", precio: 3.10 }
    ]
  },
  {
    nombre: "Salmón fresco 200g",
    imagen_url: "https://images.unsplash.com/photo-1599084993091-1cb5c0722cc8?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Lidl", precio: 5.10 },
      { nombre: "Dia", precio: 5.20 },
      { nombre: "Mercadona", precio: 5.50 },
      { nombre: "bonÀrea", precio: 5.60 },
      { nombre: "Condis", precio: 5.80 },
      { nombre: "Caprabo", precio: 6.00 },
      { nombre: "Bonpreu", precio: 6.50 },
      { nombre: "La Sirena", precio: 6.80 },
      { nombre: "Ametller Origen", precio: 7.50 }
    ]
  },
  {
    nombre: "Queso curado 250g",
    imagen_url: "https://images.unsplash.com/photo-1486297678162-eb2a19b0aa32?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 3.50 },
      { nombre: "Lidl", precio: 3.55 },
      { nombre: "Mercadona", precio: 3.80 },
      { nombre: "bonÀrea", precio: 3.85 },
      { nombre: "Condis", precio: 3.95 },
      { nombre: "Caprabo", precio: 4.00 },
      { nombre: "Bonpreu", precio: 4.40 },
      { nombre: "La Sirena", precio: 4.60 },
      { nombre: "Ametller Origen", precio: 5.10 }
    ]
  },
  {
    nombre: "Leche sin lactosa 1L",
    imagen_url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 1.05 },
      { nombre: "Lidl", precio: 1.08 },
      { nombre: "Mercadona", precio: 1.10 },
      { nombre: "bonÀrea", precio: 1.12 },
      { nombre: "Condis", precio: 1.15 },
      { nombre: "Caprabo", precio: 1.15 },
      { nombre: "Bonpreu", precio: 1.30 },
      { nombre: "La Sirena", precio: 1.35 },
      { nombre: "Ametller Origen", precio: 1.50 }
    ]
  },
  {
    nombre: "Atún claro en aceite oliva 2 latas",
    imagen_url: "https://images.unsplash.com/photo-1597590046000-1e851c3c7e7a?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 3.10 },
      { nombre: "Lidl", precio: 3.20 },
      { nombre: "Mercadona", precio: 3.40 },
      { nombre: "bonÀrea", precio: 3.45 },
      { nombre: "Condis", precio: 3.50 },
      { nombre: "Caprabo", precio: 3.55 },
      { nombre: "Bonpreu", precio: 3.90 },
      { nombre: "La Sirena", precio: 4.10 },
      { nombre: "Ametller Origen", precio: 4.50 }
    ]
  },
  {
    nombre: "Pasta espagueti 500g",
    imagen_url: "https://images.unsplash.com/photo-1551462145-15f5adc3049a?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 0.99 },
      { nombre: "Lidl", precio: 1.02 },
      { nombre: "Mercadona", precio: 1.15 },
      { nombre: "bonÀrea", precio: 1.18 },
      { nombre: "Condis", precio: 1.25 },
      { nombre: "Caprabo", precio: 1.30 },
      { nombre: "Bonpreu", precio: 1.40 },
      { nombre: "La Sirena", precio: 1.50 },
      { nombre: "Ametller Origen", precio: 1.70 }
    ]
  },
  {
    nombre: "Detergente lavadora 30 lavados",
    imagen_url: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Lidl", precio: 6.70 },
      { nombre: "Dia", precio: 6.90 },
      { nombre: "Mercadona", precio: 7.50 },
      { nombre: "bonÀrea", precio: 7.70 },
      { nombre: "Condis", precio: 7.90 },
      { nombre: "Caprabo", precio: 8.00 },
      { nombre: "Bonpreu", precio: 8.90 },
      { nombre: "La Sirena", precio: 9.50 },
      { nombre: "Ametller Origen", precio: 10.50 }
    ]
  },
  {
    nombre: "Gallina entera 1kg",
    imagen_url: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=400&fit=crop",
    supermercados: [
      { nombre: "Dia", precio: 3.50 },
      { nombre: "Lidl", precio: 3.60 },
      { nombre: "Mercadona", precio: 3.95 },
      { nombre: "bonÀrea", precio: 4.00 },
      { nombre: "Condis", precio: 4.25 },
      { nombre: "Caprabo", precio: 4.30 },
      { nombre: "Bonpreu", precio: 4.60 },
      { nombre: "La Sirena", precio: 5.00 },
      { nombre: "Ametller Origen", precio: 5.50 }
    ]
  }
];


// ─────────────────────────────────────────────────────────────
// 6.  ENDPOINT: GET /api/buscar?q=producto
//     ─────────────────────────────────────────────────────────
//     Recibe un término de búsqueda y devuelve los productos
//     cuyo nombre lo contenga (case-insensitive).
//
//     Cada producto en la respuesta incluye:
//       - nombre         : string
//       - imagen_url     : string (URL pública)
//       - supermercados  : array ordenado por precio ascendente
//         cada uno con:
//           - nombre        : string
//           - precio        : number
//           - precio_unidad : string | null
//
//     Si el término tiene menos de 2 caracteres, devuelve [].
// ─────────────────────────────────────────────────────────────

app.get('/api/buscar', (req, res) => {
  const query = (req.query.q || '').trim();

  // Mínimo 2 caracteres para evitar respuestas masivas
  if (query.length < 2) {
    return res.json([]);
  }

  const termino = query.toLowerCase();

  // Filtrar productos por nombre
  const resultados = productosDB
    .filter(p => p.nombre.toLowerCase().includes(termino))
    .map(p => {
      // Clonar y enriquecer con precio por unidad
      const supermercados = p.supermercados
        .map(s => ({
          nombre: s.nombre,
          precio: s.precio,
          precio_unidad: calcularPrecioUnidad(p.nombre, s.precio)
        }))
        // Ordenar de menor a mayor precio
        .sort((a, b) => a.precio - b.precio);

      return {
        nombre: p.nombre,
        imagen_url: p.imagen_url,
        supermercados
      };
    });

  res.json(resultados);
});


// ─────────────────────────────────────────────────────────────
// 7.  FALLBACK: cualquier otra ruta sirve index.html
//     (permite recargar la página en rutas amigables)
// ─────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// ─────────────────────────────────────────────────────────────
// 8.  ARRANQUE DEL SERVIDOR
// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  🛒  SúperSúper corriendo en http://localhost:${PORT}\n`);
});


// =============================================================
// 9.  🚀 GUÍA DE INTEGRACIÓN CON APIs REALES
//     ========================================================
//
//     El array `productosDB` de arriba es simulado. En
//     producción se sustituiría por datos reales obtenidos de
//     las APIs o scraping de cada supermercado.
//
//     A continuación se muestran ejemplos funcionales para
//     las principales cadenas.
//
// =============================================================
//
// ─────────────────────────────────────────────────────────────
// 9.1  MERCADONA — API REST pública
//
//   Mercadona expone un endpoint JSON público. Ejemplo con
//   axios (npm i axios):
//
//   const axios = require('axios');
//
//   async function buscarMercadona(producto) {
//     try {
//       const { data } = await axios.get(
//         `https://tienda.mercadona.es/api/products/`,
//         {
//           params: { q: producto, lang: 'es' },
//           headers: {
//             'User-Agent':
//               'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
//               + 'AppleWebKit/605.1.15 (KHTML, like Gecko) '
//               + 'Version/17.0 Mobile/15E148 Safari/604.1',
//             'Accept': 'application/json',
//             'Referer': 'https://tienda.mercadona.es/'
//           },
//           timeout: 8000
//         }
//       );
//
//       return data.results
//         .filter(item => item.price_instructions)
//         .map(item => ({
//           nombre: item.display_name,
//           precio: item.price_instructions.unit_price,
//           imagen_url:
//             'https://tienda.mercadona.es'
//             + item.thumbnail?.replace('{RESOLUTION}', '400x400')
//         }));
//
//     } catch (error) {
//       console.error('Error Mercadona:', error.message);
//       return [];
//     }
//   }
//
// ─────────────────────────────────────────────────────────────
// 9.2  DIA — Scraping con Puppeteer
//
//   Dia no ofrece API pública. Se puede scrappear con Puppeteer
//   (npm i puppeteer):
//
//   const puppeteer = require('puppeteer');
//
//   async function buscarDia(producto) {
//     const browser = await puppeteer.launch({
//       headless: 'new',
//       args: ['--no-sandbox']
//     });
//
//     try {
//       const page = await browser.newPage();
//       await page.setUserAgent(
//         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
//         + 'AppleWebKit/537.36 (KHTML, like Gecko) '
//         + 'Chrome/120.0.0.0 Safari/537.36'
//       );
//
//       await page.goto(
//         `https://www.dia.es/search?q=${encodeURIComponent(producto)}`,
//         { waitUntil: 'networkidle2', timeout: 15000 }
//       );
//
//       const resultados = await page.evaluate(() =>
//         Array.from(document.querySelectorAll('.product-card')).map(card => {
//           const nombre =
//             card.querySelector('.product-card__title')?.innerText?.trim();
//           const precioTexto =
//             card.querySelector('.product-card__price')?.innerText
//               ?.replace(',', '.')
//               ?.replace(/[^0-9.]/g, '');
//           const imagen =
//             card.querySelector('.product-card__image img')?.src;
//           return {
//             nombre,
//             precio: parseFloat(precioTexto),
//             imagen_url: imagen
//           };
//         })
//       );
//
//       return resultados.filter(r => r.nombre && !isNaN(r.precio));
//
//     } catch (error) {
//       console.error('Error Dia:', error.message);
//       return [];
//     } finally {
//       await browser.close();
//     }
//   }
//
// ─────────────────────────────────────────────────────────────
// 9.3  AGREGADOR MULTI-SUPERMERCADO
//
//   Para combinar resultados de todos los supermercados en una
//   sola respuesta:
//
//   async function buscarEnTodos(producto) {
//     const resultados = await Promise.allSettled([
//       buscarMercadona(producto),
//       buscarDia(producto),
//       // … añadir aquí el resto de supermercados
//     ]);
//
//     const productosAgregados = {};
//     // ...
//     return Object.values(productosAgregados);
//   }
//
// ─────────────────────────────────────────────────────────────
// 9.4  NOTAS SOBRE BLOQUEOS Y BUENAS PRÁCTICAS
//
//   - User-Agent:  Usar siempre uno realista que emule un
//                  navegador común (Chrome, Safari, etc.).
//   - Referer:     Algunas APIs verifican que la petición
//                  venga desde su propio dominio.
//   - Rate limit:  Añadir delays entre peticiones (ej: 500ms
//                  con setTimeout o axios-retry).
//   - Proxies:     Rotar IPs si hay bloqueos frecuentes
//                  (usar axios con proxy rotatorio).
//   - Robots.txt:  Respetar las políticas de cada sitio.
//   - Alternativa: Usar APIs de afiliación oficiales o
//                  servicios como Digibox/Comparabien si
//                  ofrecen acceso a datos estructurados.
//   - Cache:       Almacenar resultados en Redis o memoria
//                  durante 1-2 horas para reducir peticiones.
//
//   ⚠️  Este código simulado NO hace peticiones reales.
//       Cuando estés listo para producción, descomenta los
//       bloques de axios/puppeteer y conéctalos al endpoint
//       /api/buscar siguiendo los ejemplos de arriba.
//
// =============================================================
