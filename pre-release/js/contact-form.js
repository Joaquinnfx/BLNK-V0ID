document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Script de formulario cargado correctamente');
    
    const contactForm = document.querySelector('.contact-form');
    console.log('📝 Formulario encontrado:', contactForm);
    
    if (contactForm) {
        console.log('✅ Formulario encontrado, agregando evento submit');
        
        // Evento principal simple y funcional
        contactForm.addEventListener('submit', function(e) {
            console.log('📤 Formulario enviado - previniendo recarga');
            e.preventDefault();
            
            // Obtener los valores del formulario
            const name = document.getElementById('text').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            
            console.log('📝 Valores del formulario:', { name, email, message });
            
            // Validar campos
            if (!name || !email || !message) {
                console.log('❌ Campos incompletos');
                showMessage('Please complete all fields.', 'error');
                return;
            }
            
            // Crear objeto FormData
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('message', message);
            
            // Mostrar indicador de carga
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            console.log('🔄 Cambiando botón a estado de carga');
            submitBtn.innerHTML = '<span class="btn-text">SENDING...</span><span class="btn-icon"><i class="fa-solid fa-circle-notch fa-spin"></i></span>';
            submitBtn.disabled = true;
            
            // Enviar formulario - RUTA CORREGIDA
            console.log('📤 Enviando formulario a /pre-release/process-form.php');
            fetch('/pre-release/process-form.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('📨 Respuesta recibida:', response);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('📊 Datos recibidos:', data);
                if (data.success) {
                    // Mostrar mensaje de éxito
                    showMessage(data.message, 'success');
                    contactForm.reset();
                } else {
                    // Mostrar mensaje de error
                    showMessage(data.message, 'error');
                }
            })
            .catch(error => {
                console.error('❌ Error:', error);
                showMessage('There was an error sending the message. Please try again.', 'error');
            })
            .finally(() => {
                // Restaurar botón
                console.log('🔄 Restaurando botón');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
        
        console.log('✅ Evento submit agregado correctamente');
        
    } else {
        console.error('❌ NO SE ENCONTRÓ EL FORMULARIO');
    }
    
    // Función para mostrar mensajes
    function showMessage(message, type) {
        console.log('💬 Mostrando mensaje:', type, message);
        
        // Remover mensajes anteriores
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Crear nuevo mensaje con icono
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${type}`;
        
        // Agregar icono según el tipo de mensaje
        let icon = '';
        if (type === 'success') {
            icon = '<i class="fa-solid fa-check-circle"></i> ';
        } else if (type === 'error') {
            icon = '<i class="fa-solid fa-exclamation-circle"></i> ';
        }
        
        messageDiv.innerHTML = icon + message;
        
        // Insertar después del formulario
        const formContainer = document.querySelector('.form-content');
        if (formContainer) {
            formContainer.appendChild(messageDiv);
            console.log('✅ Mensaje insertado correctamente');
            
            // Agregar clase para animación de entrada
            setTimeout(() => {
                messageDiv.classList.add('show');
            }, 10);
            
            // Remover mensaje después de 6 segundos
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.classList.remove('show');
                    setTimeout(() => {
                        if (messageDiv.parentNode) {
                            messageDiv.remove();
                        }
                    }, 300);
                }
            }, 6000);
        } else {
            console.error('❌ No se encontró el contenedor del formulario');
        }
    }
    
    console.log('🎯 Script completamente cargado y configurado');
});
