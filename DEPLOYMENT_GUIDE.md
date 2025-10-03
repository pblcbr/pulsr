# 🚀 Guía de Despliegue - Pulsr Backend en Producción

## 📋 Resumen
Esta guía te ayudará a desplegar el backend de Pulsr en producción usando **Railway** o **Render**.

---

## 🎯 Opción 1: Railway (Recomendado)

### Paso 1: Crear cuenta en Railway
1. Ve a [railway.app](https://railway.app)
2. Regístrate con tu cuenta de GitHub
3. Conecta tu repositorio de GitHub

### Paso 2: Crear nuevo proyecto
1. Click en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona tu repositorio `pulsr`
4. Railway detectará automáticamente el backend

### Paso 3: Configurar Root Directory
1. En el proyecto, ve a **Settings**
2. Busca **"Root Directory"**
3. Configura: `backend`
4. En **"Start Command"** pon: `npm start`

### Paso 4: Configurar Variables de Entorno
En la sección **Variables**, añade las siguientes:

```
PORT=3000
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_de_stripe
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_de_stripe
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase
OPENAI_API_KEY=sk-proj-tu_clave_de_openai
FRONTEND_URL=https://tu-app.netlify.app
```

### Paso 5: Desplegar
1. Railway desplegará automáticamente
2. Obtendrás una URL como: `https://pulsr-backend-production.up.railway.app`
3. Guarda esta URL

---

## 🎯 Opción 2: Render

### Paso 1: Crear cuenta en Render
1. Ve a [render.com](https://render.com)
2. Regístrate con tu cuenta de GitHub

### Paso 2: Crear Web Service
1. Click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Selecciona tu repositorio `pulsr`

### Paso 3: Configurar el servicio
- **Name**: `pulsr-backend`
- **Region**: Elige el más cercano a ti
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free`

### Paso 4: Variables de Entorno
Añade las mismas variables que en Railway (ver arriba)

### Paso 5: Deploy
1. Click en **"Create Web Service"**
2. Render desplegará automáticamente
3. Obtendrás una URL como: `https://pulsr-backend.onrender.com`

---

## 🔧 Configuración Post-Despliegue

### 1. Configurar Stripe Webhook (Producción)

**En Stripe Dashboard:**
1. Ve a [Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click en **"Add endpoint"**
3. URL del endpoint:
   - Railway: `https://tu-url.up.railway.app/api/webhook`
   - Render: `https://tu-url.onrender.com/api/webhook`
4. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copia el **Signing secret** (empieza con `whsec_...`)
6. Añade este secret como variable `STRIPE_WEBHOOK_SECRET` en tu servicio

### 2. Actualizar Frontend (Netlify)

**En tu proyecto local:**

Actualiza el archivo `.env` en la raíz:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
VITE_OPENAI_API_KEY=sk-proj-tu_clave_de_openai
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publicable_de_stripe
VITE_BACKEND_URL=https://tu-backend-url-aqui.up.railway.app
```

**En Netlify Dashboard:**
1. Ve a tu sitio → **Site configuration** → **Environment variables**
2. Añade todas las variables anteriores
3. Click en **"Deploy site"** para redesplegar

### 3. Actualizar CORS en Backend (si es necesario)

El backend ya está configurado para aceptar tu URL de Netlify automáticamente, pero verifica que la línea 31 del `server.js` incluya tu dominio de Netlify.

### 4. Probar el Backend

Verifica que el backend esté funcionando:

```bash
curl https://tu-backend-url.up.railway.app/api/health
```

Deberías recibir:
```json
{
  "status": "OK",
  "message": "Backend is running",
  "aiEnabled": true
}
```

---

## ✅ Checklist Final

- [ ] Backend desplegado en Railway/Render
- [ ] Variables de entorno configuradas
- [ ] Webhook de Stripe configurado para producción
- [ ] `STRIPE_WEBHOOK_SECRET` actualizado en el servicio
- [ ] Frontend actualizado con `VITE_BACKEND_URL` en Netlify
- [ ] Variables de entorno añadidas en Netlify
- [ ] Site redespliegado en Netlify
- [ ] Endpoint `/api/health` responde correctamente
- [ ] Prueba de pago realizada

---

## 🐛 Troubleshooting

### Error: "Origin not allowed by CORS"
**Solución**: Añade tu URL de Netlify a `FRONTEND_URL` en las variables de entorno del backend.

### Error: "Stripe webhook verification failed"
**Solución**: Asegúrate de que `STRIPE_WEBHOOK_SECRET` en producción sea el correcto (diferente al de desarrollo).

### Error: "Module not found"
**Solución**: Verifica que el `Root Directory` esté configurado como `backend`.

### Backend se reinicia constantemente
**Solución**: Revisa los logs para ver errores. Normalmente es porque falta alguna variable de entorno.

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Railway/Render
2. Verifica que todas las variables de entorno estén configuradas
3. Prueba el endpoint `/api/health` para ver si responde

---

## 🎉 ¡Listo!

Tu aplicación ahora está completamente en producción:
- ✅ Frontend en Netlify
- ✅ Backend en Railway/Render
- ✅ Base de datos en Supabase
- ✅ Pagos con Stripe
- ✅ IA con OpenAI


