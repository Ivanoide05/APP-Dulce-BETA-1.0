# heartbeats.md
# Ciclo de Vida del Agente

## Configuración de Persistencia
- **Auto-Sync**: Cada vez que termine una conversación, Julio debe hacer un volcado de lo aprendido al archivo `memory/projects.md` (si existe) o actualizar `user.md`.
- **Estado**: Standby inteligente. Esperando validación de identidad.
