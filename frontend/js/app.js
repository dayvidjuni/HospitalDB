// js/app.js

// ==========================================
// --- CONFIGURACIÓN DEL SISTEMA ---
// ==========================================
const API_URL = 'http://localhost:3000/api';
const MODO_SIMULACION = true; 

// --- ESTADO GLOBAL ---
let currentUser = null;
let isAdminLogin = false; // Estado del login (Admin vs General)
let usuarioEditandoID = null; // Para saber si estamos creando o editando
// --- BASE DE DATOS LOCAL (SIMULADA) ---
// ESTA FALTABA: Sin esto, la tabla y el guardado fallan
let BD_REGISTROS = [
    { id: 1, rol: 'medico', nombre: 'Gregory', apellido: 'House', universidad: 'Princeton', especialidad: 'Diagnóstico', hora_inicio: '08:00', hora_fin: '16:00' },
    { id: 2, rol: 'paciente', nombre: 'Carlos', apellido: 'Mamani', ubigeo: '211101', dni: '70251984', telefono: '951234567' },
    { id: 3, rol: 'trabajador', nombre: 'Juan', apellido: 'Perez', hora_inicio: '07:00', hora_fin: '19:00' }
];

const BD_CITAS = [
    { id: 1, hora: '09:00', paciente: 'Carlos Mamani', motivo: 'Dolor abdominal fuerte', estado: 'pendiente' },
    { id: 2, hora: '09:30', paciente: 'Maria Lopez', motivo: 'Control Cardiología', estado: 'pendiente' },
    { id: 3, hora: '10:00', paciente: 'Juan Quispe', motivo: 'Fiebre alta', estado: 'atendido' }
];

const BD_TAREAS = [
    { id: 1, tarea: 'Limpieza de Área de Espera', estado: 'completado' },
    { id: 2, tarea: 'Verificar stock de almacén', estado: 'pendiente' },
    { id: 3, tarea: 'Reporte de incidencias en puerta principal', estado: 'pendiente' }
];

// Usuarios para Login
const MOCK_USERS = {
    'admin':    { pass: '123', role: 'admin',    name: 'Administrador', profileComplete: true },
    'medico':   { pass: '123', role: 'medico',   name: 'Dr. House',     profileComplete: true },
    'paciente': { pass: '123', role: 'paciente', name: 'Carlos M.',     profileComplete: true },
    'trabajador': { pass: '123', role: 'trabajador', name: 'Pepe (Seguridad)', profileComplete: true }
};

// --- INICIALIZACIÓN ---
if(MODO_SIMULACION) {
    const devIndicator = document.getElementById('dev-mode-indicator');
    if(devIndicator) devIndicator.classList.remove('hidden');
    console.warn("⚠️ SISTEMA CORRIENDO EN MODO SIMULACIÓN");
}

function showToast(message, title = '', type = 'info', delay = 4000) {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toastId = `toast-${Date.now()}`;
    container.insertAdjacentHTML('beforeend', `
        <div id="${toastId}" class="toast toast-custom align-items-center" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="${delay}">
          <div class="d-flex">
            <div class="toast-body">
              ${title ? '<strong>' + title + '</strong> ' : ''}${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
          </div>
        </div>
    `);
    const el = document.getElementById(toastId);
    const btoast = new bootstrap.Toast(el);
    btoast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}

function toggleSidebarMobile() {
    const s = document.getElementById('sidebar');
    s.classList.toggle('show');
}

// ==========================================
// --- FUNCIÓN HELPER: SMART FETCH ---
// ==========================================
async function smartFetch(url, options = {}) {
    if (!MODO_SIMULACION) {
        return fetch(url, options);
    } else {
        return new Promise((resolve) => {
            console.log(`[SIMULACIÓN API] ${options.method || 'GET'} -> ${url}`, options.body || '');
            setTimeout(() => {
                resolve({
                    ok: true,
                    json: async () => ({ status: 'ok', id_generado: Math.floor(Math.random() * 1000) })
                });
            }, 800);
        });
    }
}

// ==========================================
// --- SISTEMA DE LOGIN Y NAVEGACIÓN ---
// ==========================================
function mostrarRegistro() {
    // Ocultar Login y Mostrar Registro
    document.getElementById('login-screen').classList.add('d-none');
    document.getElementById('register-screen').classList.remove('d-none');
    // Limpiar el formulario por si acaso
    document.getElementById('formRegistroPublico').reset();
}

function mostrarLogin() {
    // Ocultar Registro y volver al Login
    document.getElementById('register-screen').classList.add('d-none');
    document.getElementById('login-screen').classList.remove('d-none');
}
function toggleAdminMode() {
    isAdminLogin = !isAdminLogin;
    
    const title = document.getElementById('login-title-mode');
    const rolDiv = document.getElementById('div-login-rol');
    const regDiv = document.getElementById('div-register-link');
    const card = document.querySelector('.login-card');

    if (isAdminLogin) {
        title.innerText = "Acceso Administrativo (Interno)";
        title.classList.replace('text-secondary', 'text-danger');
        rolDiv.classList.add('d-none');
        regDiv.classList.add('d-none');
        card.style.borderColor = "#dc3545";
    } else {
        title.innerText = "Acceso General";
        title.classList.replace('text-danger', 'text-secondary');
        rolDiv.classList.remove('d-none');
        regDiv.classList.remove('d-none');
        card.style.borderColor = "#ddd";
    }
}

document.getElementById('formLogin').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('login_user').value.toLowerCase().trim();
    const p = document.getElementById('login_pass').value;

    const rolEsperado = isAdminLogin ? 'admin' : document.getElementById('login_rol_selector').value;

    if (MOCK_USERS[u] && MOCK_USERS[u].pass === p) {
        // Validación de Rol
        if (MOCK_USERS[u].role !== rolEsperado) {
            showToast(`Este usuario no es ${rolEsperado.toUpperCase()}.`, "Error", "danger");
            return;
        }

        currentUser = MOCK_USERS[u];
        iniciarSistema();
    } else {
        showToast("Usuario o contraseña incorrectos","Error","danger");
    }
});

function iniciarSistema() {
    document.getElementById('login-screen').classList.add('d-none');
    document.getElementById('app-layout').classList.remove('d-none');
    
    let color = 'bg-primary';
    if(currentUser.role === 'medico') color = 'bg-success';
    if(currentUser.role === 'trabajador') color = 'bg-warning text-dark';
    if(currentUser.role === 'admin') color = 'bg-danger';
    
    document.getElementById('user-display-name').innerHTML = `
        <span class="badge ${color} me-2">${currentUser.role.toUpperCase()}</span> ${currentUser.name}
    `;

    renderSidebar();

    if(currentUser.role === 'admin') {
        showView('personas');
        filtrarTabla('todos');
        showView('dashboard');
        renderTablaPersonas()
        
        setTimeout(() => {
            inicializarGraficos(); 
        }, 100);
    } else if (currentUser.role === 'paciente') {
        showView('portal-paciente');
        configurarPortalPaciente();
        document.getElementById('portal-paciente-nombre').innerText = currentUser.name;
        cargarHistorialPaciente(); 
        // --------------------

        // Verificar perfil...
        const alerta = document.getElementById('alerta-perfil-incompleto');
    } else if (currentUser.role === 'medico') {
        showView('medico-dashboard');
        renderVistaMedico();
    } else if (currentUser.role === 'trabajador') {
        showView('trabajador-dashboard');
        renderVistaTrabajador();
    }
}
// --- LÓGICA DEL NUEVO REGISTRO PÚBLICO (Agregar esto) ---

document.getElementById('formRegistroPublico').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Obtener datos del formulario nuevo
    const dni = document.getElementById('reg_dni').value;
    const pass = document.getElementById('reg_password').value;
    const nombre = document.getElementById('reg_nombre').value;
    const apellido = document.getElementById('reg_apellido').value;
    const ubigeo = document.getElementById('reg_ubigeo').value;
    const telefono = document.getElementById('reg_telefono').value;

    // 2. Efecto visual de carga
    const btn = e.target.querySelector('button[type="submit"]');
    const textoOriginal = btn.innerText;
    btn.innerText = "Registrando...";
    btn.disabled = true;

    // 3. Crear el objeto Usuario y Guardarlo en las listas simuladas
    const nuevoUsuario = {
        id: Date.now(),
        rol: 'paciente', // Forzamos el rol
        dni, nombre, apellido, ubigeo, telefono
    };

    // Agregar a la "Base de datos" de la tabla
    BD_REGISTROS.push(nuevoUsuario);

    // Agregar al "Sistema de Login" (Para que puedas entrar)
    MOCK_USERS[dni] = {
        pass: pass,
        role: 'paciente',
        name: `${nombre} ${apellido}`,
        profileComplete: true
    };

    // Simular pequeña espera
    await new Promise(r => setTimeout(r, 1000));

    // 4. Finalizar
    showToast("Cuenta creada. Ahora inicie sesión con su DNI.","Éxito","success");
    mostrarLogin(); // Volver al login automáticamente
    
    // Rellenar el login para facilitar el acceso
    document.getElementById('login_rol_selector').value = 'paciente';
    document.getElementById('login_user').value = dni;
    document.getElementById('login_pass').value = '';
    
    btn.innerText = textoOriginal;
    btn.disabled = false;
});
function logout() {
    currentUser = null;
    window.location.reload();
}

function renderSidebar() {
    const ul = document.getElementById('menu-items');
    ul.innerHTML = '';
    
    let items = [];
    if(currentUser.role === 'admin') {
        items = [
            { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
            { id: 'personas', label: 'Gestión Usuarios', icon: 'fa-users-gear' }
        ];
    } else if(currentUser.role === 'paciente') {
        items = [{ id: 'portal-paciente', label: 'Mi Salud', icon: 'fa-heart-pulse' }];
    } else if(currentUser.role === 'medico') {
        items = [
            { id: 'medico-dashboard', label: 'Consultorio', icon: 'fa-user-doctor' },
            { id: 'medico-pacientes', label: 'Historias Clínicas', icon: 'fa-file-medical' } 
        ];
    } else if(currentUser.role === 'trabajador') {
        items = [
            { id: 'trabajador-dashboard', label: 'Mis Tareas', icon: 'fa-list-check' }
        ];
    }

    items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="#" class="d-block p-3 text-decoration-none text-dark border-bottom" onclick="showView('${item.id}', this)">
                <i class="fa-solid ${item.icon} me-2"></i> ${item.label}
            </a>`;
        ul.appendChild(li);
    });
}

function showView(viewId, linkElement = null) {
    document.querySelectorAll('.section-view').forEach(el => el.classList.remove('active-view'));
    const target = document.getElementById(`view-${viewId}`);
    if(target) target.classList.add('active-view');
}

// ==========================================
// --- PORTAL PACIENTE ---
// ==========================================
function configurarPortalPaciente() {
    document.getElementById('portal-paciente-nombre').innerText = currentUser.name;
    const alerta = document.getElementById('alerta-perfil-incompleto');
    if (!currentUser.profileComplete) {
        alerta.classList.remove('d-none');
    } else {
        alerta.classList.add('d-none');
    }
}

function intentarAgendar() {
    if (!currentUser.profileComplete) {
        showToast("Primero debe completar sus datos personales.","Atención","danger");
        return;
    }
    showToast("Abriendo calendario de citas...","Acción","info");
} 

// ==========================================
// --- GESTIÓN DE PERSONAS Y REGISTRO ---
// ==========================================

// 1. Control de Visibilidad de Campos
function cambiarFormularioPorRol() {
    const rol = document.getElementById('p_rol').value;
    const secMedico = document.getElementById('sec_medico');
    const secHorario = document.getElementById('sec_horario');

    secMedico.classList.add('d-none');
    secHorario.classList.add('d-none');

    if (rol === 'medico') {
        secMedico.classList.remove('d-none');
        secHorario.classList.remove('d-none');
    } else if (rol === 'trabajador') {
        secHorario.classList.remove('d-none');
    }
}

// 2. Abrir Modal (ADMIN O PACIENTE LOGUEADO)
function abrirModalUsuario(mode) {
    document.getElementById('formPersona').reset();
    cambiarFormularioPorRol(); 
    
    // Asegurar que el selector sea visible (por si venimos del modo registro público)
    const selectRol = document.getElementById('p_rol');
    selectRol.closest('.mb-3').classList.remove('d-none'); 
    document.getElementById('sec_password').classList.add('d-none');

    if(mode === 'self') {
        selectRol.value = 'paciente';
        selectRol.disabled = true;
        document.getElementById('p_modo_registro').value = 'self';
        document.getElementById('modalPersonaTitle').innerText = "Completar Datos";
    } else {
        selectRol.disabled = false;
        document.getElementById('p_modo_registro').value = 'admin';
        document.getElementById('modalPersonaTitle').innerText = "Gestión de Usuario";
    }
    
    new bootstrap.Modal(document.getElementById('modalPersona')).show();
}

// 3. REGISTRO PÚBLICO (Sign Up - La función que fallaba)
function abrirRegistroPaciente() {
    document.getElementById('formPersona').reset();
    
    document.getElementById('p_modo_registro').value = 'signup'; 
    document.getElementById('modalPersonaTitle').innerHTML = '<i class="fa-solid fa-heart-pulse text-danger"></i> Crear Nueva Cuenta';

    // Ocultar selector de rol (Blindaje)
    const selectRol = document.getElementById('p_rol');
    selectRol.value = 'paciente';
    selectRol.closest('.mb-3').classList.add('d-none'); 

    // Mostrar password
    document.getElementById('sec_password').classList.remove('d-none');
    document.getElementById('p_new_password').required = true;

    // Ocultar extras
    document.getElementById('sec_medico').classList.add('d-none');
    document.getElementById('sec_horario').classList.add('d-none');

    new bootstrap.Modal(document.getElementById('modalPersona')).show();
}

// 4. GUARDAR (Submit Único)
document.getElementById('formPersona').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const modo = document.getElementById('p_modo_registro').value;
    const dni = document.getElementById('p_dni').value;
    const nombre = document.getElementById('p_nombres').value;
    const passInput = document.getElementById('p_new_password');

    // SEGURIDAD: Si es registro público, forzar rol paciente
    let rolFinal = (modo === 'signup') ? 'paciente' : document.getElementById('p_rol').value;

    if (modo === 'signup' && (!passInput.value || passInput.value.length < 3)) {
        showToast("La contraseña debe tener al menos 3 caracteres.","Error","danger");
        return;
    } 

    const nuevoUsuario = {
        id: Date.now(),
        rol: rolFinal,
        dni: dni,
        nombre: nombre,
        apellido: document.getElementById('p_apellidos').value,
        ubigeo: document.getElementById('p_ubigeo_codigo').value,
        telefono: document.getElementById('p_telefono').value,
        universidad: document.getElementById('p_universidad').value,
        especialidad: document.getElementById('p_especialidad').value,
        hora_inicio: document.getElementById('p_hora_inicio').value,
        hora_fin: document.getElementById('p_hora_fin').value
    };
    if (usuarioEditandoID) {
        // === MODO EDICIÓN: ACTUALIZAR ===
        const index = BD_REGISTROS.findIndex(u => u.id === usuarioEditandoID);
        if(index !== -1) {
            // Actualizamos los datos del usuario existente
            BD_REGISTROS[index] = { 
                ...BD_REGISTROS[index], // Mantiene ID y datos viejos
                rol, dni, nombre, 
                apellido: document.getElementById('p_apellidos').value,
                ubigeo: document.getElementById('p_ubigeo_codigo').value,
                telefono: document.getElementById('p_telefono').value,
                especialidad: document.getElementById('p_especialidad').value,
                universidad: document.getElementById('p_universidad').value,
                hora_inicio: document.getElementById('p_hora_inicio').value,
                hora_fin: document.getElementById('p_hora_fin').value
            };
            showToast("Usuario actualizado correctamente.","Guardado","success");
        }
        usuarioEditandoID = null; // Limpiamos la variable para la próxima
    } else {
        // === MODO CREACIÓN: NUEVO ===
        const nuevo = {
            id: Date.now(), rol: rol,
            dni, nombre, 
            apellido: document.getElementById('p_apellidos').value,
            ubigeo: document.getElementById('p_ubigeo_codigo').value,
            telefono: document.getElementById('p_telefono').value,
            especialidad: document.getElementById('p_especialidad').value,
            universidad: document.getElementById('p_universidad').value,
            hora_inicio: document.getElementById('p_hora_inicio').value,
            hora_fin: document.getElementById('p_hora_fin').value
        };
        BD_REGISTROS.push(nuevo);
        MOCK_USERS[dni] = { pass: '123', role: rol, name: `${nombre} ${nuevo.apellido}` };
        showToast("Nuevo usuario registrado.","Éxito","success");
    }
    // Crear credencial si es registro público
    if (modo === 'signup') {
        MOCK_USERS[dni] = { 
            pass: passInput.value, 
            role: 'paciente', 
            name: `${nombre} ${nuevoUsuario.apellido}`,
            profileComplete: true 
        };
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const txtOriginal = btn.innerText;
    btn.innerText = "Guardando...";
    btn.disabled = true;

    await smartFetch(`${API_URL}/usuarios`, { method: 'POST', body: JSON.stringify(nuevoUsuario) });
    BD_REGISTROS.push(nuevoUsuario);

    const modalEl = document.getElementById('modalPersona');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    btn.innerText = txtOriginal;
    btn.disabled = false;

    if (modo === 'signup') {
        showToast("Cuenta creada. Use su DNI para ingresar.","Éxito","success");
        document.getElementById('login_user').value = dni;
        document.getElementById('login_pass').value = '';
        document.getElementById('login_pass').focus();
    } else {
        showToast("Usuario registrado.","Éxito","success");
        if(currentUser && currentUser.role === 'admin') filtrarTabla('todos');
        if(modo === 'self') {
            currentUser.profileComplete = true;
            configurarPortalPaciente();
        }
    }
});

// ==========================================
// --- TABLAS Y DASHBOARDS ---
// ==========================================

function filtrarTabla(filtroRol) {
    document.querySelectorAll('.btn-group button').forEach(b => b.classList.remove('active'));
    const tbody = document.getElementById('tablaPersonas');
    tbody.innerHTML = '';

    const filtrados = BD_REGISTROS.filter(u => filtroRol === 'todos' ? true : u.rol === filtroRol);

    filtrados.forEach(u => {
        let badge = 'bg-secondary';
        if(u.rol === 'medico') badge = 'bg-success';
        if(u.rol === 'paciente') badge = 'bg-info';
        if(u.rol === 'trabajador') badge = 'bg-warning text-dark';

        let detalles = `<small class="text-muted">Ubigeo: ${u.ubigeo || '-'}</small>`;
        if(u.rol === 'medico') detalles = `<div class="fw-bold text-primary">${u.especialidad}</div>`;

        let horario = u.telefono || '-';
        if(u.hora_inicio) horario = `<i class="fa-regular fa-clock"></i> ${u.hora_inicio} - ${u.hora_fin}`;

        tbody.innerHTML += `
            <tr>
                <td>
                    <div class="fw-bold">${u.apellido}, ${u.nombre}</div>
                    <span class="badge ${badge}">${u.rol.toUpperCase()}</span>
                    <div class="small text-muted">DNI: ${u.dni || '?'}</div>
                </td>
                <td>${detalles}</td>
                <td>${horario}</td>
                <td class="text-end"><button class="btn btn-sm btn-outline-primary"><i class="fa-solid fa-pen"></i></button></td>
            </tr>`;
    });
}

function renderVistaMedico() {
    const tbody = document.getElementById('tablaCitasMedico');
    tbody.innerHTML = '';
    BD_CITAS.forEach(cita => {
        const rowClass = cita.estado === 'atendido' ? 'table-secondary text-muted' : '';
        const btn = cita.estado === 'atendido' ? '<span class="badge bg-secondary">Fin</span>' : `<button class="btn btn-sm btn-primary" onclick="showToast('Atendiendo...','Acción','info')">Atender</button>`;
        tbody.innerHTML += `<tr class="${rowClass}"><td>${cita.hora}</td><td>${cita.paciente}</td><td>${cita.motivo}</td><td>${cita.estado}</td><td class="text-end">${btn}</td></tr>`;
    });
}

// Actualiza esta función en tu app.js
function renderVistaTrabajador() {
    // 1. BUSCAR DATOS DEL USUARIO ACTUAL
    // Buscamos en la BD simulada un usuario que coincida con el nombre del que está logueado
    const datosUsuario = BD_REGISTROS.find(u => `${u.nombre} ${u.apellido}` === currentUser.name) || currentUser;

    // Obtenemos sus horarios (o valores por defecto si no tiene)
    const entrada = datosUsuario.hora_inicio || '08:00';
    const salida = datosUsuario.hora_fin || '16:00';

    // 2. ACTUALIZAR EL RELOJ EN PANTALLA
    const reloj = document.getElementById('reloj-trabajador');
    if (reloj) {
        reloj.innerText = entrada; // Hora grande
        
        // Actualizamos el texto de salida (buscamos la etiqueta h5 vecina)
        const contenedor = reloj.parentElement;
        const etiquetaSalida = contenedor.querySelector('h5');
        if (etiquetaSalida) {
            etiquetaSalida.innerHTML = `<i class="fa-solid fa-stopwatch"></i> Salida: ${salida}`;
        }
    }

    // 3. RENDERIZAR TAREAS (Esto ya lo tenías)
    const lista = document.getElementById('listaTareasTrabajador');
    if (lista) {
        lista.innerHTML = '';
        BD_TAREAS.forEach(t => {
            const check = t.estado === 'completado' ? 'checked disabled' : '';
            lista.innerHTML += `<li class="list-group-item d-flex"><input class="form-check-input me-3" type="checkbox" ${check}><span>${t.tarea}</span></li>`;
        });
    }
}

// Dashboard Animaciones
function cargarDatosDashboard() {
    animateValue("dash-citas-hoy", 0, 15, 1000);
    animateValue("dash-medicos", 0, 4, 1500);
    animateValue("dash-pacientes", 0, 120, 2000);
}
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if(!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// --- NUEVA DATA SIMULADA ---
const BD_HISTORIAL = [
    { paciente_dni: '70251984', fecha: '2024-12-01', especialidad: 'Medicina General', diagnostico: 'Infección estomacal leve. Se recetó antibióticos.' },
    { paciente_dni: '70251984', fecha: '2025-03-15', especialidad: 'Traumatología', diagnostico: 'Esguince de tobillo grado 1. Reposo.' }
];

// ==========================================
// --- LÓGICA DE CITAS DEL PACIENTE ---
// ==========================================

function abrirModalCita() {
    // 1. Validar que tenga perfil completo
    if (!currentUser.profileComplete) {
        showToast("Antes de agendar, complete sus datos personales.","Atención","danger");
        return;
    }
    
    // 2. Preparar modal
    document.getElementById('formCitaPaciente').reset();
    document.getElementById('cita_doctor').innerHTML = '<option value="">Primero elija especialidad...</option>';
    document.getElementById('cita_doctor').disabled = true;
    
    // 3. Poner fecha mínima de hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('cita_fecha').min = hoy;

    new bootstrap.Modal(document.getElementById('modalCitaPaciente')).show();
}

function filtrarDoctoresPorEspecialidad() {
    const esp = document.getElementById('cita_especialidad').value;
    const selectDoc = document.getElementById('cita_doctor');
    
    selectDoc.innerHTML = ''; // Limpiar
    
    if(!esp) {
        selectDoc.innerHTML = '<option value="">Primero elija especialidad...</option>';
        selectDoc.disabled = true;
        return;
    }

    // BUSCAR MÉDICOS EN NUESTRA BD FALSA
    // (Filtramos usuarios que sean 'medico' y tengan esa 'especialidad')
    const doctoresDisponibles = BD_REGISTROS.filter(u => u.rol === 'medico' && u.especialidad === esp);

    if(doctoresDisponibles.length > 0) {
        selectDoc.disabled = false;
        doctoresDisponibles.forEach(doc => {
            selectDoc.innerHTML += `<option value="${doc.nombre} ${doc.apellido}">${doc.nombre} ${doc.apellido}</option>`;
        });
    } else {
        selectDoc.innerHTML = '<option value="">No hay médicos disponibles</option>';
        selectDoc.disabled = true;
    }
}

document.getElementById('formCitaPaciente').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const esp = document.getElementById('cita_especialidad').value;
    const doc = document.getElementById('cita_doctor').value;
    const fecha = document.getElementById('cita_fecha').value;
    const hora = document.getElementById('cita_hora').value;
    const motivo = document.getElementById('cita_motivo').value;

    const btn = e.target.querySelector('button[type="submit"]');
    const txt = btn.innerText;
    btn.innerText = "Reservando..."; btn.disabled = true;

    // SIMULAR GUARDADO EN BD
    const nuevaCita = {
        id: Date.now(),
        hora: `${fecha} ${hora}`, // Formato simple para la demo
        paciente: currentUser.name,
        motivo: motivo,
        estado: 'pendiente',
        doctor_asignado: doc,
        especialidad: esp
    };

    BD_CITAS.push(nuevaCita);
    await new Promise(r => setTimeout(r, 1000)); // Espera dramática

    showToast(`Cita confirmada: ${esp} con ${doc} el ${fecha} a las ${hora}` ,"Cita","success");
    
    bootstrap.Modal.getInstance(document.getElementById('modalCitaPaciente')).hide();
    btn.innerText = txt; btn.disabled = false;
    
    // Si estuviéramos mostrando una lista de "Próximas citas", aquí la actualizaríamos
});

// ==========================================
// --- MOSTRAR HISTORIAL ---
// ==========================================

function cargarHistorialPaciente() {
    // Buscamos en el historial usando el DNI del usuario actual (currentUser no tiene DNI en mock login, 
    // así que usaremos el nombre o simularemos con el DNI del paciente de prueba '70251984' si coincide)
    
    // TRUCO PARA DEMO: Si el usuario es "Carlos Mamani", mostramos el historial de demo.
    // En un sistema real usaríamos: currentUser.id
    
    const tbody = document.getElementById('tablaHistorialPaciente');
    if(!tbody) return;
    tbody.innerHTML = '';

    // Filtrar historial (Simulación)
    const misRegistros = BD_HISTORIAL; // En prod: .filter(h => h.paciente_id === currentUser.id)

    if (misRegistros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Aún no tienes historial médico.</td></tr>';
        return;
    }

    misRegistros.forEach(h => {
        tbody.innerHTML += `
            <tr>
                <td>${h.fecha}</td>
                <td><span class="badge bg-light text-dark border">${h.especialidad}</span></td>
                <td>${h.diagnostico}</td>
            </tr>
        `;
    });
}

// ==========================================
// --- MÓDULO DE HISTORIA CLÍNICA (MÉDICO) ---
// ==========================================

// Variable temporal para saber qué paciente estamos atendiendo
let pacienteActualDNI = null;

// 1. BUSCAR PACIENTES (Filtra solo rol 'paciente')
function buscarPacienteParaHistorial() {
    const query = document.getElementById('input_buscar_paciente').value.toLowerCase();
    const tbody = document.getElementById('tablaResultadosMedicos');
    tbody.innerHTML = '';

    // Filtramos de nuestra BD general
    const resultados = BD_REGISTROS.filter(u => 
        u.rol === 'paciente' && 
        (u.nombre.toLowerCase().includes(query) || u.apellido.toLowerCase().includes(query) || u.dni.includes(query))
    );

    if (resultados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No se encontraron pacientes.</td></tr>';
        return;
    }

    resultados.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td>
                    <div class="fw-bold">${p.apellido}, ${p.nombre}</div>
                    <small class="text-muted">Edad: 30 aprox (Simulado)</small>
                </td>
                <td>
                    <span class="badge bg-light text-dark border">${p.dni}</span><br>
                    <small>Ubigeo: ${p.ubigeo}</small>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary" onclick="abrirFichaMedica('${p.dni}', '${p.nombre} ${p.apellido}')">
                        <i class="fa-solid fa-folder-open"></i> Ver Ficha
                    </button>
                </td>
            </tr>
        `;
    });
}

// 2. ABRIR LA FICHA (Modal)
function abrirFichaMedica(dni, nombreCompleto) {
    pacienteActualDNI = dni; // Guardamos DNI en memoria para saber a quién guardarle datos

    // Llenar cabecera del modal
    document.getElementById('hc_nombre_paciente').innerText = nombreCompleto;
    document.getElementById('hc_dni').innerText = `DNI: ${dni}`;
    
    // Resetear formulario
    document.getElementById('formNuevaEvolucion').reset();

    // Cargar historial existente
    renderizarLineaTiempo(dni);

    // Mostrar Modal
    new bootstrap.Modal(document.getElementById('modalHistoriaClinica')).show();
}

// 3. DIBUJAR LA LISTA DE CONSULTAS PASADAS
function renderizarLineaTiempo(dni) {
    const contenedor = document.getElementById('lista_historial_clinico');
    contenedor.innerHTML = '';

    // Filtrar de BD_HISTORIAL (que agregamos en el paso anterior)
    const historial = BD_HISTORIAL.filter(h => h.paciente_dni === dni);

    if (historial.length === 0) {
        contenedor.innerHTML = '<div class="alert alert-info">Este paciente no tiene atenciones previas registradas.</div>';
        return;
    }

    // Ordenar (más reciente primero)
    historial.reverse().forEach(h => {
        contenedor.innerHTML += `
            <div class="card mb-3 border-start border-4 border-info shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <h6 class="fw-bold text-primary">${h.especialidad || 'Consulta General'}</h6>
                        <small class="text-muted">${h.fecha}</small>
                    </div>
                    <p class="mb-1"><strong>Diagnóstico:</strong> ${h.diagnostico}</p>
                    ${h.receta ? `<div class="bg-light p-2 rounded small text-dark mt-2 border"><i class="fa-solid fa-pills"></i> <strong>Receta:</strong> ${h.receta}</div>` : ''}
                </div>
            </div>
        `;
    });
    // Volvemos a invertir para no afectar el array original si se reusa
    historial.reverse(); 
}

// 4. GUARDAR NUEVA ATENCIÓN (MÉDICO ESCRIBE)
document.getElementById('formNuevaEvolucion').addEventListener('submit', (e) => {
    e.preventDefault();

    if(!pacienteActualDNI) return;

    // Obtener datos del form
    const motivo = document.getElementById('hc_nuevo_motivo').value;
    const diag = document.getElementById('hc_nuevo_diagnostico').value;
    const receta = document.getElementById('hc_nueva_receta').value;
    
    // Obtener fecha hoy
    const hoy = new Date().toISOString().split('T')[0];

    // Crear registro
    const nuevoRegistro = {
        paciente_dni: pacienteActualDNI,
        fecha: hoy,
        especialidad: currentUser.especialidad || 'Medicina General', // Usa la especialidad del médico logueado
        diagnostico: diag,
        receta: receta
    };

    // Guardar en BD
    BD_HISTORIAL.push(nuevoRegistro);

    // Feedback visual
    showToast("Evolución y receta guardadas correctamente.","Guardado","success");
    document.getElementById('formNuevaEvolucion').reset();
    
    // Recargar la lista para ver lo nuevo ahí mismo
    renderizarLineaTiempo(pacienteActualDNI);
});

// --- FUNCIÓN PARA CARGAR DATOS EN EL MODAL (EDITAR) ---
function prepararEdicion(id) {
    // 1. Buscar usuario
    const usuario = BD_REGISTROS.find(u => u.id === id);
    if(!usuario) return;

    // 2. Marcar que estamos editando (Variable global)
    usuarioEditandoID = id;

    // 3. Abrir modal y cambiar título
    abrirModalUsuario('admin'); 
    document.getElementById('modalPersonaTitle').innerText = `Editar: ${usuario.nombre}`;

    // 4. Llenar campos comunes
    document.getElementById('p_rol').value = usuario.rol;
    cambiarFormularioPorRol(); // Muestra/Oculta campos según el rol
    
    document.getElementById('p_dni').value = usuario.dni || '';
    document.getElementById('p_nombres').value = usuario.nombre || '';
    document.getElementById('p_apellidos').value = usuario.apellido || '';
    document.getElementById('p_telefono').value = usuario.telefono || '';
    document.getElementById('p_ubigeo_codigo').value = usuario.ubigeo || '';

    // 5. Llenar campos específicos (Médico / Trabajador)
    if(usuario.rol === 'medico') {
        document.getElementById('p_universidad').value = usuario.universidad || '';
        document.getElementById('p_especialidad').value = usuario.especialidad || '';
    }
    // Llenar Horarios
    document.getElementById('p_hora_inicio').value = usuario.hora_inicio || '';
    document.getElementById('p_hora_fin').value = usuario.hora_fin || '';
}