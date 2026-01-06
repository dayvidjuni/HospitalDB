// js/charts.js

// Variables globales para guardar las instancias de los gráficos
// (Necesario para poder destruirlos y redibujarlos si actualizamos datos)
let chartFlujoInstance = null;
let chartEspInstance = null;

function inicializarGraficos() {
    console.log("Inicializando gráficos del Dashboard...");

    // --- GRÁFICO 1: FLUJO DE PACIENTES (LÍNEAS) ---
    const ctxFlujo = document.getElementById('chartFlujo').getContext('2d');
    
    // Si ya existe, lo destruimos para no crear uno encima de otro
    if (chartFlujoInstance) chartFlujoInstance.destroy();

    chartFlujoInstance = new Chart(ctxFlujo, {
        type: 'line',
        data: {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
            datasets: [{
                label: 'Pacientes Atendidos',
                data: [65, 59, 80, 81, 56, 120], // Datos simulados
                borderColor: '#0d6efd', // Azul Bootstrap
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                fill: true,
                tension: 0.4 // Curva suave
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // --- GRÁFICO 2: ESPECIALIDADES (DONA) ---
    const ctxEsp = document.getElementById('chartEspecialidades').getContext('2d');
    
    if (chartEspInstance) chartEspInstance.destroy();

    chartEspInstance = new Chart(ctxEsp, {
        type: 'doughnut',
        data: {
            labels: ['General', 'Cardiología', 'Pediatría', 'Trauma'],
            datasets: [{
                data: [45, 25, 20, 10], // Porcentajes simulados
                backgroundColor: [
                    '#0d6efd', // Azul
                    '#198754', // Verde
                    '#ffc107', // Amarillo
                    '#dc3545'  // Rojo
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}