# GymTurnos - Mockup SPA

Mockup funcional de la aplicación de reservas del gimnasio (HTML + CSS + JS puro).

## Cómo verlo

1. Subí esta carpeta a un repositorio de GitHub.
2. Activá **GitHub Pages** (Settings → Pages → Source: main branch / root).
3. Abrí la URL que te da GitHub.

O localmente: abrí `index.html` en el navegador (o usá un server simple).

## Cuentas de prueba

| Rol     | Email            | Contraseña |
|---------|------------------|------------|
| Cliente | juan@mail.com    | 123456     |
| Cliente | maria@mail.com   | 123456     |
| Cliente | carlos@mail.com  | 123456     |
| Cliente | ana@mail.com     | 123456     |
| Admin   | admin@gym.com    | admin123   |

## Qué incluye

**Cliente**
- Login / Registro / Recuperar contraseña
- Dashboard con plan, cupos y vencimiento
- Distribuir cupos (selección de turnos de la semana)
- Ver y cancelar reservas propias

**Admin**
- Vista semanal de ocupación
- Detalle de día + eliminar personas / vaciar día
- Buscar usuario por email
- Asignar/cambiar plan + sumar/restar cupos

Todo con datos falsos en memoria (se resetea al recargar la página).
