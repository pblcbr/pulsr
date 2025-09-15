# Configuración de Supabase para Pulsr

## Configuración de Autenticación

Para deshabilitar la confirmación de email, necesitas hacer los siguientes cambios en tu dashboard de Supabase:

### 1. Ir a Authentication > Settings

### 2. Deshabilitar "Enable email confirmations"

- Ve a Authentication > Settings
- En la sección "User Signups"
- Desactiva "Enable email confirmations"
- Guarda los cambios

### 3. Configuración de Email (Opcional)

Si quieres personalizar los emails de autenticación:
- Ve a Authentication > Email Templates
- Puedes personalizar los templates o deshabilitarlos completamente

### 4. Configuración de RLS

Asegúrate de que las políticas RLS estén configuradas correctamente:
- Ve a Authentication > Policies
- Verifica que las políticas estén aplicadas a las tablas

## Notas Importantes

- Con la confirmación de email deshabilitada, los usuarios podrán iniciar sesión inmediatamente después del registro
- Esto es perfecto para el MVP ya que reduce la fricción en el onboarding
- Para producción, considera habilitar la confirmación de email por seguridad
