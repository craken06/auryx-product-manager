# Compragamer Admin — Carga de Productos

Mini aplicación web local para cargar, editar y borrar productos (paneles solares, inversores, baterías, etc.) directamente en una base de datos PostgreSQL, siguiendo el schema de specs técnicas definido por categoría.

No es una app en la nube: corre en tu propia PC (o la de quien la use) y se conecta a **tu** Postgres local. Cada persona que la use necesita su propia base de datos Postgres corriendo (o acceso remoto a una compartida — ver sección [Compartir la base de datos](#compartir-la-base-de-datos-con-amigos)).

---

## Requisitos previos

- **Node.js** (versión 18 o superior) → https://nodejs.org (descargar la versión **LTS**)
- **PostgreSQL** instalado y corriendo, con la base de datos y las tablas ya creadas (`categories`, `products`, `product_images`) según el schema del proyecto
- Windows, Mac o Linux — funciona igual en los tres

---

## Instalación

1. **Clonar o descargar este repositorio**
   ```bash
   git clone <url-del-repo>
   cd compragamer-admin
   ```
   (o descargar el ZIP desde GitHub y descomprimirlo)

2. **Instalar las dependencias**
   ```bash
   npm install
   ```

3. **Configurar la conexión a tu base de datos**

   Copiá el archivo `.env.example` y renombralo a `.env`:
   ```bash
   cp .env.example .env
   ```
   En Windows, si `cp` no funciona en tu terminal, simplemente duplicá el archivo desde el explorador y renombralo.

   Editá `.env` con los datos reales de tu Postgres:
   ```env
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=nombre_de_tu_base
   PGUSER=postgres
   PGPASSWORD=tu_password
   PORT=3000
   ```

   > ⚠️ El archivo `.env` **no se sube a GitHub** (está en `.gitignore`). Cada persona que use el proyecto debe crear el suyo con sus propios datos de conexión.

4. **Levantar el servidor**
   ```bash
   npm start
   ```
   Si todo salió bien, vas a ver:
   ```
   ✅ Conectado a Postgres correctamente
   🚀 Servidor corriendo en http://localhost:3000
   ```

5. **Abrir la app**

   Andá a **http://localhost:3000** en el navegador.

---

## Funcionalidades

- **Cargar producto**: elegís categoría, completás marca/nombre/precio/etc., y con el botón **"Cargar plantilla según categoría"** se autocompleta el JSON de specs técnicas con los campos correctos para esa categoría (panel, inversor, batería...), solo hay que llenar los valores.
- **Ver productos cargados**: tabla con todos los productos ya guardados en la base.
- **Editar**: botón ✏️ en cada fila carga ese producto en el formulario de arriba (specs incluidas) para modificarlo y actualizarlo.
- **Borrar uno**: botón 🗑️ por fila, con confirmación.
- **Borrar todos**: botón que elimina todos los productos de la tabla `products`, con doble confirmación (acción irreversible).
- **Ver categorías**: tabla de referencia que muestra qué categorías existen y qué campos técnicos espera el schema de cada una.

---

## Estructura del proyecto

```
compragamer-admin/
├── server.js           → backend Express, conecta con Postgres, expone la API
├── package.json        → dependencias del proyecto
├── .env.example         → plantilla de configuración (copiar como .env)
├── public/
│   └── index.html      → frontend: formulario + tablas (todo en un solo archivo)
└── README.md            → este archivo
```

---

## Compartir la base de datos con amigos

Esta app se conecta a **una sola base de datos por vez** (la que pongas en tu `.env`). Hay dos formas de que varias personas trabajen sobre los mismos datos:

### Opción A — Cada uno con su propia base (más simple)
Cada amigo clona el repo, instala Postgres en su PC, crea su propia base con el mismo schema, y carga sus propios datos de prueba. No comparten información entre sí, pero no requiere configurar nada de redes.

### Opción B — Todos apuntando a la misma base (compartida)
Uno de ustedes aloja la base de datos (por ejemplo con **Tailscale** o **Hamachi** para exponerla de forma segura dentro de una red virtual, sin abrir puertos a todo internet), y el resto pone la IP de esa persona como `PGHOST` en su `.env`, en vez de `localhost`. Así todos ven y modifican los mismos productos desde la misma app corriendo en sus propias PCs.

> Para producción real (que la base esté siempre disponible, sin depender de que una PC esté prendida), lo recomendable a futuro es migrar a un servicio como **Supabase**, **Neon** o **Railway**, que dan una base Postgres en la nube con URL de conexión pública y SSL. Ahí simplemente se cambia el `.env` y no hace falta ninguna configuración de red.

---

## Notas de seguridad

- El archivo `.env` contiene la contraseña de tu base de datos — **nunca lo subas a GitHub**. Ya está excluido en `.gitignore`, pero revisá antes de hacer `git push` si trabajás sobre una copia.
- El botón "Borrar todos" es irreversible — no hay backup automático. Si vas a probarlo, hacé antes un respaldo con `pg_dump` si los datos importan.
- Esta app está pensada para uso local/interno de desarrollo, no tiene sistema de login ni permisos — cualquiera que acceda a la URL puede cargar, editar o borrar productos.

---

## Problemas comunes

| Problema | Causa probable |
|---|---|
| `❌ No se pudo conectar a Postgres` al arrancar | Revisá `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` en tu `.env` |
| La página carga pero el `<select>` de categorías está vacío | Las tablas no están creadas o la tabla `categories` no tiene registros |
| Error al guardar: "specs no es un JSON válido" | El textarea de specs tiene una coma de más o le falta cerrar una llave — se puede validar el JSON en cualquier validador online antes de pegarlo |
| `npm install` falla | Verificá que Node.js esté instalado (`node -v` en la terminal) |
