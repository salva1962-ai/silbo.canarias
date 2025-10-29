# Silbö Canarias · Herramienta Comercial

Aplicación React 19 + Vite para la gestión comercial de Silbö Canarias: pipeline de distribuidores, candidatos, visitas y reporting con soporte de modo oscuro.

## ⚙️ Requisitos

- Node.js >= 20
- npm >= 10

### Tooling de calidad

- TypeScript (modo estricto con migración gradual desde JS)
- ESLint + Prettier
- Husky + lint-staged
- Vitest para unit tests
- Playwright para E2E

### Variables de entorno

Replica `.env.example` como `.env` y completa las claves de Supabase si corresponde:

```bash
cp .env.example .env
# Editar el archivo resultante y rellenar las variables
```

## 🚀 Arranque rápido

```bash
npm install
npm run dev
```

Formato y análisis estático:

```bash
npm run lint
```

Formateo automático:

```bash
npm run format:write
```

Tests unitarios:

```bash
npm run test
```

Cobertura:

```bash
npm run test:coverage
```

Pruebas end-to-end (requiere navegadores instalados)

```bash
npx playwright install --with-deps
npm run test:e2e
```

Build de producción:

```bash
npm run build
```

## 🧭 Rutas clave

- `/dashboard`
- `/kanban`
- `/distributors` y `/distributors/:id`
- `/candidates` y `/candidates/:id`
- `/reports/weekly`

## 📚 Documentación

- [Especificación funcional v1](./docs/especificacion-v1.md): reglas de negocio, métricas, roadmap PWA y backlog sugerido.
- [Estilos CSS Inline](./docs/CSS_INLINE_STYLES.md): justificación técnica de los estilos inline en componentes de visualización de datos.

## 🛠️ Stack

- React 19 + Vite
- Tailwind CSS + utilidades personalizadas
- Context API con persistencia en `localStorage`
- TypeScript incremental (allowJs) y validación con Zod
- Heroicons y componentes UI propios

## � CI/CD

El workflow `.github/workflows/ci.yml` ejecuta lint, tests unitarios, build y pruebas E2E en cada push o pull request contra `main`.

## �🗺️ Próximos pasos

1. Validar mapa de campos con el Excel real.
2. Diseñar wireframes del dashboard, kanban y ficha.
3. MVP con almacenamiento local + exportación PDF.
4. Conectar Supabase (Auth + RLS) y preparar PWA.
