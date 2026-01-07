Conectar Frontend con Backend (MySQL)

Pasos rápidos para poner en marcha y probar la conexión entre el frontend y la base de datos local:

1) Preparar la base de datos
   - Importa `backend/hospitaldb.sql` en tu MySQL:
     mysql -u root -p < backend/hospitaldb.sql
   - Crea un archivo `.env` en `backend/` con las variables:
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=tu_password
     DB_NAME=hospitaldb
     DB_PORT=3306

2) Instalar dependencias y ejecutar seeding
   - Desde `backend/`:
     npm install
     npm run test-db   # verifica conexión
     node src/scripts/seed.js   # inserta datos básicos (Tipo_Documento, Especialidad, Ubigeo)

3) Ejecutar el servidor backend
   - Desde `backend/`:
     npm run dev
   - El API escuchará en `http://localhost:3000` por defecto.

4) Configurar frontend para usar la API
   - El frontend ahora detecta el backend automáticamente: al abrir `index.html` intentará conectar con `http://localhost:3000/api/status`.
   - Si el backend está disponible, el frontend desactivará el `MODO_SIMULACION` y, si es necesario, ejecutará el seed en el backend para crear datos demo (solo en modo desarrollo).
   - Asegúrate que `API_URL` apunte a la URL correcta (por defecto `http://localhost:3000/api`).

5) Probar flujo principal
   - Registro público -> crea Persona y Paciente (POST /api/personas -> POST /api/pacientes)
   - Login con DNI -> busca Persona y Paciente (GET /api/personas/search?q=) y (GET /api/pacientes/persona/:id)
   - Reservar cita -> POST /api/citas (paciente_id, medico_id, especialidad_id, fecha, hora)
   - Ver historial -> GET /api/pacientes/:id/historial

Notas y siguientes pasos
 - Actualmente la autenticación es mínima (no hay hashing/gestion de credenciales). Para producción: implementar Auth (JWT), almacenar credenciales con seguridad y proteger endpoints.
 - Si quieres, continúo con: 1) login seguro (auth), 2) crear usuarios tipo "medico" y "trabajador" via UI, 3) tests automáticos y validación de formularios.
