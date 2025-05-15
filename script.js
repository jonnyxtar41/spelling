document.addEventListener('DOMContentLoaded', function() {
    const fechaHoraActual = new Date();
    const fechaString = fechaHoraActual.toLocaleString();
    const fechaHoraActualP = document.getElementById('fechaHoraActual');
    const fechaHoraActualInput = document.getElementById('fechaHoraActualInput');

    if (fechaHoraActualP) {
        fechaHoraActualP.textContent = fechaString;
    }
    if (fechaHoraActualInput) {
        fechaHoraActualInput.value = fechaString;
    }
});

const extraFieldsContainer = document.getElementById('extraFieldsContainer');
const numExtraFields = 10;
const formElementsToClear = [];

if (extraFieldsContainer) { // Verificar si el contenedor existe antes de operar sobre él
    for (let i = 1; i <= numExtraFields; i++) {
        const formGroup = document.createElement('div');
        formGroup.classList.add('form-group');

        const label = document.createElement('label');
        label.setAttribute('for', `word${i}`);
        label.textContent = `Word #${i}:`;

        const input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('id', `word${i}`);
        input.setAttribute('name', `word${i}`); // El atributo 'name' es crucial
        input.setAttribute('spellcheck', 'false');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');

        formGroup.appendChild(label);
        formGroup.appendChild(input);
        extraFieldsContainer.appendChild(formGroup);
        formElementsToClear.push(input);
    }
}


// Asegurar que 'nombre' y 'curso' se añaden a formElementsToClear si no lo están ya
const nombreInput = document.getElementById('nombre');
if (nombreInput) { // No es necesario verificar si ya está en el array si solo los añadimos una vez
    formElementsToClear.push(nombreInput);
}

const cursoSelect = document.getElementById('curso');
if (cursoSelect) {
    formElementsToClear.push(cursoSelect);
}

const allTextInputs = document.querySelectorAll('input[type="text"], input[type="date"]');
allTextInputs.forEach(input => {
    if (input.type === 'text') {
        input.setAttribute('spellcheck', 'false');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');
    }

    input.addEventListener('copy', function(event) {
        event.preventDefault();
        console.log('Acción de copiar deshabilitada en este campo');
    });
    input.addEventListener('paste', function(event) {
        event.preventDefault();
        console.log('Acción de pegar deshabilitada en este campo');
    });
    input.addEventListener('cut', function(event) {
        event.preventDefault();
        console.log('Acción de cortar deshabilitada en este campo');
    });
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Pestaña oculta. Borrando datos del formulario.');
        formElementsToClear.forEach(element => {
            if (element.type === 'text' || element.type === 'date' || element.tagName === 'TEXTAREA') {
                element.value = '';
            } else if (element.tagName === 'SELECT') {
                element.selectedIndex = 0; // Seleccionar la primera opción (generalmente la vacía)
            }
        });
        console.log('Datos borrados.');
        // Actualizar también la fecha mostrada y el input oculto si se borran los datos
        const fechaHoraActual = new Date();
        const fechaString = fechaHoraActual.toLocaleString();
        const fechaHoraActualP = document.getElementById('fechaHoraActual');
        const fechaHoraActualInput = document.getElementById('fechaHoraActualInput');

        if(fechaHoraActualP) {
            fechaHoraActualP.textContent = fechaString;
        }
        if(fechaHoraActualInput) {
            fechaHoraActualInput.value = fechaString;
        }
    } else {
        console.log('Pestaña visible.');
    }
});

window.addEventListener('beforeunload', function(event) {
    const confirmationMessage = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
    event.returnValue = confirmationMessage; // Estándar moderno
    return confirmationMessage; // Compatibilidad con navegadores antiguos
});

const form = document.getElementById('myForm');
const scriptURL = 'https://script.google.com/macros/s/AKfycbz9GYqIqORMkX2ixfdeURFfdSOOA7vrEQSD7kY0lSBS88dmhxrHeMBAt00cW-Cp9_a26g/exec';

if (form) { // Verificar si el formulario existe antes de añadir el listener
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Previene el envío tradicional

        const ahora = new Date();
        const ahoraString = ahora.toLocaleString();
        const fechaHoraActualP = document.getElementById('fechaHoraActual');
        const fechaHoraActualInput = document.getElementById('fechaHoraActualInput');

        if (fechaHoraActualP) {
            fechaHoraActualP.textContent = ahoraString;
        }
        if (fechaHoraActualInput) {
            fechaHoraActualInput.value = ahoraString;
        }

        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
        }

        fetch(scriptURL, { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                console.log('Respuesta de Apps Script:', data);
                if (data.result === "success") {
                    alert('¡Formulario enviado exitosamente a Google Sheets!');
                    form.reset();
                    const nuevaFecha = new Date().toLocaleString();
                    if (fechaHoraActualP) {
                        fechaHoraActualP.textContent = nuevaFecha;
                    }
                    if (fechaHoraActualInput) {
                        fechaHoraActualInput.value = nuevaFecha;
                    }
                } else {
                    alert('Error al enviar el formulario: ' + (data.error || 'Error desconocido. Revisa la consola del script en Google Apps Script.'));
                }
            })
            .catch(error => {
                console.error('Error en fetch:', error);
                alert('Error al enviar el formulario: ' + error.message + '. Revisa la consola del navegador para más detalles.');
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Enviar';
                }
            });
    });
}
