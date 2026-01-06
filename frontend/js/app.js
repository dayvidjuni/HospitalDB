const API_URL = 'http://localhost:3000/api';

// --- UTILS ---
function showView(viewId) {
    document.querySelectorAll('.section-view').forEach(el => el.classList.remove('active-view'));
    document.getElementById(`view-${viewId}`).classList.add('active-view');
    if (viewId === 'medicos') cargarMedicos();
    if (viewId === 'personas') buscarPersonas();
    if (viewId === 'citas') { cargarCitas(); cargarMedicosSelect(); }
}

function showAlert(msg, type = 'success') {
    const el = document.getElementById('alertBox');
    el.className = `alert alert-${type}`;
    el.innerText = msg;
    el.classList.remove('d-none');
    setTimeout(() => el.classList.add('d-none'), 3000);
}

// --- PERSONAS ---
document.getElementById('formPersona').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        tipo_documento_id: 1, // Default DNI
        numero_documento: document.getElementById('p_dni').value,
        nombres: document.getElementById('p_nombres').value,
        apellidos: document.getElementById('p_apellidos').value,
        fecha_nacimiento: document.getElementById('p_nacimiento').value,
        sexo: document.getElementById('p_sexo').value,
        ubigeo_id: document.getElementById('p_ubigeo').value || undefined,
        telefono: document.getElementById('p_telefono').value,
        email: document.getElementById('p_email').value
    };

    try {
        // 1. Crear Persona
        let res = await fetch(`${API_URL}/personas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        let json = await res.json();
        if (!res.ok) throw new Error(json.error);
        const personaId = json.persona_id;

        // 2. Auto-crear Paciente
        await fetch(`${API_URL}/pacientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ persona_id: personaId, tipo_sangre: 'O+' })
        });

        showAlert(`Persona y Paciente registrados! ID: ${personaId}`);
        e.target.reset();
        buscarPersonas(); // Refresh list automatically
    } catch (err) {
        showAlert(err.message, 'danger');
    }
});

async function buscarPersonas() {
    const q = document.getElementById('searchPaciente').value;
    const res = await fetch(`${API_URL}/personas/search?q=${q}`);
    const data = await res.json();
    const tbody = document.getElementById('tablaPersonas');
    tbody.innerHTML = '';
    data.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td>${p.persona_id}</td>
                <td>${p.nombres} ${p.apellidos}</td>
                <td>${p.numero_documento}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="verHistorial(${p.persona_id})">Historial</button>
                    <button class="btn btn-sm btn-warning" onclick="copiarId(${p.persona_id})">Copiar ID</button>
                </td>
            </tr>
        `;
    });
}

function copiarId(id) {
    navigator.clipboard.writeText(id);
    showAlert('ID copiado al portapapeles');
}

// --- MEDICOS ---
async function cargarMedicos() {
    const res = await fetch(`${API_URL}/medicos`);
    const data = await res.json();
    const tbody = document.getElementById('tablaMedicos');
    tbody.innerHTML = '';
    data.forEach(m => {
        tbody.innerHTML += `
            <tr>
                <td>${m.medico_id}</td>
                <td>${m.nombres} ${m.apellidos}</td>
                <td>${m.numero_colegiatura}</td>
                <td>-</td>
            </tr>
        `;
    });
}

async function cargarMedicosSelect() {
    const res = await fetch(`${API_URL}/medicos`);
    const data = await res.json();
    const sel = document.getElementById('c_medico_id');
    sel.innerHTML = '<option value="">Seleccione Médico...</option>';
    data.forEach(m => {
        sel.innerHTML += `<option value="${m.medico_id}">${m.nombres} ${m.apellidos} (${m.especialidades})</option>`;
    });
}

document.getElementById('formMedico').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        persona_id: document.getElementById('m_persona_id').value,
        numero_colegiatura: document.getElementById('m_cmp').value,
        universidad_origen: document.getElementById('m_uni').value,
        especialidades: [1] // Default Cardilogia just for demo
    };
    try {
        let res = await fetch(`${API_URL}/medicos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) { showAlert('Médico Registrado'); cargarMedicos(); }
        else { let j = await res.json(); throw new Error(j.error); }
    } catch (err) { showAlert(err.message, 'danger'); }
});

// --- CITAS ---
async function cargarCitas() {
    const res = await fetch(`${API_URL}/citas`);
    const data = await res.json();
    const tbody = document.getElementById('tablaCitas');
    tbody.innerHTML = '';
    data.forEach(c => {
        let acciones = '';
        if (c.estado === 'Programada') {
            acciones = `<button class="btn btn-sm btn-danger" onclick="cancelarCita(${c.cita_id})">Cancelar</button>`;
        }
        tbody.innerHTML += `
            <tr>
                <td>${c.cita_id}</td>
                <td>${c.fecha.split('T')[0]} ${c.hora}</td>
                <td>${c.paciente}</td>
                <td>${c.medico}</td>
                <td><span class="badge bg-${getColorEstado(c.estado)}">${c.estado}</span></td>
                <td>${acciones}</td>
            </tr>
        `;
    });
}

function getColorEstado(estado) {
    if (estado === 'Programada') return 'primary';
    if (estado === 'Atendida') return 'success';
    if (estado === 'Cancelada') return 'danger';
    return 'secondary';
}

document.getElementById('formCita').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        paciente_id: document.getElementById('c_paciente_id').value,
        medico_id: document.getElementById('c_medico_id').value,
        especialidad_id: 1, // Hardcoded for demo
        fecha: document.getElementById('c_fecha').value,
        hora: document.getElementById('c_hora').value,
        motivo: document.getElementById('c_motivo').value
    };

    try {
        let res = await fetch(`${API_URL}/citas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) { showAlert('Cita Agendada'); cargarCitas(); e.target.reset(); }
        else { let j = await res.json(); throw new Error(j.error); }
    } catch (err) { showAlert(err.message, 'danger'); }
});

async function cancelarCita(id) {
    if (!confirm('¿Cancelar Cita?')) return;
    await fetch(`${API_URL}/citas/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Cancelada', motivo: 'Cancelado por usuario web' })
    });
    cargarCitas();
}

// --- ATENCION ---
let medicamentosReceta = [];

async function verificarCitaAtencion() {
    const id = document.getElementById('at_cita_id').value;
    try {
        const res = await fetch(`${API_URL}/citas/${id}`);
        if (!res.ok) throw new Error('Cita no encontrada');
        const cita = await res.json();
        document.getElementById('infoCitaAtencion').innerText =
            `Paciente: ${cita.paciente_nombre} | Motivo: ${cita.motivo} | Estado: ${cita.estado}`;
    } catch (err) {
        document.getElementById('infoCitaAtencion').innerText = err.message;
    }
}

document.getElementById('formAtencion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        cita_id: document.getElementById('at_cita_id').value,
        diagnostico: document.getElementById('at_diagnostico').value,
        observaciones: document.getElementById('at_observaciones').value
    };
    try {
        let res = await fetch(`${API_URL}/atenciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) showAlert('Atención Registrada. Ahora puede generar receta.');
        else { let j = await res.json(); throw new Error(j.error); }
    } catch (err) { showAlert(err.message, 'danger'); }
});

function agregarMedicamentoUI() {
    const nombre = document.getElementById('rec_medicamento').value;
    const dosis = document.getElementById('rec_dosis').value;
    const frec = document.getElementById('rec_frecuencia').value;

    medicamentosReceta.push({ nombre_medicamento: nombre, dosis, frecuencia: frec, duracion: 'N/A', cantidad_total: 1 });

    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerText = `${nombre} - ${dosis} (${frec})`;
    document.getElementById('listaMedicamentos').appendChild(li);

    document.getElementById('rec_medicamento').value = '';
}

async function guardarReceta() {
    const cita_id = document.getElementById('at_cita_id').value;
    const diag = document.getElementById('at_diagnostico').value;

    const data = {
        cita_id,
        diagnostico: diag,
        indicaciones_generales: "Tomar según indicaciones",
        medicamentos: medicamentosReceta
    };

    try {
        let res = await fetch(`${API_URL}/atenciones/recetas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) { showAlert('Receta Guardada'); medicamentosReceta = []; document.getElementById('listaMedicamentos').innerHTML = ''; }
        else throw new Error('Error guardando receta');
    } catch (err) { showAlert(err.message, 'danger'); }
}

// --- HISTORIAL ---
async function verHistorial(personaId) {
    // Need to find paciente_id first usually, but backend endpoint uses paciente_id.
    // In this specific schema, person -> patient link.
    // Let's assume we search person, get Id. 
    // We need an endpoint to get patient_id by persona_id or just try same ID if synchronous?
    // Actually, paciente_id != persona_id always.
    // I need to fetch the patient ID first.

    // Quick hack: Use the search API to find the patient object if the backend supported it, 
    // but the backend search returns Persona.
    // I will try to fetch `/api/pacientes` filtering in frontend or add a search endpoint for patients.

    // For now: Just try to fetch history assuming the user knows the PATIENT ID (displayed in list?).
    // In "tablaPersonas", I show persona_id.
    // I need a way to get patient_id from persona_id.
    // Let's just create a quick helper or alert user: "Using Persona ID likely fails if not matched".

    // Correction: Frontend UI shows "ID" which is "persona_id".
    // I'll add a quick endpoint in backend or logic to `search` to return `paciente_id` if exists.
    // But since I cannot edit backend now easily without asking... 
    // Wait, `PacienteModel.getAll` returns `persona_id`. 
    // I will fetch all patients and map persona_id -> paciente_id locally for this demo.

    let res = await fetch(`${API_URL}/pacientes`);
    let pacientes = await res.json();
    let pac = pacientes.find(p => p.persona_id == personaId);

    if (!pac) { showAlert('Esta persona no es paciente', 'warning'); return; }

    let histRes = await fetch(`${API_URL}/pacientes/${pac.paciente_id}/historial`);
    if (!histRes.ok) { showAlert('Error al cargar historial', 'danger'); return; }
    let hist = await histRes.json();

    let html = `<h4>Paciente: ${hist.paciente.nombres} ${hist.paciente.apellidos}</h4><hr>`;
    hist.historial.forEach(h => {
        html += `
            <div class="card mb-2">
                <div class="card-body">
                    <strong>${h.fecha.split('T')[0]}</strong> - ${h.especialidad} (${h.medico})<br>
                    Estado: <span class="badge bg-${getColorEstado(h.estado)}">${h.estado}</span><br>
                    ${h.diagnostico ? `<i>Dx: ${h.diagnostico}</i>` : ''}
                </div>
            </div>
        `;
    });

    document.getElementById('modalHistorialBody').innerHTML = html;
    new bootstrap.Modal(document.getElementById('modalHistorial')).show();
}
