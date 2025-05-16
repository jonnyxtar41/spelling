       // --- Sección de Autorización ---
        const authOverlay = document.getElementById('authOverlay');
        const startButton = document.getElementById('startButton');
        const authMessage = document.getElementById('authMessage');
        const formContainer = document.querySelector('.container');
        
        // **REEMPLAZA ESTA URL CON LA URL DE TU APLICACIÓN WEB DE GOOGLE APPS SCRIPT**
        const googleAppScriptURL = 'https://script.google.com/macros/s/AKfycbz61Zud88nwjxLAe--a-3ExgcE9jTxDQum_Vc3BvoDKuDpDbndn0a01U3ju7rWlbz0Mqw/exec'; 

        if (startButton) {
            startButton.addEventListener('click', function() {
                authMessage.textContent = 'Verificando autorización...';
                startButton.disabled = true;

                fetch(`${googleAppScriptURL}?action=checkAuth`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Error de red: ${response.status} ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        // --- Depuración de la respuesta del script ---
                        console.log('Respuesta completa de autorización (data):', data); 
                        console.log('Valor de data.timerMinutes recibido:', data.timerMinutes, '(Tipo:', typeof data.timerMinutes + ')');

                        // --- Fin de la depuración ---
                        
                        if (data.result === "success" && data.authStatus === "TRUE") {
                            authMessage.textContent = '¡Autorización concedida!';
                            
                            let timerDurationMinutes = 5; // Valor por defecto inicial
                            if (typeof data.timerMinutes === 'number' && data.timerMinutes > 0) {
                                timerDurationMinutes = data.timerMinutes;
                                console.log(`Usando timerMinutes (${data.timerMinutes}) recibido del script.`);
                            } else {
                                console.warn(`timerMinutes de data (${data.timerMinutes}) no es un número válido o es <= 0. Usando valor por defecto: 5 minutos.`);
                            }

                            console.log(`Timer se configurará con: ${timerDurationMinutes} minutos.`);

                            setTimeout(() => {
                                if (authOverlay) authOverlay.style.display = 'none';
                                if (formContainer) formContainer.style.display = 'block';
                                document.body.style.overflow = 'auto'; 
                                initializeFormFunctionality(timerDurationMinutes); 
                            }, 1200);
                        } else if (data.result === "success") { 
                            authMessage.textContent = 'Aún no tienes autorización para entrar.';
                            startButton.disabled = false; 
                        } else { 
                            authMessage.textContent = `Error del servidor: ${data.error || 'Respuesta inesperada.'}`;
                            startButton.disabled = false;
                        }
                    })
                    .catch(error => {
                        console.error('Error al verificar autorización:', error);
                        authMessage.textContent = `Error de conexión: ${error.message}. Intenta de nuevo.`;
                        startButton.disabled = false;
                    });
            });
        }

        // --- Sección de Funcionalidad del Formulario (Envuelto en una función) ---
        function initializeFormFunctionality(timerDurationMinutesParam) { 
            // --- Depuración del parámetro recibido ---
            console.log('initializeFormFunctionality llamada con timerDurationMinutesParam:', timerDurationMinutesParam, '(Tipo:', typeof timerDurationMinutesParam + ')');
            // --- Fin de la depuración ---

            const fechaHoraActualEl = document.getElementById('fechaHoraActual');
            const fechaHoraActualInputEl = document.getElementById('fechaHoraActualInput');
            
            function updateCurrentDateTime() {
                const fechaHoraActual = new Date();
                const fechaString = fechaHoraActual.toLocaleString();
                if (fechaHoraActualEl) fechaHoraActualEl.textContent = fechaString;
                if (fechaHoraActualInputEl) fechaHoraActualInputEl.value = fechaString;
            }
            updateCurrentDateTime(); // Llama al cargar el formulario

            const extraFieldsContainer = document.getElementById('extraFieldsContainer');
            const numExtraFields = 10;
            const formElementsToManage = []; 

            const nombreInput = document.getElementById('nombre');
            if (nombreInput) formElementsToManage.push(nombreInput);
            const cursoSelect = document.getElementById('curso');
            if (cursoSelect) formElementsToManage.push(cursoSelect);

            for (let i = 1; i <= numExtraFields; i++) {
                const formGroup = document.createElement('div');
                formGroup.classList.add('form-group');
                const label = document.createElement('label');
                label.setAttribute('for', `word${i}`);
                label.textContent = `Word #${i}:`;
                const input = document.createElement('input');
                input.setAttribute('type', 'text');
                input.setAttribute('id', `word${i}`);
                input.setAttribute('name', `word${i}`);
                input.setAttribute('spellcheck', 'false');
                input.setAttribute('autocorrect', 'off');
                input.setAttribute('autocapitalize', 'off');
                formGroup.appendChild(label);
                formGroup.appendChild(input);
                extraFieldsContainer.appendChild(formGroup);
                formElementsToManage.push(input);
            }
            
            formElementsToManage.forEach(element => {
                if (element.tagName === 'INPUT' && element.type === 'text') {
                    ['copy', 'paste', 'cut'].forEach(evt => 
                        element.addEventListener(evt, function(event) {
                            event.preventDefault();
                            console.log(`Acción de ${evt} deshabilitada en este campo`);
                        })
                    );
                }
            });

            let countdownInterval;
            let timeRemaining = timerDurationMinutesParam * 60; // Usa la duración del timer pasada como parámetro
            console.log('timeRemaining calculado (segundos):', timeRemaining); // Log para verificar el cálculo
            let timerStarted = false;
            const countdownDisplay = document.getElementById('countdownTimer');
            const form = document.getElementById('myForm');
            const submitButton = form.querySelector('button[type="submit"]');

            function updateCountdownDisplay() {
                if (!countdownDisplay) return;
                const minutes = Math.floor(timeRemaining / 60);
                let seconds = timeRemaining % 60;
                seconds = seconds < 10 ? '0' + seconds : seconds;
                countdownDisplay.textContent = `Tiempo: ${minutes}:${seconds}`;
            }

            function disableAllFieldsAndSubmitButton() {
                formElementsToManage.forEach(element => {
                    element.disabled = true;
                });
                if (submitButton) {
                    submitButton.disabled = true;
                }
            }

            function startTimer() {
                if (timerStarted || !countdownDisplay) return;
                timerStarted = true;
                console.log('Timer iniciado!');
                updateCountdownDisplay(); 

                countdownInterval = setInterval(() => {
                    timeRemaining--;
                    updateCountdownDisplay();

                    if (timeRemaining <= 0) {
                        clearInterval(countdownInterval);
                        countdownDisplay.textContent = "¡Tiempo agotado!";
                        console.log("¡Tiempo agotado! Enviando formulario.");
                        if (form.reportValidity()) { 
                            form.requestSubmit(submitButton); 
                        } else {
                            console.log("El formulario no es válido. El envío automático por timer fue bloqueado.");
                            form.reset(); // Limpiar campos aunque no se envíe por invalidez
                            disableAllFieldsAndSubmitButton();
                            if (submitButton) submitButton.textContent = 'Tiempo Agotado (Inválido)';
                        }
                    }
                }, 1000);
            }

            for (let i = 2; i <= numExtraFields; i++) { // Empezamos desde el índice 2 para 'word2'
                const extraWordInput = document.getElementById(`word${i}`);
                if (extraWordInput) {
                    extraWordInput.addEventListener('input', function() {
                        // Iniciar el timer solo si hay texto y el timer no ha comenzado ya
                        if (this.value.trim() !== '' && !timerStarted) {
                            console.log(`Texto ingresado en ${this.id}, iniciando timer.`);
                            startTimer();
                        }
                    });
                } else {
                    console.warn(`Elemento con ID "word${i}" no encontrado para el listener del timer.`);
                }
            }

            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    console.log('Pestaña oculta. Borrando datos del formulario (si no está deshabilitado).');
                    let formIsDisabled = submitButton ? submitButton.disabled : false;
                    if (!formIsDisabled) {
                        formElementsToManage.forEach(element => {
                            if (element.type === 'text' || element.type === 'date' || element.tagName === 'TEXTAREA') {
                                element.value = '';
                            } else if (element.tagName === 'SELECT') {
                                element.selectedIndex = 0;
                            }
                        });
                        updateCurrentDateTime(); // Resetear fecha si se borran datos
                        console.log('Datos borrados.');
                    } else {
                        console.log('Formulario deshabilitado, no se borran datos.');
                    }
                } else {
                    console.log('Pestaña visible.');
                }
            });

            window.addEventListener('beforeunload', function(event) {
                if (timerStarted && timeRemaining > 0 && submitButton && !submitButton.disabled) {
                    const confirmationMessage = 'Tienes cambios sin guardar y un temporizador activo. ¿Estás seguro de que quieres salir?';
                    event.returnValue = confirmationMessage;
                    return confirmationMessage;
                }
            });

                // --- IMPLEMENTACIÓN DEL EVENTO BLUR ---
            window.addEventListener('blur', function(event) {
                // Solo actuar si el formulario principal está visible (pantalla de autorización superada)
                if (authOverlay && authOverlay.style.display === 'none' && formContainer && formContainer.style.display === 'block') {
                    console.log('Ventana perdió el foco. Intentando borrar datos del formulario.');
                    let formIsDisabled = submitButton ? submitButton.disabled : false;

                    // Solo borrar si el formulario no está deshabilitado (ej. después de enviar o tiempo agotado)
                    if (!formIsDisabled) {
                        formElementsToManage.forEach(element => {
                            // Borra el contenido de los campos de texto
                            if (element.tagName.toLowerCase() === 'input' && (element.type.toLowerCase() === 'text' || element.type.toLowerCase() === 'date')) {
                                element.value = '';
                            }
                            // Resetea los campos de selección a su primera opción
                            else if (element.tagName.toLowerCase() === 'select') {
                                element.selectedIndex = 0;
                            }
                            // Considera textareas si las hubiera
                            else if (element.tagName.toLowerCase() === 'textarea') {
                                element.value = '';
                            }
                        });
                        // Actualiza el campo de fecha/hora para mantener consistencia con el evento 'visibilitychange'
                        updateCurrentDateTime();
                        console.log('Datos del usuario borrados y fecha/hora actualizada debido a pérdida de foco de la ventana.');
                    } else {
                        console.log('Ventana perdió el foco, pero el formulario está deshabilitado. No se borran datos.');
                    }
                } else {
                    console.log('Ventana perdió el foco, pero el formulario no está visible/activo. No se borran datos.');
                }
            });
            // --- FIN DE LA IMPLEMENTACIÓN DEL EVENTO BLUR ---
              
               // --- NUEVO EVENTO: PAGEHIDE ---
            window.addEventListener('pagehide', function(event) {
                // event.persisted es true si la página podría ser restaurada rápidamente desde la caché (bfcache)
                // Para este caso, borramos independientemente de si está en bfcache o no, si la página se oculta.
                if (authOverlay && authOverlay.style.display === 'none' && formContainer && formContainer.style.display === 'block') {
                    console.log(`Evento pagehide detectado (persisted: ${event.persisted}).`);
                    clearUserFormDataAndLog('pagehide');
                } else {
                    console.log(`Evento pagehide detectado (persisted: ${event.persisted}), pero el formulario no está activo/visible. No se borran datos.`);
                }
            });
            // --- FIN NUEVO EVENTO: PAGEHIDE ---
                

            form.addEventListener('submit', function(event) {
                event.preventDefault(); 
                clearInterval(countdownInterval); 

                updateCurrentDateTime(); // Actualizar fecha/hora justo antes del envío para FormData
                const formData = new FormData(form); // Capturar datos ANTES de limpiar

                form.reset(); // ***** Limpiar todos los campos del formulario *****
                
                disableAllFieldsAndSubmitButton(); 
                if(submitButton) submitButton.textContent = 'Enviando...';
                
                fetch(googleAppScriptURL, { method: 'POST', body: formData }) 
                    .then(response => response.json()) 
                    .then(data => {
                        console.log('Respuesta de Apps Script (envío):', data);
                        if (data.result === "success") {
                            alert('¡Formulario enviado exitosamente a Google Sheets!');
                            if(submitButton) submitButton.textContent = 'Enviado';
                        } else {
                            alert('Error al enviar el formulario: ' + (data.error || 'Error desconocido.'));
                            if(submitButton) {
                                submitButton.textContent = 'Error al Enviar';
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Error en fetch (envío):', error);
                        alert('Error al enviar el formulario: ' + error.message);
                        if(submitButton) {
                            submitButton.textContent = 'Error de Red';
                        }
                    })
                    .finally(() => {
                        if(submitButton) submitButton.disabled = true;
                    });
            });
        } // Fin de initializeFormFunctionality
