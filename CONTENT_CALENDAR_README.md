# Calendario de Contenido Personalizado

## 🎯 Descripción

Sistema de calendario de contenido que genera posts personalizados para Twitter basados en el perfil de personalidad del usuario obtenido del onboarding.

## 🏗️ Arquitectura

### Estructura de Archivos

```
src/
├── data/
│   └── mockProfile.js              # Mock data del perfil y contenido
├── services/
│   ├── personalityAnalyzer.js      # Análisis de personalidad
│   ├── openai.js                   # Servicio de OpenAI
│   └── contentGenerator.js         # Generador de contenido
├── components/
│   └── calendar/
│       ├── CalendarGrid.jsx        # Grid del calendario
│       └── ContentCard.jsx         # Tarjeta de contenido
└── pages/
    └── ContentCalendar.jsx         # Página principal
```

### Flujo de Datos

1. **Perfil de Usuario** → Análisis de personalidad
2. **Personalidad** → Generación de pilares de contenido
3. **Pilares + Personalidad** → Generación de contenido con OpenAI
4. **Contenido** → Visualización en calendario

## 🧠 Sistema de Personalidad

### Dimensiones Analizadas

- **Analítico**: Datos, investigación, métricas
- **Emprendedor**: Startups, negocios, crecimiento
- **Creativo**: Diseño, arte, innovación
- **Práctico**: Tutoriales, herramientas, soluciones
- **Social**: Comunidad, networking, colaboración
- **Organizado**: Sistemas, productividad, planificación

### Generación de Pilares

Cada tipo de personalidad genera 4 pilares de contenido específicos:

```javascript
// Ejemplo para personalidad "analítica"
const pillars = [
  { name: 'Análisis de Datos', color: '#3B82F6' },
  { name: 'Tecnología', color: '#8B5CF6' },
  { name: 'Productividad', color: '#F59E0B' },
  { name: 'Investigación', color: '#EF4444' }
];
```

## 🤖 Integración con OpenAI

### Configuración

```javascript
// Variables de entorno necesarias
REACT_APP_OPENAI_API_KEY=tu_api_key_aqui
```

### Generación de Contenido

```javascript
const result = await generatePersonalizedContent(profile, pillars, {
  days: 30,
  useAI: true,
  includeWeekends: true,
  postingFrequency: 'auto'
});
```

### Fallback

Si falla la API de OpenAI, el sistema usa plantillas predefinidas basadas en la personalidad.

## 📅 Componentes del Calendario

### CalendarGrid

- Vista mensual y semanal
- Navegación entre meses
- Indicadores visuales de contenido
- Drag & drop (futuro)

### ContentCard

- Vista compacta y detallada
- Estados de contenido (draft, scheduled, published)
- Edición inline
- Gestión de estados

## 🎨 Características Visuales

### Colores por Pilar

Cada pilar tiene un color único para identificación visual:

```javascript
const pillarColors = {
  'Análisis de Datos': '#3B82F6',  // Azul
  'Emprendimiento': '#10B981',      // Verde
  'Productividad': '#F59E0B',       // Amarillo
  'Tecnología': '#8B5CF6'           // Púrpura
};
```

### Estados de Contenido

- **Draft**: Gris - Contenido en borrador
- **Scheduled**: Azul - Programado para publicación
- **Published**: Verde - Ya publicado
- **Cancelled**: Rojo - Cancelado

## 📊 Estadísticas

El sistema proporciona estadísticas en tiempo real:

- Total de posts
- Posts programados
- Posts publicados
- Posts en borrador
- Distribución por pilares
- Promedio de posts por día

## 🔧 Uso

### Navegación

1. Accede a `/content-calendar` desde el sidebar
2. Ve el calendario con contenido generado
3. Haz clic en una fecha para ver el contenido del día
4. Haz clic en un post para ver detalles completos

### Generación de Contenido

1. Haz clic en "Generar Contenido"
2. El sistema analiza tu personalidad
3. Genera 30 días de contenido personalizado
4. Asigna fechas y horarios óptimos

### Edición

1. Haz clic en "Editar" en cualquier post
2. Modifica el contenido
3. Cambia el estado (draft, scheduled, etc.)
4. Guarda los cambios

## 🚀 Próximas Funcionalidades

- [ ] Integración real con base de datos
- [ ] Publicación automática a Twitter
- [ ] Métricas de engagement
- [ ] Plantillas personalizables
- [ ] Programación de horarios óptimos
- [ ] Exportación de contenido
- [ ] Colaboración en equipo

## 🛠️ Desarrollo

### Instalación de Dependencias

```bash
npm install date-fns
```

### Variables de Entorno

```bash
# .env.local
REACT_APP_OPENAI_API_KEY=tu_api_key_aqui
```

### Estructura de Base de Datos

```sql
-- Tabla de pilares de contenido
CREATE TABLE content_pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text,
  created_at timestamp DEFAULT now()
);

-- La tabla 'contents' ya existe y se usa para el calendario
```

## 📝 Notas Técnicas

- El sistema usa `date-fns` para manejo de fechas
- Los componentes son completamente responsivos
- El estado se maneja con React hooks
- La generación de contenido es asíncrona
- Hay fallbacks para cuando falla la API de OpenAI

## 🎯 Personalización

El sistema se adapta automáticamente a:

- Tipo de personalidad del usuario
- Preferencias de horarios
- Frecuencia de posting
- Tono de contenido
- Temas de interés
- Audiencia objetivo
