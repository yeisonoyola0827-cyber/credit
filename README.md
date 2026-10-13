# Escuela A.L.O. Arcade · Plataforma Web (PHP MVC + SPA)

Plataforma interactiva de formación, onboarding, evaluación y analítica para **Aló Credit**, desarrollada con arquitectura **MVC en PHP para el backend y Single Page Application (SPA) en el frontend**.

---

## 🚀 Cómo Ejecutar y Publicar la Aplicación

El proyecto cuenta con una **Arquitectura Híbrida / Dual Engine**:
- **En la nube (GitHub Pages, Netlify, Vercel o Navegador directo)**: Funciona 100% estático e interactivo con base de datos simulada en `localStorage`.
- **En servidor local o producción (PHP 8+, Apache, XAMPP, cPanel)**: Funciona con backend MVC completo en PHP y base de datos persistente SQLite / MySQL.

---

### Opción 1: 🌐 Publicación Gratis en GitHub Pages (En 1 Clic)
1. Sube los archivos del proyecto a tu repositorio de GitHub (arrastra todos los archivos y carpetas, o descomprime `escuela_alo_completo.zip`).
2. En tu repositorio de GitHub, ve a **Settings** (Configuración) > pestaña **Pages** (en el menú lateral izquierdo).
3. En **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: selecciona `main` (o `master`) y la carpeta `/ (root)`
   - Haz clic en **Save**.
4. ¡Listo! En 1-2 minutos GitHub te dará el link público:
   👉 `https://tu-usuario.github.io/tu-repositorio/`
   *(Funcionará todo: los 4 usuarios, misiones, evaluaciones, certificados y el panel administrador con persistencia local).*

---

### Opción 2: 💻 Con el archivo ejecutable local en Windows (Recomendada con PHP)
Simplemente haz doble clic sobre el archivo:
```
iniciar_servidor.bat
```
Y abre en tu navegador web:
👉 **`http://localhost:8000`**

---

### Opción 3: 🐧 Desde la terminal con PHP CLI
Ejecuta en la raíz del proyecto:
```bash
php -S localhost:8000 -t public
```

---

## 👥 4 Usuarios de Prueba Predefinidos

La pantalla de inicio de sesión incluye botones de **Acceso Rápido con 1 Clic** para alternar instantáneamente entre los 4 perfiles y probar todas las vistas:

| Rol / Segmento | Nombre | Correo | Contraseña | Comportamiento |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | Administrador A.L.O. | `admin@alocredit.com` | `admin123` | Acceso completo al **ALO Control Center** (Dashboard, métricas, gestión de cursos y usuarios). |
| **Canal 1 (Comercial)** | María Comercial | `maria@alocredit.com` | `alo2026` | Vista personalizada para **Comercial Presencial** (Onboarding y cursos de tienda). |
| **Canal 2 (Contact Center)**| Carlos Contact | `carlos@alocredit.com` | `alo2026` | Vista personalizada para **Contact Center** (Onboarding telefónico y tipificación). |
| **Canal 3 (Administrativos)**| Sofía Admin | `sofia@alocredit.com` | `alo2026` | **Flujo de Primer Ingreso**: Al entrar, la plataforma exige obligatoriamente cambiar la contraseña temporal. |

---

## 🏗️ Arquitectura del Sistema (MVC + SPA)

```
jonathan/
├── public/                       # Raíz pública del servidor web
│   ├── index.php                 # Front Controller y Router de API REST / Layout
│   └── assets/                   # Recursos estáticos desacoplados
│       ├── css/
│       │   ├── app.css           # Estilos principales de la interfaz arcade
│       │   ├── auth.css          # Estilos de login y pantalla de cambio de contraseña
│       │   └── certificate.css   # Estilos de diploma e impresión (@media print)
│       └── js/
│           ├── api.js            # Cliente fetch centralizado para endpoints PHP
│           ├── sound.js          # Efectos de audio retro sintetizados (Web Audio API)
│           ├── auth.js           # Manejador de sesiones, login y cambio de clave
│           ├── spa.js            # Enrutador SPA y vistas del estudiante
│           ├── course-player.js  # Reproductor en 5 etapas (Descubre->Aprende->Practica->Demuestra->Desbloquea) y Quizzes
│           └── admin.js          # Panel administrativo (KPIs, cursos, usuarios)
├── app/                          # Lógica MVC del Backend PHP
│   ├── Config/
│   │   └── Database.php          # Conexión PDO SQLite y migraciones automáticas
│   ├── Controllers/
│   │   ├── AuthController.php    # Login, Logout, Cambio de Clave y Sesión
│   │   ├── CourseController.php  # Cursos, progreso, módulos y evaluación
│   │   ├── UserController.php    # CRUD de usuarios (Crear, Editar, Eliminar, Bloquear)
│   │   ├── AdminController.php   # Dashboard, analítica por canal y asignación
│   │   └── CertificateController.php # Generación y validación de diplomas con folio
│   ├── Models/
│   │   ├── User.php
│   │   ├── Course.php
│   │   ├── Channel.php
│   │   ├── Attempt.php
│   │   └── Certificate.php
│   └── Views/
│       └── layout.php            # Shell HTML5 de la Single Page Application
├── data/
│   └── escuela_alo.sqlite        # Base de datos SQLite inicializada con datos semilla
├── database.sql                  # Script SQL completo de estructura y datos iniciales
├── iniciar_servidor.bat          # Acceso directo para levantar el servidor en Windows
└── Escuela_ALO_Interactiva.html  # Archivo monolítico original conservado como respaldo
```

---

## 🌟 Características Principales

1. **Segmentación Estricta en 3 Canales**:
   - Cada colaborador solo visualiza y cursa las rutas de su canal asignado (`cp`, `cc` o `adm`), más los cursos transversales de la organización (`all`).
2. **Dashboard de Administrador**:
   - **Métricas Ejecutivas**: Gráficos de avance y notas promedio desglosadas por canal.
   - **Publicación Flexible**: Opciones para publicar un curso para **todos los canales** o de forma **independiente para un solo canal**.
   - **Gestión Integral de Usuarios**: Crear nuevos colaboradores, editar información, **bloquear/desbloquear accesos** y eliminar perfiles.
3. **Flujo de Primer Ingreso (`must_change_password`)**:
   - Bloqueo de navegación hasta que el nuevo colaborador establezca su contraseña definitiva.
4. **Evaluaciones Seguras en el Servidor**:
   - Verificación de respuestas y controles críticos en el backend PHP.
5. **Generador de Certificados con Folio Único**:
   - Generación de código único criptográfico (`ALO-2026-CANAL-XXXXXX`) con diseño diploma apaisado listo para imprimir (`Ctrl + P`).
6. **Efectos de Sonido Arcade**:
   - Sonidos 8-bit sintetizados en tiempo real con Web Audio API (ganancia de XP, respuestas correctas, errores y clics).
