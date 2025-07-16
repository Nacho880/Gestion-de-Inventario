// Manejar todos los formularios con AJAX
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si Bootstrap está disponible
  if (typeof bootstrap === 'undefined') {
    console.error('Bootstrap no está disponible');
    return;
  }
  
  // Modales edición y eliminación 
  const editProveedorModal = document.getElementById('editProveedorModal');
  const deleteProveedorModal = document.getElementById('deleteProveedorModal');
  
    // Mover los modales al final del body para evitar problemas de z-index
  if (editProveedorModal) {
    document.body.appendChild(editProveedorModal);
  }
  
  if (deleteProveedorModal) {
    document.body.appendChild(deleteProveedorModal);
  }
  
  if (editProveedorModal) {
    editProveedorModal.addEventListener('show.bs.modal', function (event) {
      
      const button = event.relatedTarget;
      
      if (!button) {
        console.error('No se encontró el botón que abrió el modal');
        return;
      }
      
      const id = button.getAttribute('data-id');
      const nombre = button.getAttribute('data-nombre');
      const prefijoTelefono = button.getAttribute('data-prefijo-telefono');
      const telefono = button.getAttribute('data-telefono');
      const correo = button.getAttribute('data-correo');
      const direccion = button.getAttribute('data-direccion');
      const pais = button.getAttribute('data-pais');
      const ciudad = button.getAttribute('data-ciudad');
      const comuna = button.getAttribute('data-comuna');

      // Verificar que todos los elementos existan antes de asignar valores
      const editId = document.getElementById('edit-id');
      const editNombre = document.getElementById('edit-nombre');
      const editTelefono = document.getElementById('edit-telefono');
      const editCorreo = document.getElementById('edit-correo');
      const editDireccion = document.getElementById('edit-direccion');
      const editPais = document.getElementById('edit-pais');
      const editCiudad = document.getElementById('edit-ciudad');
      const editComuna = document.getElementById('edit-comuna');
      
      if (editId) editId.value = id;
      if (editNombre) editNombre.value = nombre;
      if (editTelefono) editTelefono.value = telefono;
      if (editCorreo) editCorreo.value = correo;
      if (editDireccion) editDireccion.value = direccion;
      if (editPais) editPais.value = pais;
      if (editCiudad) editCiudad.value = ciudad;
      if (editComuna) editComuna.value = comuna;
      
      // Manejar el prefijo en el select de edición
      const editPrefijoSelect = document.getElementById('edit-prefijo-telefono');
      const editPrefijoCustom = document.getElementById('edit-prefijo-custom');
      
      if (editPrefijoSelect) {
        // Buscar si el prefijo existe en las opciones
        const option = editPrefijoSelect.querySelector(`option[value="${prefijoTelefono}"]`);
        if (option) {
          editPrefijoSelect.value = prefijoTelefono;
          if (editPrefijoCustom) {
            editPrefijoCustom.style.display = 'none';
            editPrefijoCustom.required = false;
            editPrefijoSelect.name = 'prefijo_telefono';
            editPrefijoCustom.name = 'prefijo_telefono_custom';
          }
        } else {
          // Si no existe, usar la opción personalizada
          editPrefijoSelect.value = 'custom';
          if (editPrefijoCustom) {
            editPrefijoCustom.style.display = 'block';
            editPrefijoCustom.required = true;
            editPrefijoCustom.value = prefijoTelefono || '+56';
            editPrefijoSelect.name = '';
            editPrefijoCustom.name = 'prefijo_telefono';
          }
        }
      }
      
      const editForm = document.getElementById('editProveedorForm');
      if (editForm) {
        editForm.action = `/proveedor/editar/${id}/`;
      }
    });
    

  }

  if (deleteProveedorModal) {
    deleteProveedorModal.addEventListener('show.bs.modal', function (event) {
      const button = event.relatedTarget;
      const id = button.getAttribute('data-id');
      const nombre = button.getAttribute('data-nombre');

      document.getElementById('delete-id').value = id;
      document.getElementById('delete-nombre').textContent = nombre;
      document.getElementById('deleteProveedorForm').action = `/proveedor/eliminar/${id}/`;
    });
    // Limpiar mensaje de error al cerrar el modal
    deleteProveedorModal.addEventListener('hidden.bs.modal', function () {
      const alertDiv = deleteProveedorModal.querySelector('.modal-alert');
      if (alertDiv) {
        alertDiv.remove();
      }
    });
    
    // Limpiar errores al cerrar el modal de edición
    editProveedorModal.addEventListener('hidden.bs.modal', function () {
      // Limpiar mensajes de error
      const alertDiv = editProveedorModal.querySelector('.modal-alert');
      if (alertDiv) alertDiv.remove();
      // Limpiar clases de error y mensajes de teléfono
      const inputs = editProveedorModal.querySelectorAll('.is-invalid');
      inputs.forEach(input => input.classList.remove('is-invalid'));
      const feedbacks = editProveedorModal.querySelectorAll('.invalid-feedback');
      feedbacks.forEach(fb => fb.remove());
      const telefonoErrors = editProveedorModal.querySelectorAll('.telefono-error');
      telefonoErrors.forEach(error => error.remove());
    });
  }
  
  // Manejar el envío del formulario de eliminación con AJAX
  
  // Manejar el envío del formulario de eliminación con AJAX
  const deleteProveedorForm = document.getElementById('deleteProveedorForm');
  if (deleteProveedorForm) {
    
    deleteProveedorForm.addEventListener('submit', function (event) {
      
      event.preventDefault();
      event.stopPropagation();
      
      const formData = new FormData(this);
      const modal = document.getElementById('deleteProveedorModal');
      const submitButton = modal.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;
      
      
      // Deshabilitar botón y mostrar loading
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Eliminando...';
      
      fetch('/proveedor/eliminar/' + formData.get('id') + '/', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': formData.get('csrfmiddlewaretoken')
        }
      })
      .then(response => {
        
        // Intentar parsear como JSON
        return response.json();
      })
      .then(data => {
        if (data) {
          
          if (data.success) {
            // Eliminación exitosa, cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteProveedorModal'));
            modal.hide();
            
            // Mostrar mensaje con botón deshacer
            mostrarMensajeConDeshacer(data.message, data.proveedor_id);
            
            // Actualizar la tabla dinámicamente
            actualizarTablaProveedores();
          } else {
            // Error
            mostrarMensajeEnModal('deleteProveedorModal', data.message, 'danger');
          }
          
          // Restaurar botón
          submitButton.disabled = false;
          submitButton.innerHTML = originalText;
        }
      })
      .catch(error => {
        console.error('Error en eliminación:', error);
        // Si hay error, recargar la página para mostrar los mensajes de Django
        window.location.reload();
      });
      
      return false;
    });
  }
  
  // Manejar el envío del formulario de editar proveedor con AJAX
  const editForm = document.getElementById('editProveedorForm');
  if (editForm) {
    
    editForm.addEventListener('submit', function (event) {
      
      event.preventDefault();
      event.stopPropagation();
      
      const formData = new FormData(this);
      const modal = document.getElementById('editProveedorModal');
      const submitButton = modal.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;
      
      
      // Deshabilitar botón y mostrar loading
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Guardando...';
      
      fetch(this.action, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': formData.get('csrfmiddlewaretoken')
        }
      })
      .then(response => {
        
        return response.json();
      })
      .then(data => {
        if (data) {
          
          if (data.success) {
            // Edición exitosa, cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProveedorModal'));
            modal.hide();
            
            // Mostrar mensaje de éxito
            mostrarMensajeEnPagina(data.message, 'success');
            
            // Actualizar la tabla dinámicamente
            actualizarTablaProveedores();
          } else {
            // Error
            mostrarMensajeEnModal('editProveedorModal', data.message, 'danger');
          }
          
          // Restaurar botón
          submitButton.disabled = false;
          submitButton.innerHTML = originalText;
        }
      })
      .catch(error => {
        console.error('Error en edición:', error);
        // Si hay error, recargar la página para mostrar los mensajes de Django
        window.location.reload();
      });
      
      return false;
    });
  }
  
  // Manejar el envío del formulario de agregar proveedor con AJAX
  const addProveedorForm = document.getElementById('addProveedorModal').querySelector('form');
  
  if (addProveedorForm) {
    
    addProveedorForm.addEventListener('submit', function (event) {
      // VALIDACIÓN DE TELÉFONO ANTES DE ENVIAR
      const telefonoInput = document.getElementById('add-telefono');
      const prefijoInput = document.getElementById('add-prefijo-telefono');
      let minLength = 8;
      if (prefijoInput.value === '+56') minLength = 9;
      if (prefijoInput.value === '+1') minLength = 10;
      const telefono = telefonoInput.value.replace(/\D/g, '');
      if (telefono.length < minLength) {
        let alertDiv = addProveedorModal.querySelector('.modal-alert');
        if (!alertDiv) {
          alertDiv = document.createElement('div');
          alertDiv.className = 'modal-alert alert alert-danger mt-3 text-center';
          const modalFooter = addProveedorModal.querySelector('.modal-footer');
          modalFooter.insertBefore(alertDiv, modalFooter.firstChild);
        }
        alertDiv.textContent = `El teléfono debe tener al menos ${minLength} dígitos para el prefijo seleccionado.`;
        alertDiv.style.display = 'block';
        telefonoInput.classList.add('is-invalid');
        event.preventDefault();
        event.stopPropagation();
        return false;
      } else {
        telefonoInput.classList.remove('is-invalid');
      }
      // --- SOLO SI LA VALIDACIÓN PASA, HACER EL AJAX ---
      event.preventDefault();
      event.stopPropagation();
      const formData = new FormData(this);
      const modal = document.getElementById('addProveedorModal');
      const submitButton = modal.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Guardando...';
      fetch(this.action, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': formData.get('csrfmiddlewaretoken')
        }
      })
      .then(response => {
        if (response.redirected || response.status === 302) {
          mostrarMensajeEnPagina("Operación completada exitosamente.", "success");
          actualizarTablaProveedores();
          return null;
        }
        return response.json();
      })
      .then(data => {
        if (data) {
          if (data.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('addProveedorModal'));
            modal.hide();
            mostrarMensajeEnPagina(data.message, 'success');
            actualizarTablaProveedores();
          } else {
            const modal = document.getElementById('addProveedorModal');
            let alertDiv = modal.querySelector('.modal-alert');
            if (!alertDiv) {
              alertDiv = document.createElement('div');
              alertDiv.className = 'modal-alert alert alert-danger mt-3 text-center';
              const modalFooter = modal.querySelector('.modal-footer');
              modalFooter.insertBefore(alertDiv, modalFooter.firstChild);
            }
            alertDiv.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>${data.message}`;
            alertDiv.style.display = 'block';
            if (data.errors) {
              Object.keys(data.errors).forEach(field => {
                const input = this.querySelector(`[name="${field}"]`);
                if (input) {
                  input.classList.add('is-invalid');
                  const errorDiv = input.parentNode.querySelector('.invalid-feedback') || 
                                  input.parentNode.appendChild(document.createElement('div'));
                  errorDiv.className = 'invalid-feedback';
                  errorDiv.textContent = data.errors[field];
                }
              });
            }
          }
          submitButton.disabled = false;
          submitButton.innerHTML = originalText;
        }
      })
      .catch(error => {
        window.location.reload();
      });
      return false;
    });
  }
  
  // Limpiar errores de validación cuando se abren los modales
  const addModal = document.getElementById('addProveedorModal');
  if (addModal) {
    addModal.addEventListener('show.bs.modal', function () {
      // Limpiar errores de validación
      const invalidFields = this.querySelectorAll('.is-invalid');
      invalidFields.forEach(field => {
        field.classList.remove('is-invalid');
      });
      
      const errorMessages = this.querySelectorAll('.invalid-feedback');
      errorMessages.forEach(error => {
        error.remove();
      });
      
      // Limpiar mensajes de error en el modal
      const modalAlerts = this.querySelectorAll('.modal-alert');
      modalAlerts.forEach(alert => {
        alert.remove();
      });
    });
  }

  const editModal = document.getElementById('editProveedorModal');
  if (editModal) {
    editModal.addEventListener('show.bs.modal', function () {
      // Limpiar errores de validación
      const invalidFields = this.querySelectorAll('.is-invalid');
      invalidFields.forEach(field => {
        field.classList.remove('is-invalid');
      });
      
      const errorMessages = this.querySelectorAll('.invalid-feedback');
      errorMessages.forEach(error => {
        error.remove();
      });
      
      // Limpiar mensajes de error en el modal
      const modalAlerts = this.querySelectorAll('.modal-alert');
      modalAlerts.forEach(alert => {
        alert.remove();
      });
    });
  }
});

// Validaciones de teléfono para modales
document.addEventListener('DOMContentLoaded', function() {
  // Manejar selects de prefijos
  const addPrefijoSelect = document.getElementById('add-prefijo-telefono');
  const addPrefijoCustom = document.getElementById('add-prefijo-custom');
  const editPrefijoSelect = document.getElementById('edit-prefijo-telefono');
  const editPrefijoCustom = document.getElementById('edit-prefijo-custom');

  // Función para manejar cambio en select de prefijo
  function handlePrefijoChange(select, customInput) {
    if (select.value === 'custom') {
      customInput.style.display = 'block';
      customInput.required = true;
      select.name = ''; // Remover el name del select
      customInput.name = 'prefijo_telefono'; // Asignar el name al input personalizado
    } else {
      customInput.style.display = 'none';
      customInput.required = false;
      select.name = 'prefijo_telefono'; // Restaurar el name del select
      customInput.name = 'prefijo_telefono_custom'; // Quitar el name del input personalizado
    }
    
    // Actualizar placeholder del teléfono según el prefijo seleccionado
    const form = select.closest('form');
    const telefonoInput = form.querySelector('input[id*="telefono"]');
    
    if (telefonoInput) {
      const prefijo = select.value;
      const placeholders = {
        '+56': '912345678',      // Chile
        '+1': '5551234567',      // Estados Unidos/Canadá
        '+52': '5512345678',     // México
        '+57': '3001234567',     // Colombia
        '+54': '91123456789',    // Argentina
        '+51': '912345678',      // Perú
        '+58': '4121234567',     // Venezuela
        '+593': '912345678',     // Ecuador
        '+591': '71234567',      // Bolivia
        '+595': '981234567',     // Paraguay
        '+598': '91234567',      // Uruguay
        '+34': '612345678',      // España
        '+33': '612345678',      // Francia
        '+49': '30123456789',    // Alemania
        '+39': '3123456789',     // Italia
        '+44': '7123456789',     // Reino Unido
        '+81': '9012345678',     // Japón
        '+86': '13812345678',    // China
        '+91': '9876543210',     // India
        '+55': '11987654321'     // Brasil
      };
      
      telefonoInput.placeholder = placeholders[prefijo] || '123456789';
      
      // Limpiar completamente el campo y errores al cambiar prefijo
      telefonoInput.value = '';
      telefonoInput.classList.remove('is-invalid');
      const errorDiv = telefonoInput.parentNode.querySelector('.telefono-error');
      if (errorDiv) {
        errorDiv.remove();
      }
    }
  }

  // Event listeners para selects de prefijos
  if (addPrefijoSelect && addPrefijoCustom) {
    addPrefijoSelect.addEventListener('change', function() {
      handlePrefijoChange(this, addPrefijoCustom);
    });
    
    // Event listener para el input personalizado
    addPrefijoCustom.addEventListener('input', function() {
      const form = this.closest('form');
      const telefonoInput = form.querySelector('input[id*="telefono"]');
      
      if (telefonoInput && this.value.trim()) {
        // Validar el teléfono actual si tiene contenido
        if (telefonoInput.value.trim()) {
          validarTelefono(telefonoInput);
        }
      }
    });
  }

  if (editPrefijoSelect && editPrefijoCustom) {
    editPrefijoSelect.addEventListener('change', function() {
      handlePrefijoChange(this, editPrefijoCustom);
    });
    
    // Event listener para el input personalizado
    editPrefijoCustom.addEventListener('input', function() {
      const form = this.closest('form');
      const telefonoInput = form.querySelector('input[id*="telefono"]');
      
      if (telefonoInput && this.value.trim()) {
        // Validar el teléfono actual si tiene contenido
        if (telefonoInput.value.trim()) {
          validarTelefono(telefonoInput);
        }
      }
    });
  }

  // Función para validar teléfono
  function validarTelefono(input) {
    // Obtener el prefijo seleccionado
    const form = input.closest('form');
    const prefijoSelect = form.querySelector('select[id*="prefijo-telefono"]');
    const prefijoCustom = form.querySelector('input[id*="prefijo-custom"]');
    
    let prefijo = '';
    if (prefijoSelect && prefijoSelect.value !== 'custom') {
      prefijo = prefijoSelect.value;
    } else if (prefijoCustom && prefijoCustom.style.display !== 'none') {
      prefijo = prefijoCustom.value;
    }
    
    // Remover cualquier carácter que no sea número
    let value = input.value.replace(/[^0-9]/g, '');
    
    // Definir límites de dígitos según el prefijo
    const limitesDigitos = {
      '+56': 9,    // Chile: 9 dígitos
      '+1': 10,    // Estados Unidos/Canadá: 10 dígitos
      '+52': 10,   // México: 10 dígitos
      '+57': 10,   // Colombia: 10 dígitos
      '+54': 10,   // Argentina: 10 dígitos
      '+51': 9,    // Perú: 9 dígitos
      '+58': 10,   // Venezuela: 10 dígitos
      '+593': 9,   // Ecuador: 9 dígitos
      '+591': 8,   // Bolivia: 8 dígitos
      '+595': 9,   // Paraguay: 9 dígitos
      '+598': 8,   // Uruguay: 8 dígitos
      '+34': 9,    // España: 9 dígitos
      '+33': 9,    // Francia: 9 dígitos
      '+49': 10,   // Alemania: 10 dígitos
      '+39': 10,   // Italia: 10 dígitos
      '+44': 10,   // Reino Unido: 10 dígitos
      '+81': 10,   // Japón: 10 dígitos
      '+86': 11,   // China: 11 dígitos
      '+91': 10,   // India: 10 dígitos
      '+55': 11    // Brasil: 11 dígitos
    };
    
    // Obtener el límite de dígitos para el prefijo seleccionado
    const limiteDigitos = limitesDigitos[prefijo] || 15; // 15 como límite general
    
    // Limitar a la cantidad máxima de dígitos permitidos
    if (value.length > limiteDigitos) {
      value = value.substring(0, limiteDigitos);
    }
    
    input.value = value;
    
    // Limpiar estado de error anterior
    input.classList.remove('is-invalid');
    const errorDiv = input.parentNode.querySelector('.telefono-error');
    if (errorDiv) {
      errorDiv.remove();
    }
    
    // Validar según el prefijo
    if (value.length > 0) {
      let mensajeError = '';
      let esValido = true;
      
      if (prefijo === '+56') {
        // Validación específica para Chile
        if (value.length !== 9) {
          mensajeError = 'El teléfono en Chile debe tener exactamente 9 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+1') {
        // Validación para Estados Unidos/Canadá
        if (value.length !== 10) {
          mensajeError = 'El teléfono en Estados Unidos/Canadá debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+52') {
        // Validación para México
        if (value.length !== 10) {
          mensajeError = 'El teléfono en México debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+57') {
        // Validación para Colombia
        if (value.length !== 10) {
          mensajeError = 'El teléfono en Colombia debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+54') {
        // Validación para Argentina
        if (value.length !== 10) {
          mensajeError = 'El teléfono en Argentina debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+51') {
        // Validación para Perú
        if (value.length !== 9) {
          mensajeError = 'El teléfono en Perú debe tener exactamente 9 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+58') {
        // Validación para Venezuela
        if (value.length !== 10) {
          mensajeError = 'El teléfono en Venezuela debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+593') {
        // Validación para Ecuador
        if (value.length !== 9) {
          mensajeError = 'El teléfono en Ecuador debe tener exactamente 9 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+591') {
        // Validación para Bolivia
        if (value.length !== 8) {
          mensajeError = 'El teléfono en Bolivia debe tener exactamente 8 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+595') {
        // Validación para Paraguay
        if (value.length !== 9) {
          mensajeError = 'El teléfono en Paraguay debe tener exactamente 9 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+598') {
        // Validación para Uruguay
        if (value.length !== 8) {
          mensajeError = 'El teléfono en Uruguay debe tener exactamente 8 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+34') {
        // Validación para España
        if (value.length !== 9) {
          mensajeError = 'El teléfono en España debe tener exactamente 9 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+33') {
        // Validación para Francia
        if (value.length !== 9) {
          mensajeError = 'El teléfono en Francia debe tener exactamente 9 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+49') {
        // Validación para Alemania
        if (value.length !== 10) {
          mensajeError = 'El teléfono en Alemania debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+39') {
        // Validación para Italia
        if (value.length !== 10) {
          mensajeError = 'El teléfono en Italia debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+44') {
        // Validación para Reino Unido
        if (value.length !== 10) {
          mensajeError = 'El teléfono en Reino Unido debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+81') {
        // Validación para Japón
        if (value.length !== 10) {
          mensajeError = 'El teléfono en Japón debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+86') {
        // Validación para China
        if (value.length !== 11) {
          mensajeError = 'El teléfono en China debe tener exactamente 11 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+91') {
        // Validación para India
        if (value.length !== 10) {
          mensajeError = 'El teléfono en India debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+55') {
        // Validación para Brasil
        if (value.length !== 11) {
          mensajeError = 'El teléfono en Brasil debe tener exactamente 11 dígitos';
          esValido = false;
        }
      } else {
        // Validación general para otros prefijos
        if (value.length < 7) {
          mensajeError = 'El teléfono debe tener al menos 7 dígitos';
          esValido = false;
        }
      }
      
      // Mostrar mensaje de error si no es válido
      if (!esValido) {
        const errorElement = document.createElement('div');
        errorElement.className = 'text-danger small telefono-error mt-1';
        errorElement.textContent = mensajeError;
        input.parentNode.appendChild(errorElement);
        input.classList.add('is-invalid');
      } else {
        input.classList.remove('is-invalid');
      }
    }
  }

  // Validar al enviar formulario
  function validarFormularioTelefono(form, telefonoInput) {
    const telefonoValue = telefonoInput.value.trim();
    
    // Remover mensajes de error anteriores
    const existingError = form.querySelector('.modal-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Obtener el prefijo seleccionado
    const prefijoSelect = form.querySelector('select[id*="prefijo-telefono"]');
    const prefijoCustom = form.querySelector('input[id*="prefijo-custom"]');
    
    let prefijo = '';
    if (prefijoSelect && prefijoSelect.value !== 'custom') {
      prefijo = prefijoSelect.value;
    } else if (prefijoCustom && prefijoCustom.style.display !== 'none') {
      prefijo = prefijoCustom.value;
    }
    
    // Validar según el prefijo
    if (telefonoValue.length > 0) {
      let mensajeError = '';
      let esValido = true;
      
      if (prefijo === '+56') {
        // Validación específica para Chile
        if (telefonoValue.length !== 9) {
          // mensajeError = 'El teléfono en Chile debe tener exactamente 9 dígitos';
          esValido = false;
        } else if (!telefonoValue.startsWith('9')) {
          // mensajeError = 'Los números de teléfono en Chile deben comenzar con 9 o 2';
          esValido = false;
        }
      } else if (prefijo === '+1') {
        // Validación para Estados Unidos/Canadá
        if (telefonoValue.length !== 10) {
          mensajeError = 'El teléfono en Estados Unidos/Canadá debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+52') {
        // Validación para México
        if (telefonoValue.length !== 10) {
          mensajeError = 'El teléfono en México debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+57') {
        // Validación para Colombia
        if (telefonoValue.length !== 10) {
          mensajeError = 'El teléfono en Colombia debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+54') {
        // Validación para Argentina
        if (telefonoValue.length !== 10) {
          mensajeError = 'El teléfono en Argentina debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+51') {
        // Validación para Perú
        if (telefonoValue.length !== 9) {
          mensajeError = 'El teléfono en Perú debe tener exactamente 9 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+58') {
        // Validación para Venezuela
        if (telefonoValue.length !== 10) {
          mensajeError = 'El teléfono en Venezuela debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+593') {
        // Validación para Ecuador
        if (telefonoValue.length !== 9) {
          mensajeError = 'El teléfono en Ecuador debe tener exactamente 9 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+591') {
        // Validación para Bolivia
        if (telefonoValue.length !== 8) {
          mensajeError = 'El teléfono en Bolivia debe tener exactamente 8 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+595') {
        // Validación para Paraguay
        if (telefonoValue.length !== 9) {
          mensajeError = 'El teléfono en Paraguay debe tener exactamente 9 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+598') {
        // Validación para Uruguay
        if (telefonoValue.length !== 8) {
          mensajeError = 'El teléfono en Uruguay debe tener exactamente 8 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+34') {
        // Validación para España
        if (telefonoValue.length !== 9) {
          mensajeError = 'El teléfono en España debe tener exactamente 9 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+33') {
        // Validación para Francia
        if (telefonoValue.length !== 9) {
          mensajeError = 'El teléfono en Francia debe tener exactamente 9 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+49') {
        // Validación para Alemania
        if (telefonoValue.length !== 10) {
          mensajeError = 'El teléfono en Alemania debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+39') {
        // Validación para Italia
        if (telefonoValue.length !== 10) {
          mensajeError = 'El teléfono en Italia debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+44') {
        // Validación para Reino Unido
        if (telefonoValue.length !== 10) {
          mensajeError = 'El teléfono en Reino Unido debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+81') {
        // Validación para Japón
        if (telefonoValue.length !== 10) {
          mensajeError = 'El teléfono en Japón debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+86') {
        // Validación para China
        if (telefonoValue.length !== 11) {
          mensajeError = 'El teléfono en China debe tener exactamente 11 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+91') {
        // Validación para India
        if (telefonoValue.length !== 10) {
          mensajeError = 'El teléfono en India debe tener exactamente 10 dígitos';
          esValido = false;
        }
      } else if (prefijo === '+55') {
        // Validación para Brasil
        if (telefonoValue.length !== 11) {
          mensajeError = 'El teléfono en Brasil debe tener exactamente 11 dígitos';
          esValido = false;
        }
      } else {
        // Validación general para otros prefijos
        if (telefonoValue.length < 7) {
          mensajeError = 'El teléfono debe tener al menos 7 dígitos';
          esValido = false;
        }
      }
      
      // Validar que solo contenga números
      if (telefonoValue.length > 0 && !/^[0-9]+$/.test(telefonoValue)) {
        mensajeError = 'El teléfono solo debe contener números';
        esValido = false;
      }
      
      // Mostrar mensaje de error solo si hay mensaje
      if (!esValido && mensajeError) {
        // Crear mensaje de error debajo del campo
        const errorElement = document.createElement('div');
        errorElement.className = 'text-danger small telefono-error mt-1';
        errorElement.textContent = mensajeError;
        telefonoInput.parentNode.appendChild(errorElement);
        telefonoInput.focus();
        return false;
      }
    }
    
    return true;
  }

  // Validación en tiempo real mientras se escribe (sin borde rojo)
  function validarTelefonoInputSinRojo(input) {
    // Obtener el prefijo seleccionado
    const form = input.closest('form');
    const prefijoSelect = form.querySelector('select[id*="prefijo-telefono"]');
    const prefijoCustom = form.querySelector('input[id*="prefijo-custom"]');
    let prefijo = '';
    if (prefijoSelect && prefijoSelect.value !== 'custom') {
      prefijo = prefijoSelect.value;
    } else if (prefijoCustom && prefijoCustom.style.display !== 'none') {
      prefijo = prefijoCustom.value;
    }
    // Limitar la cantidad de dígitos según el prefijo
    const limitesDigitos = {
      '+56': 9, '+1': 10, '+52': 10, '+57': 10, '+54': 10, '+51': 9, '+58': 10, '+593': 9, '+591': 8, '+595': 9, '+598': 8, '+34': 9, '+33': 9, '+49': 10, '+39': 10, '+44': 10, '+81': 10, '+86': 11, '+91': 10, '+55': 11
    };
    const limiteDigitos = limitesDigitos[prefijo] || 15;
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > limiteDigitos) {
      value = value.substring(0, limiteDigitos);
    }
    input.value = value;
    // Remover mensaje de error anterior
    const errorDiv = input.parentNode.querySelector('.telefono-error');
    if (errorDiv) errorDiv.remove();
    // Validar y mostrar mensaje (sin borde rojo)
    let mensajeError = '';
    if (prefijo === '+56') {
      if (value.length > 0 && value.length !== 9) {
        mensajeError = 'El teléfono en Chile debe tener exactamente 9 dígitos';
      } else if (value.length === 9 && !value.startsWith('9')) {
        // mensajeError = 'Los números de teléfono en Chile deben comenzar con 9 o 2';
      }
    } else if (value.length > 0 && value.length < limiteDigitos) {
      mensajeError = `El teléfono debe tener ${limiteDigitos} dígitos para el prefijo seleccionado.`;
    }
    if (mensajeError) {
      const errorElement = document.createElement('div');
      errorElement.className = 'text-danger small telefono-error mt-1';
      errorElement.textContent = mensajeError;
      input.parentNode.appendChild(errorElement);
    }
  }

  // Aplicar validaciones a campos de teléfono en modales
  const addTelefonoField = document.getElementById('add-telefono');
  const editTelefonoField = document.getElementById('edit-telefono');

  if (addTelefonoField) {
    // Limpiar errores mientras escribe
    addTelefonoField.addEventListener('input', function() {
      this.classList.remove('is-invalid');
      const errorDiv = this.parentNode.querySelector('.telefono-error, .modal-error');
      if (errorDiv) errorDiv.remove();
      validarTelefonoInputSinRojo(this);
    });
    const addForm = addTelefonoField.closest('form');
    if (addForm) {
      addForm.addEventListener('submit', function(e) {
        if (!validarFormularioTelefono(this, addTelefonoField)) {
          addTelefonoField.classList.add('is-invalid');
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      });
    }
  }

  if (editTelefonoField) {
    // Limpiar errores mientras escribe
    editTelefonoField.addEventListener('input', function() {
      this.classList.remove('is-invalid');
      const errorDiv = this.parentNode.querySelector('.telefono-error, .modal-error');
      if (errorDiv) errorDiv.remove();
      validarTelefonoInputSinRojo(this);
    });
    const editForm = editTelefonoField.closest('form');
    if (editForm) {
      editForm.addEventListener('submit', function(e) {
        if (!validarFormularioTelefono(this, editTelefonoField)) {
          editTelefonoField.classList.add('is-invalid');
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      });
    }
  }
});

// Validación y limpieza para el modal de agregar proveedor
const addProveedorModal = document.getElementById('addProveedorModal');
const addProveedorForm = document.getElementById('addProveedorForm');
if (addProveedorModal && addProveedorForm) {
  // Limpiar formulario y mensajes al cerrar el modal
  addProveedorModal.addEventListener('hidden.bs.modal', function () {
    addProveedorForm.reset();
    // Limpiar mensajes de error
    const alertDiv = addProveedorModal.querySelector('.modal-alert');
    if (alertDiv) alertDiv.remove();
    // Limpiar clases de error y mensajes de teléfono
    const inputs = addProveedorModal.querySelectorAll('.is-invalid');
    inputs.forEach(input => input.classList.remove('is-invalid'));
    const feedbacks = addProveedorModal.querySelectorAll('.invalid-feedback');
    feedbacks.forEach(fb => fb.remove());
    const telefonoErrors = addProveedorModal.querySelectorAll('.telefono-error');
    telefonoErrors.forEach(error => error.remove());
  });

}

// Función para mostrar mensajes en modales
function mostrarMensajeEnModal(modalId, mensaje, tipo) {
  
  const modal = document.getElementById(modalId);
  let alertDiv = modal.querySelector('.modal-alert');
  // Crear div de alerta si no existe
  if (!alertDiv) {
    alertDiv = document.createElement('div');
    alertDiv.className = 'modal-alert alert mt-3';
    alertDiv.style.display = 'none';
    // Insertar al inicio del modal-footer (arriba de los botones)
    const modalFooter = modal.querySelector('.modal-footer');
    modalFooter.insertBefore(alertDiv, modalFooter.firstChild);
  }
  // Configurar el mensaje
  alertDiv.className = `modal-alert alert alert-${tipo} mt-3 text-center`;
  // Icono según el tipo
  let icon = 'bi-exclamation-triangle';
  if (tipo === 'success') {
    icon = 'bi-check-circle';
  } else if (tipo === 'info') {
    icon = 'bi-info-circle';
  }
  alertDiv.innerHTML = `\n    <i class="bi ${icon} me-2"></i>\n    ${mensaje}\n  `;
  alertDiv.style.display = 'block';
  // Auto-ocultar mensajes de error después de 5 segundos
  if (tipo === 'danger' || tipo === 'warning') {
    setTimeout(() => {
      alertDiv.style.display = 'none';
    }, 5000);
  }
}

// Función para mostrar notificaciones push modernas
function mostrarMensajeEnPagina(mensaje, tipo) {
  
  // Crear el contenedor de notificaciones si no existe
  let notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 350px;
    `;
    document.body.appendChild(notificationContainer);
  }
  
  // Crear la notificación
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
    background: ${tipo === 'danger' ? '#dc3545' : '#198754'};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(400px);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    position: relative;
    overflow: hidden;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
  `;
  
  // Agregar barra de progreso
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: rgba(255,255,255,0.3);
    width: 100%;
    transform: scaleX(1);
    transform-origin: left;
    transition: transform 3s linear;
  `;
  
  notification.appendChild(progressBar);
  
  // Contenido de la notificación
  notification.innerHTML += `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="flex: 1;">
        <div style="font-size: 16px; font-weight: 600; text-align: center;">
          ${mensaje}
        </div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; margin-left: 12px; opacity: 0.7; transition: opacity 0.2s;">
        ×
      </button>
    </div>
  `;
  
  // Agregar la notificación al contenedor
  notificationContainer.appendChild(notification);
  
  // Animar entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Animar barra de progreso
  setTimeout(() => {
    progressBar.style.transform = 'scaleX(0)';
  }, 100);
  
  // Auto-remover después de 3 segundos
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }, 3000);
  
  // Efecto hover
  notification.addEventListener('mouseenter', () => {
    notification.style.transform = 'translateX(0) scale(1.02)';
    progressBar.style.transition = 'none';
  });
  
  notification.addEventListener('mouseleave', () => {
    notification.style.transform = 'translateX(0) scale(1)';
    progressBar.style.transition = 'transform 3s linear';
  });
}

// Función para mostrar mensaje con botón deshacer
function mostrarMensajeConDeshacer(mensaje, proveedorId) {
  
  // Crear el contenedor de notificaciones si no existe
  let notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 350px;
    `;
    document.body.appendChild(notificationContainer);
  }
  
  // Crear la notificación con botón deshacer
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
    background: #dc3545;
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(400px);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    position: relative;
    overflow: hidden;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
  `;
  
  // Agregar barra de progreso
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: rgba(255,255,255,0.3);
    width: 100%;
    transform: scaleX(1);
    transform-origin: left;
    transition: transform 10s linear;
  `;
  
  notification.appendChild(progressBar);
  
  // Contenido de la notificación con botón deshacer
  notification.innerHTML += `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="flex: 1;">
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; text-align: center;">
          ${mensaje}
        </div>
        <div style="text-align: center;">
          <button id="btnDeshacerEliminacion" 
                  onclick="restaurarProveedor(${proveedorId}, this)" 
                  style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s; font-weight: 500;">
            Deshacer
          </button>
        </div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; margin-left: 12px; opacity: 0.7; transition: opacity 0.2s;">
        ×
      </button>
    </div>
  `;
  
  // Agregar la notificación al contenedor
  notificationContainer.appendChild(notification);
  
  // Animar entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Animar barra de progreso
  setTimeout(() => {
    progressBar.style.transform = 'scaleX(0)';
  }, 100);
  
  // Auto-remover después de 10 segundos
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }, 10000);
  
  // Efecto hover
  notification.addEventListener('mouseenter', () => {
    notification.style.transform = 'translateX(0) scale(1.02)';
    progressBar.style.transition = 'none';
  });
  
  notification.addEventListener('mouseleave', () => {
    notification.style.transform = 'translateX(0) scale(1)';
    progressBar.style.transition = 'transform 10s linear';
  });
}

// Función para restaurar proveedor
function restaurarProveedor(proveedorId, button) {
  
  // Deshabilitar botón
  button.disabled = true;
  button.textContent = 'Restaurando...';
  button.style.opacity = '0.7';
  
  // Enviar petición para restaurar
  fetch(`/proveedor/restaurar/${proveedorId}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Mostrar mensaje de éxito
      mostrarMensajeEnPagina(data.message, 'success');
      
      // Actualizar tabla
      actualizarTablaProveedores();
      
      // Remover la notificación de eliminación
      const notification = button.closest('.notification');
      if (notification) {
        notification.remove();
      }
    } else {
      // Mostrar error
      alert('Error al restaurar el proveedor: ' + data.message);
      
      // Restaurar botón
      button.disabled = false;
      button.textContent = 'Deshacer';
      button.style.opacity = '1';
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error al restaurar el proveedor');
    
    // Restaurar botón
    button.disabled = false;
    button.textContent = 'Deshacer';
    button.style.opacity = '1';
  });
}

// Función para actualizar la tabla de proveedores dinámicamente
function actualizarTablaProveedores() {
  
  // Obtener los datos actualizados de la tabla
  fetch(window.location.href)
    .then(response => response.text())
    .then(html => {
      
      // Crear un elemento temporal para parsear el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Verificar si hay proveedores en la nueva respuesta
      const nuevaTabla = doc.querySelector('.table-responsive');
      const nuevoCardTabla = doc.querySelector('.card.shadow-lg.border-0.mb-4');
      const nuevoMensaje = doc.querySelector('.alert-info');
      const cardActual = document.querySelector('.card.shadow-lg.border-0.mb-4');
      const cardMensaje = document.querySelector('.card.shadow-lg.border-0:not(.mb-4)');
      
      
      if (nuevaTabla && cardActual) {
        // Hay proveedores, actualizar la tabla
        const tablaActual = cardActual.querySelector('.table-responsive');
        
        if (tablaActual) {
          
          tablaActual.innerHTML = nuevaTabla.innerHTML;
          
          // Reinicializar DataTable
          if ($.fn.DataTable.isDataTable('.datatable')) {
            $('.datatable').DataTable().destroy();
          }
          

          
          // Reinicializar DataTable con las mismas opciones
          $('.datatable').DataTable({
            language: {
              info: "Mostrando _START_ de _END_ | Total _TOTAL_ proveedor(es)",
              infoEmpty: "Sin proveedores para mostrar",
              lengthMenu: "Mostrar _MENU_ proveedores",
              search: "🔍 Buscar:",
              zeroRecords: "No se encontraron resultados.",
              infoFiltered: "(filtrado de un total de _MAX_ proveedor(es))",
              paginate: {
                first: '',
                last: '',
                next: '',
                previous: ''
              }
            },
            dom: 'lrtip',
            pageLength: 10,
            lengthMenu: [5, 10, 15, 25],
            columnDefs: [
              { orderable: false, targets: [1,2,7] }
            ],
            pagingType: 'full_numbers',
          });
          

          
        }
      } else if (nuevoMensaje && cardActual) {
        // No hay proveedores, mostrar mensaje
        
        cardActual.remove();
        
        const nuevoCard = document.createElement('div');
        nuevoCard.className = 'card shadow-lg border-0';
        nuevoCard.innerHTML = `
          <div class="card-body text-center px-4 py-4">
            <div class="alert alert-info mb-0">No hay proveedores registrados.</div>
          </div>
        `;
        
        document.querySelector('.action-bar').parentNode.insertBefore(nuevoCard, document.querySelector('.action-bar').nextSibling);
        
      } else if (nuevoCardTabla && cardMensaje) {
        // Ahora hay proveedores, reemplazar mensaje con tabla
        
        cardMensaje.remove();
        
        const nuevoCard = document.createElement('div');
        nuevoCard.className = 'card shadow-lg border-0 mb-4';
        nuevoCard.innerHTML = nuevoCardTabla.innerHTML;
        
        document.querySelector('.action-bar').parentNode.insertBefore(nuevoCard, document.querySelector('.action-bar').nextSibling);
        

        
        // Reinicializar DataTable
        $('.datatable').DataTable({
          language: {
            info: "Mostrando _START_ de _END_ | Total _TOTAL_ proveedor(es)",
            infoEmpty: "Sin proveedores para mostrar",
            lengthMenu: "Mostrar _MENU_ proveedores",
            search: "🔍 Buscar:",
            zeroRecords: "No se encontraron resultados.",
            infoFiltered: "(filtrado de un total de _MAX_ proveedor(es))",
            paginate: {
              first: '',
              last: '',
              next: '',
              previous: ''
            }
          },
          dom: 'lrtip',
          pageLength: 10,
          lengthMenu: [5, 10, 15, 25],
          columnDefs: [
            { orderable: false, targets: [1,2,7] }
          ],
          pagingType: 'full_numbers',
        });
        

        
      }
    })
    .catch(error => {
      console.error('Error al actualizar tabla:', error);
    });
}

$(document).ready(function () {
  const table = $('.datatable').DataTable({
    language: {
      info: "Mostrando _START_ de _END_ | Total _TOTAL_ proveedor(es)",
      infoEmpty: "Sin proveedores para mostrar",
      lengthMenu: "Mostrar _MENU_ proveedores",
      search: "🔍 Buscar:",
      zeroRecords: "No se encontraron resultados.",
      infoFiltered: "(filtrado de un total de _MAX_ proveedor(es))",
      paginate: {
        first: '',
        last: '',
        next: '',
        previous: ''
      }
    },
    dom: 'lrtip',
    pageLength: 10,
    lengthMenu: [5, 10, 15, 25],
    columnDefs: [
      { orderable: false, targets: [1,2,7] }
    ],
    pagingType: 'full_numbers',
  });

  $('#searchProveedores').on('keyup', function () {
    const val = this.value;
    table.search(val).draw();
  });
});

// Configuración global para la paginación de DataTables
$.fn.DataTable.ext.pager.numbers_length = 5;
