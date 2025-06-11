/**
 * Script del Frontend (Cliente)
 * Cambios clave:
 * 1. Selector de Actividad: Maneja los clics en los nuevos botones (Spelling, Writing, Quiz).
 * 2. Renderizado Condicional: Una función `renderView` ahora muestra la vista correcta (spellingView, writingView, etc.) y oculta las demás.
 * 3. Inicialización por Vista: La función `initializeApp` actúa como un router, llamando a la lógica de inicialización específica para la vista seleccionada.
 * 4. Múltiples Formularios: Se ha añadido lógica para manejar el envío de los nuevos formularios (Writing y Quiz).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ---
    // **NOTA**: La URL de Google Apps Script se usa para todas las vistas.
    // Deberás adaptar tu script de Google para manejar los diferentes formularios.
    const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz61Zud88nwjxLAe--a-3ExgcE9jTxDQum_Vc3BvoDKuDpDbndn0a01U3ju7rWlbz0Mqw/exec';
    const NUM_SPELLING_FIELDS = 10;

    // --- MÓDULO DE INTERFAZ DE USUARIO (UI) ---
    const UI = {
        // Elementos del DOM
        authOverlay: document.getElementById('authOverlay'),
        authMessage: document.getElementById('authMessage'),
        activitySelector: document.getElementById('activitySelector'),
        
        // Contenedores de vistas
        viewContainers: document.querySelectorAll('.view-container'),

        // Métodos de UI
        showMessage(element, message, isError = false) {
            element.textContent = message;
            element.style.color = isError ? '#ff4d4d' : 'white';
        },
        toggleActivityButtons(enabled) {
            this.activitySelector.querySelectorAll('button').forEach(btn => btn.disabled = !enabled);
        },
        renderView(viewId) {
            // Ocultar overlay y mostrar el body
            this.authOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';

            // Ocultar todos los contenedores de vistas
            this.viewContainers.forEach(container => container.style.display = 'none');
            
            // Mostrar solo el contenedor seleccionado
            const activeView = document.getElementById(viewId);
            if (activeView) {
                activeView.style.display = 'block';
            } else {
                console.error(`La vista con ID "${viewId}" no fue encontrada.`);
            }
        }
    };

    // --- MÓDULO DE AUTENTICACIÓN ---
    const Auth = {
        async check() {
            UI.showMessage(UI.authMessage, 'Verificando autorización...');
            UI.toggleActivityButtons(false);
            try {
                // La autenticación es la misma para todas las vistas
                const response = await fetch(`${GOOGLE_APP_SCRIPT_URL}?action=checkAuth`);
                if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
                const data = await response.json();
                console.log('Respuesta de autorización:', data);

                if (data.result === "success" && data.authStatus === "TRUE") {
                    UI.showMessage(UI.authMessage, '¡Autorización concedida!');
                    // Devuelve la configuración (ej. duración del timer)
                    return { authorized: true, config: { timerMinutes: data.timerMinutes } };
                } else {
                    const errorMsg = data.authStatus === "FALSE" ? 'No tienes autorización para esta actividad.' : `Error: ${data.error || 'Respuesta inesperada.'}`;
                    UI.showMessage(UI.authMessage, errorMsg, true);
                    UI.toggleActivityButtons(true);
                    return { authorized: false };
                }
            } catch (error) {
                console.error('Error al verificar autorización:', error);
                UI.showMessage(UI.authMessage, `Error de conexión. Intenta de nuevo.`, true);
                UI.toggleActivityButtons(true);
                return { authorized: false };
            }
        }
    };
    
    // --- LÓGICA DE INICIALIZACIÓN POR VISTA ---
    
    // Inicializador para el Spelling Quiz
    function initializeSpellingQuiz(config) {
        console.log("Inicializando Spelling Quiz con config:", config);
        // Aquí iría toda la lógica específica del spelling quiz que ya tenías:
        // crear campos, manejar el timer, los listeners de blur/visibilidad, etc.
        // Por simplicidad, este ejemplo es más breve.
        const form = document.getElementById('spellingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Enviando formulario de Spelling...');
            // Aquí iría la lógica de fetch para enviar a Google Sheets
        });
    }

    // Inicializador para la Tarea de Escritura
    function initializeWritingTask(config) {
        console.log("Inicializando Writing Task con config:", config);
        const form = document.getElementById('writingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Agregar un identificador de formulario a los datos
            const formData = new FormData(form);
            formData.append('formType', 'writing'); // Para que Google Script sepa qué hacer

            alert('Enviando formulario de Writing...');
            // fetch(GOOGLE_APP_SCRIPT_URL, { method: 'POST', body: formData }).then(...)
        });
    }

    // Inicializador para el Quiz General
    function initializeQuiz(config) {
        console.log("Inicializando Quiz con config:", config);
        const form = document.getElementById('quizForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            formData.append('formType', 'quiz');

            alert('Enviando formulario de Quiz...');
            // fetch(GOOGLE_APP_SCRIPT_URL, { method: 'POST', body: formData }).then(...)
        });
    }

    // --- ROUTER DE INICIALIZACIÓN ---
    // Esta función decide qué inicializador llamar basado en la vista
    function initializeApp(viewName, config) {
        switch (viewName) {
            case 'spelling':
                initializeSpellingQuiz(config);
                break;
            case 'writing':
                initializeWritingTask(config);
                break;
            case 'quiz':
                initializeQuiz(config);
                break;
            default:
                console.error(`No hay una función de inicialización para la vista "${viewName}".`);
        }
    }

    // --- PUNTO DE ENTRADA ---
    if (UI.activitySelector) {
        UI.activitySelector.addEventListener('click', async (event) => {
            // Si el clic no fue en un botón, no hacer nada
            if (!event.target.matches('.activity-button')) return;
            
            const selectedView = event.target.dataset.view; // 'spelling', 'writing', o 'quiz'
            
            // 1. Verificar autorización
            const authResult = await Auth.check();
            
            // 2. Si está autorizado, renderizar la vista e inicializarla
            if (authResult.authorized) {
                setTimeout(() => {
                    UI.renderView(`${selectedView}View`);
                    initializeApp(selectedView, authResult.config);
                }, 1000); // Pequeña espera para leer el mensaje
            }
        });
    }
});
