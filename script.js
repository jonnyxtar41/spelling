document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ---
    const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz61Zud88nwjxLAe--a-3ExgcE9jTxDQum_Vc3BvoDKuDpDbndn0a01U3ju7rWlbz0Mqw/exec';
    const NUM_EXTRA_FIELDS = 10;

    // --- MÓDULO DE INTERFAZ DE USUARIO (UI) ---
    const UI = {
        // Elementos del DOM
        authOverlay: document.getElementById('authOverlay'),
        authBox: document.getElementById('authBox'),
        authMessage: document.getElementById('authMessage'),
        startButton: document.getElementById('startButton'),
        formContainer: document.querySelector('.container'),
        form: document.getElementById('myForm'),
        submitButton: document.getElementById('myForm').querySelector('button[type="submit"]'),
        fechaHoraActualEl: document.getElementById('fechaHoraActual'),
        fechaHoraActualInputEl: document.getElementById('fechaHoraActualInput'),
        countdownDisplay: document.getElementById('countdownTimer'),
        extraFieldsContainer: document.getElementById('extraFieldsContainer'),
        formElementsToManage: [],

        // Métodos de UI
        showMessage(element, message, isError = false) {
            element.textContent = message;
            element.style.color = isError ? '#ff4d4d' : 'white';
        },
        toggleStartButton(enabled) {
            this.startButton.disabled = !enabled;
        },
        hideAuthOverlay() {
            if (this.authOverlay) this.authOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        },
        showFormContainer() {
            if (this.formContainer) this.formContainer.style.display = 'block';
        },
        updateDateTime() {
            const now = new Date().toLocaleString();
            if (this.fechaHoraActualEl) this.fechaHoraActualEl.textContent = now;
            if (this.fechaHoraActualInputEl) this.fechaHoraActualInputEl.value = now;
        },
        updateTimerDisplay(text) {
            if (this.countdownDisplay) this.countdownDisplay.textContent = text;
        },
        createExtraFields() {
            this.formElementsToManage.push(document.getElementById('nombre'), document.getElementById('curso'));
            for (let i = 1; i <= NUM_EXTRA_FIELDS; i++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `word${i}`;
                input.name = `word${i}`;
                input.setAttribute('spellcheck', 'false');
                input.setAttribute('autocorrect', 'off');
                input.setAttribute('autocapitalize', 'off');

                const label = document.createElement('label');
                label.setAttribute('for', `word${i}`);
                label.textContent = `Word #${i}:`;
                
                const formGroup = document.createElement('div');
                formGroup.classList.add('form-group');
                formGroup.appendChild(label);
                formGroup.appendChild(input);
                
                this.extraFieldsContainer.appendChild(formGroup);
                this.formElementsToManage.push(input);
            }
        },
        disableAllFields(status = true) {
            this.formElementsToManage.forEach(el => el.disabled = status);
            this.submitButton.disabled = status;
        }
    };

    // --- MÓDULO DE AUTENTICACIÓN ---
    const Auth = {
        async check() {
            UI.showMessage(UI.authMessage, 'Verificando autorización...');
            UI.toggleStartButton(false);
            try {
                const response = await fetch(`${GOOGLE_APP_SCRIPT_URL}?action=checkAuth`);
                if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
                const data = await response.json();
                console.log('Respuesta de autorización:', data);

                if (data.result === "success" && data.authStatus === "TRUE") {
                    UI.showMessage(UI.authMessage, '¡Autorización concedida!');
                    return { authorized: true, timerMinutes: data.timerMinutes };
                } else {
                    const errorMsg = data.authStatus === "FALSE" ? 'Aún no tienes autorización para entrar.' : `Error: ${data.error || 'Respuesta inesperada.'}`;
                    UI.showMessage(UI.authMessage, errorMsg, true);
                    UI.toggleStartButton(true);
                    return { authorized: false };
                }
            } catch (error) {
                console.error('Error al verificar autorización:', error);
                UI.showMessage(UI.authMessage, `Error de conexión. Intenta de nuevo.`, true);
                UI.toggleStartButton(true);
                return { authorized: false };
            }
        }
    };

    // --- MÓDULO DEL TEMPORIZADOR ---
    const Timer = {
        intervalId: null,
        timeRemaining: 0,
        timerStarted: false,

        start(durationMinutes, onTick, onEnd) {
            if (this.timerStarted) return;
            this.timerStarted = true;
            this.timeRemaining = durationMinutes * 60;
            console.log(`Timer iniciado con ${durationMinutes} minutos.`);

            this.intervalId = setInterval(() => {
                this.timeRemaining--;
                const minutes = Math.floor(this.timeRemaining / 60);
                let seconds = this.timeRemaining % 60;
                seconds = seconds < 10 ? '0' + seconds : seconds;
                onTick(`Tiempo: ${minutes}:${seconds}`);

                if (this.timeRemaining <= 0) {
                    this.stop();
                    onEnd(); // Llama a la función de finalización
                }
            }, 1000);
        },
        stop() {
            clearInterval(this.intervalId);
            this.timerStarted = false;
        }
    };

    // --- MÓDULO DEL FORMULARIO ---
    const Form = {
        setupListeners(onTimerStart) {
            // Iniciar el temporizador al escribir en cualquier campo de palabra a partir del segundo
            for (let i = 2; i <= NUM_EXTRA_FIELDS; i++) {
                const wordInput = document.getElementById(`word${i}`);
                if (wordInput) {
                    wordInput.addEventListener('input', () => {
                        if (wordInput.value.trim() !== '') onTimerStart();
                    }, { once: true }); // El listener se ejecuta solo una vez por campo
                }
            }

            // Evitar copiar/pegar
            UI.formElementsToManage.forEach(el => {
                if (el.tagName === 'INPUT') {
                    ['copy', 'paste', 'cut'].forEach(evt => el.addEventListener(evt, e => e.preventDefault()));
                }
            });

            // Lógica para cambio de pestaña o ventana
            const handleFocusLoss = () => {
                let formIsDisabled = UI.submitButton.disabled;
                if (!formIsDisabled) {
                    console.log('Pestaña/ventana perdió foco. Borrando datos.');
                    UI.form.reset(); // Método más simple para limpiar el formulario
                    UI.updateDateTime();
                }
            };
            document.addEventListener('visibilitychange', () => document.hidden && handleFocusLoss());
            window.addEventListener('blur', handleFocusLoss);

            // Advertencia antes de cerrar la pestaña
            window.addEventListener('beforeunload', (event) => {
                if (Timer.timerStarted && !UI.submitButton.disabled) {
                    event.preventDefault();
                    event.returnValue = 'Tienes cambios sin guardar y un temporizador activo. ¿Estás seguro de que quieres salir?';
                }
            });

            // Manejo del envío
            UI.form.addEventListener('submit', this.handleSubmit);
        },
        
        async handleSubmit(event) {
            event.preventDefault();
            Timer.stop();

            if (!UI.form.checkValidity()) {
                UI.form.reportValidity();
                return;
            }

            UI.updateDateTime(); // Actualizar fecha justo antes de enviar
            const formData = new FormData(UI.form);
            
            UI.disableAllFields();
            UI.submitButton.textContent = 'Enviando...';

            try {
                const response = await fetch(GOOGLE_APP_SCRIPT_URL, { method: 'POST', body: formData });
                const data = await response.json();
                console.log('Respuesta de envío:', data);

                if (data.result === "success") {
                    alert('¡Formulario enviado exitosamente!');
                    UI.submitButton.textContent = 'Enviado';
                } else {
                    alert('Error al enviar: ' + (data.error || 'Error desconocido.'));
                    UI.submitButton.textContent = 'Error al Enviar';
                }
            } catch (error) {
                console.error('Error en fetch (envío):', error);
                alert('Error de conexión al enviar: ' + error.message);
                UI.submitButton.textContent = 'Error de Red';
            }
        }
    };
    
    // --- FUNCIÓN PRINCIPAL DE LA APLICACIÓN ---
    function main(timerDurationMinutes) {
        UI.createExtraFields();
        UI.updateDateTime();
        setInterval(UI.updateDateTime, 30000); // Actualiza la fecha cada 30s
        
        const startTimerCallback = () => Timer.start(timerDurationMinutes,
            (timeString) => UI.updateTimerDisplay(timeString), // onTick
            () => { // onEnd
                UI.updateTimerDisplay("¡Tiempo agotado!");
                if (UI.form.reportValidity()) {
                   UI.form.requestSubmit();
                } else {
                   UI.disableAllFields();
                   UI.submitButton.textContent = 'Tiempo Agotado';
                }
            }
        );

        Form.setupListeners(startTimerCallback);
    }
    
    // --- PUNTO DE ENTRADA INICIAL ---
    if (UI.startButton) {
        UI.startButton.addEventListener('click', async () => {
            const result = await Auth.check();
            if (result.authorized) {
                setTimeout(() => {
                    UI.hideAuthOverlay();
                    UI.showFormContainer();
                    main(result.timerMinutes);
                }, 1200); // Pequeña espera para que el usuario lea el mensaje de éxito
            }
        });
    }
});
