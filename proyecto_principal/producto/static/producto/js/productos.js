

// Abrir modal Añadir producto con botón
document.getElementById('addProductoBtn').addEventListener('click', () => {
  const addModal = new bootstrap.Modal(document.getElementById('addProductModal'));
  addModal.show();
});

let scannedCode = '';
let scanActive = false;
let scanMode = '';  // 'add' o 'search'

const scanModalEl = document.getElementById('scanCodeModal');
const scanModal = new bootstrap.Modal(scanModalEl);
const scanOptions = document.getElementById('scanOptions');
const scanCodeUI = document.getElementById('scanCodeUI');
const scanMsg = document.getElementById('scanMessage');
const searchInput = document.getElementById('searchProductos');

document.getElementById('scanCodeBtn').addEventListener('click', () => {
  scannedCode = '';
  scanActive = false;
  scanMode = '';
  scanMsg.style.display = 'none';
  scanMsg.textContent = '';

  scanOptions.style.display = 'block';
  scanCodeUI.style.display = 'none';

  scanModal.show();
});

document.getElementById('btnAddScan').addEventListener('click', () => {
  startScan('add');
});

document.getElementById('btnSearchScan').addEventListener('click', () => {
  startScan('search');
});

function startScan(mode) {
  scanMode = mode;
  scannedCode = '';
  scanActive = true;

  scanOptions.style.display = 'none';
  scanCodeUI.style.display = 'block';
  scanMsg.style.display = 'none';
  scanMsg.textContent = '';

  window.addEventListener('keydown', handleScan);

  scanModalEl.addEventListener('hidden.bs.modal', () => {
    scanActive = false;
    scanMode = '';
    window.removeEventListener('keydown', handleScan);
  }, { once: true });
}

function handleScan(e) {
  if (!scanActive) return;

  if (e.key === 'Enter') {
    if (scannedCode.trim() !== '') {
      e.preventDefault();

      if (scanMode === 'add') {
        $.ajax({
          url: validarCodigoUrl,
          data: { codigo: scannedCode.trim() },
          success: function(response) {
            if (response.existe) {
              scanMsg.textContent = "⚠️ El código ya existe en la base de datos.";
              scanMsg.style.display = 'block';
              scannedCode = '';
            } else {
              scanModal.hide();
              scanActive = false;
              window.removeEventListener('keydown', handleScan);

              // Abrir el modal y esperar a que esté completamente visible para asignar el código
              const addProductModalEl = document.getElementById('addProductModal');
              const addModal = new bootstrap.Modal(addProductModalEl);
              addModal.show();
              // Esperar a que el modal esté completamente abierto
              addProductModalEl.addEventListener('shown.bs.modal', function handler() {
                document.getElementById('add-codigo').value = scannedCode.trim();
                // Remover el event listener para evitar duplicados
                addProductModalEl.removeEventListener('shown.bs.modal', handler);
              });
            }
          },
          error: function() {
            alert("Error al validar el código. Intenta nuevamente.");
          }
        });
      } else if (scanMode === 'search') {
        scanModal.hide();
        scanActive = false;
        window.removeEventListener('keydown', handleScan);

        searchInput.value = scannedCode.trim();
        searchInput.dispatchEvent(new Event('input'));
      }
    }
  } else {
    if (
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.metaKey &&
      e.key !== 'Shift'
    ) {
      scannedCode += e.key;
    }
  }
}

// Modales edición y eliminación
const editProductModal = document.getElementById('editProductModal');
const deleteProductModal = document.getElementById('deleteProductModal');

editProductModal.addEventListener('show.bs.modal', function (event) {
  // Limpiar mensajes y validaciones
  const alertDiv = this.querySelector('.modal-alert');
  if (alertDiv) alertDiv.style.display = 'none';
  
  // Limpiar clases de validación
  const inputs = this.querySelectorAll('.form-control');
  inputs.forEach(input => {
    input.classList.remove('is-invalid', 'is-valid');
  });
  
  // Limpiar mensajes de error
  const errorDivs = this.querySelectorAll('.invalid-feedback');
  errorDivs.forEach(div => {
    div.textContent = '';
  });

  // Inicializar autocompletado de categorías para el modal de editar
  setTimeout(() => {
    inicializarAutocompletadoCategorias();
  }, 100);

  // Llenar datos del modal si hay un botón relacionado
  if (event.relatedTarget) {
    const button = event.relatedTarget;
    const id = button.getAttribute('data-id');
    const nombre = button.getAttribute('data-nombre');
    const marca = button.getAttribute('data-marca');
    const categoria = button.getAttribute('data-categoria');
    const descripcion = button.getAttribute('data-descripcion');
    const precio = button.getAttribute('data-precio');
    const stock = button.getAttribute('data-stock');
    const stockmin = button.getAttribute('data-stockmin');
    const codigo = button.getAttribute('data-codigo');

    document.getElementById('edit-id').value = id;
    document.getElementById('edit-nombre').value = nombre;
    document.getElementById('edit-marca').value = marca;
    
    // Manejar categoría con autocompletado
    const editCategoriaInput = document.getElementById('edit-categoria');
    const editCategoriaHidden = document.getElementById('edit-categoria-hidden');
    if (editCategoriaInput && editCategoriaHidden) {
      if (categoria) {
        // Si hay categoría, buscar su ID para el campo hidden
        fetch(`/producto/autocomplete_categorias/?q=${encodeURIComponent(categoria)}`)
          .then(res => res.json())
          .then(data => {
            const categorias = data.results || [];
            if (categorias.length > 0) {
              editCategoriaInput.value = categorias[0].nombre;
              editCategoriaHidden.value = categorias[0].id;
            } else {
              // Si no se encuentra, mostrar el nombre pero dejar el hidden vacío
              editCategoriaInput.value = categoria;
              editCategoriaHidden.value = '';
            }
          })
          .catch(error => {
            console.error('Error al obtener ID de categoría:', error);
            // En caso de error, mostrar el nombre pero dejar el hidden vacío
            editCategoriaInput.value = categoria;
            editCategoriaHidden.value = '';
          });
      } else {
        editCategoriaInput.value = '';
        editCategoriaHidden.value = '';
      }
    }
    
    document.getElementById('edit-descripcion').value = descripcion;
    document.getElementById('edit-precio').value = Math.round(precio);
    document.getElementById('edit-stock').value = stock;
    document.getElementById('edit-stockmin').value = stockmin;
    document.getElementById('edit-codigo').value = codigo;

    document.getElementById('editProductForm').action = `/producto/editar/${id}/`;
  }
});

// Corregir problema de accesibilidad al cerrar modal de editar
editProductModal.addEventListener('hidden.bs.modal', function() {
  // Remover aria-hidden cuando el modal se cierra
  this.removeAttribute('aria-hidden');
  
  // Asegurar que el foco vuelva al botón que abrió el modal
  const triggerButton = document.querySelector('[data-bs-target="#editProductModal"]');
  if (triggerButton) {
    triggerButton.focus();
  }
});

deleteProductModal.addEventListener('show.bs.modal', function (event) {
  const button = event.relatedTarget;
  const id = button.getAttribute('data-id');
  const nombre = button.getAttribute('data-nombre');

  document.getElementById('delete-id').value = id;
  document.getElementById('delete-product-name').textContent = nombre;
  document.getElementById('deleteProductForm').action = `/producto/eliminar/${id}/`;
});

// Corregir problema de accesibilidad al cerrar modal de eliminar
deleteProductModal.addEventListener('hidden.bs.modal', function() {
  // Remover aria-hidden cuando el modal se cierra
  this.removeAttribute('aria-hidden');
  
  // Asegurar que el foco vuelva al botón que abrió el modal
  const triggerButton = document.querySelector('[data-bs-target="#deleteProductModal"]');
  if (triggerButton) {
    triggerButton.focus();
  }
});

// Manejar todos los formularios con AJAX
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded iniciado');
  
  // Manejar el envío del formulario de eliminación con AJAX
  const deleteProductForm = document.getElementById('deleteProductForm');
  if (deleteProductForm) {
    console.log('Formulario de eliminación encontrado');
    
    deleteProductForm.addEventListener('submit', function (event) {
      console.log('Formulario de eliminación enviado, previniendo envío normal');
      event.preventDefault();
      event.stopPropagation();
      
      const formData = new FormData(this);
      const modal = document.getElementById('deleteProductModal');
      const submitButton = modal.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;
      
      console.log('ID del producto a eliminar:', formData.get('id'));
      
      // Deshabilitar botón y mostrar loading
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Eliminando...';
      
      fetch('/producto/eliminar/' + formData.get('id') + '/', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': formData.get('csrfmiddlewaretoken')
        }
      })
      .then(response => {
        console.log('Respuesta de eliminación recibida:', response);
        // Intentar parsear como JSON
        return response.json();
      })
      .then(data => {
        if (data) {
          console.log('Datos de eliminación recibidos:', data);
          
          if (data.success) {
            // Eliminación exitosa, cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteProductModal'));
            modal.hide();
            
            // Mostrar mensaje con botón deshacer
            mostrarMensajeConDeshacer(data.message, data.producto_id);
            
            // Actualizar la tabla dinámicamente
            actualizarTablaProductos();
          } else {
            // Error
            mostrarMensajeEnModal('deleteProductModal', data.message, 'danger');
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
  } else {
    console.log('Formulario de eliminación NO encontrado');
  }
  
  // Manejar el envío del formulario de agregar producto con AJAX
  const addProductForm = document.getElementById('addProductModal').querySelector('form');
  console.log('Buscando formulario de agregar:', addProductForm);
  
  if (addProductForm) {
    console.log('Formulario de agregar encontrado, agregando event listener');
    
    addProductForm.addEventListener('submit', function (event) {
      console.log('Formulario de agregar enviado, previniendo envío normal');
      event.preventDefault();
      event.stopPropagation();
      
      const formData = new FormData(this);
      const modal = document.getElementById('addProductModal');
      const submitButton = modal.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;
      
      console.log('Datos del formulario de agregar:', {
        action: this.action,
        codigo: formData.get('codigo'),
        nombre: formData.get('nombre')
      });
      
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
        console.log('Respuesta de agregar recibida:', response);
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', response.headers);
        
        // Verificar si es redirección
        if (response.redirected || response.status === 302) {
          console.log('Redirección detectada, actualizando tabla');
          // Mostrar mensaje de éxito y actualizar tabla
          mostrarMensajeEnPagina("Operación completada exitosamente.", "success");
          actualizarTablaProductos();
          return null;
        }
        
        // Intentar parsear como JSON
        console.log('Intentando parsear como JSON...');
        return response.json();
      })
      .then(data => {
        if (data) {
          console.log('Datos JSON de agregar recibidos:', data);
          
          if (data.success) {
            // Operación exitosa
            console.log('Operación exitosa:', data.message);
            
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
            modal.hide();
            
            // Mostrar mensaje de éxito en la página principal
            mostrarMensajeEnPagina(data.message, 'success');
            
            // Actualizar la tabla dinámicamente
            actualizarTablaProductos();
          } else {
            // Error
            const modal = document.getElementById('addProductModal');
            let alertDiv = modal.querySelector('.modal-alert');
            
            if (!alertDiv) {
              alertDiv = document.createElement('div');
              alertDiv.className = 'modal-alert alert alert-danger mt-3';
              const modalFooter = modal.querySelector('.modal-footer');
              modalFooter.insertBefore(alertDiv, modalFooter.firstChild);
            }
            
            alertDiv.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>${data.message}`;
            alertDiv.style.display = 'block';
            
            // Marcar en rojo el campo de precio si hay error en precio_unitario
            const precioInput = this.querySelector('[name="precio_unitario"]');
            if (data.errors && data.errors.precio_unitario) {
                if (precioInput) precioInput.classList.add('is-invalid');
            } else {
                if (precioInput) precioInput.classList.remove('is-invalid');
            }
            // Marcar en rojo el campo de código si hay error en codigo
            const codigoInput = this.querySelector('[name="codigo"]');
            if ((data.errors && data.errors.codigo) || data.field === "codigo") {
                if (codigoInput) codigoInput.classList.add('is-invalid');
            } else {
                if (codigoInput) codigoInput.classList.remove('is-invalid');
            }
            // Mostrar errores específicos de campos si existen
            // if (data.errors) {
            //   Object.keys(data.errors).forEach(field => {
            //     const input = this.querySelector(`[name="${field}"]`);
            //     if (input) {
            //       input.classList.add('is-invalid');
            //       const errorDiv = input.parentNode.querySelector('.invalid-feedback') || 
            //                       input.parentNode.appendChild(document.createElement('div'));
            //       errorDiv.className = 'invalid-feedback';
            //       errorDiv.textContent = data.errors[field];
            //     }
            //   });
            // }
          }
          
          // Restaurar botón
          submitButton.disabled = false;
          submitButton.innerHTML = originalText;
        } else {
          console.log('No hay datos JSON, probablemente fue exitoso');
        }
      })
      .catch(error => {
        console.error('Error en agregar:', error);
        console.log('Error completo:', error);
        
        // Si hay error, recargar la página para mostrar los mensajes de Django
        window.location.reload();
      });
      
      return false;
    });
  } else {
    console.log('Formulario de agregar NO encontrado');
  }
  
  // Manejar el envío del formulario de editar producto con AJAX
  const editProductForm = document.getElementById('editProductForm');
  console.log('Buscando formulario de editar:', editProductForm);
  
  if (editProductForm) {
    console.log('Formulario de editar encontrado, agregando event listener');
    
    editProductForm.addEventListener('submit', function (event) {
      console.log('Formulario de editar enviado, previniendo envío normal');
      event.preventDefault();
      event.stopPropagation();
      
      // Refuerzo: si el input de texto de categoría está vacío, limpiar el hidden
      const catInput = document.getElementById('edit-categoria');
      const catHidden = document.getElementById('edit-categoria-hidden');
      if (catInput && catHidden && !catInput.value.trim()) {
        catHidden.value = '';
      }
      const formData = new FormData(this);
      if (catHidden && !catHidden.value) {
        formData.delete('id_categoria');
      }
      const modal = editProductModal;
      const submitButton = modal.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;
      
      console.log('Datos del formulario de editar:', {
        action: this.action,
        id: formData.get('id'),
        codigo: formData.get('codigo'),
        nombre: formData.get('nombre')
      });
      
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
        console.log('Respuesta de editar recibida:', response);
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', response.headers);
        
        // Verificar si es redirección
        if (response.redirected || response.status === 302) {
          console.log('Redirección detectada, actualizando tabla');
          // Mostrar mensaje de éxito y actualizar tabla
          mostrarMensajeEnPagina("Operación completada exitosamente.", "success");
          actualizarTablaProductos();
          return null;
        }
        
        // Intentar parsear como JSON
        console.log('Intentando parsear como JSON...');
        return response.json();
      })
      .then(data => {
        if (data) {
          console.log('Datos JSON de editar recibidos:', data);
          
          if (data.success) {
            // Operación exitosa
            console.log('Operación exitosa:', data.message);
            
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(editProductModal);
            modal.hide();
            
            // Mostrar mensaje de éxito en la página principal
            mostrarMensajeEnPagina(data.message, 'success');
            
            // Actualizar la tabla dinámicamente
            actualizarTablaProductos();
          } else {
            // Error
            const modal = editProductModal;
            let alertDiv = modal.querySelector('.modal-alert');
            
            if (!alertDiv) {
              alertDiv = document.createElement('div');
              alertDiv.className = 'modal-alert alert alert-danger mt-3';
              const modalFooter = modal.querySelector('.modal-footer');
              modalFooter.insertBefore(alertDiv, modalFooter.firstChild);
            }
            
            alertDiv.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>${data.message}`;
            alertDiv.style.display = 'block';
            
            // Marcar en rojo el campo de precio si hay error en precio_unitario
            const precioInput = this.querySelector('[name="precio_unitario"]');
            if (data.errors && data.errors.precio_unitario) {
                if (precioInput) precioInput.classList.add('is-invalid');
            } else {
                if (precioInput) precioInput.classList.remove('is-invalid');
            }
            // Marcar en rojo el campo de código si hay error en codigo
            const codigoInput = this.querySelector('[name="codigo"]');
            if ((data.errors && data.errors.codigo) || data.field === "codigo") {
                if (codigoInput) codigoInput.classList.add('is-invalid');
            } else {
                if (codigoInput) codigoInput.classList.remove('is-invalid');
            }
            // Mostrar errores específicos de campos si existen
            // if (data.errors) {
            //   Object.keys(data.errors).forEach(field => {
            //     const input = this.querySelector(`[name="${field}"]`);
            //     if (input) {
            //       input.classList.add('is-invalid');
            //       const errorDiv = input.parentNode.querySelector('.invalid-feedback') || 
            //                       input.parentNode.appendChild(document.createElement('div'));
            //       errorDiv.className = 'invalid-feedback';
            //       errorDiv.textContent = data.errors[field];
            //     }
            //   });
            // }
          }
          
          // Restaurar botón
          submitButton.disabled = false;
          submitButton.innerHTML = originalText;
        } else {
          console.log('No hay datos JSON, probablemente fue exitoso');
        }
      })
      .catch(error => {
        console.error('Error en editar:', error);
        console.log('Error completo:', error);
        
        // Si hay error, recargar la página para mostrar los mensajes de Django
        window.location.reload();
      });
      
      return false;
    });
  } else {
    console.log('Formulario de editar NO encontrado');
  }
});

// Función para mostrar mensajes en el modal
function mostrarMensajeEnModal(modalId, mensaje, tipo) {
  console.log('Mostrando mensaje en modal:', modalId, mensaje, tipo);
  
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
  
  alertDiv.innerHTML = `
    <i class="bi ${icon} me-2"></i>
    ${mensaje}
  `;
  alertDiv.style.display = 'block';
  
  console.log('Mensaje mostrado en modal');
  
  // Auto-ocultar mensajes de error después de 5 segundos
  if (tipo === 'danger' || tipo === 'warning') {
    setTimeout(() => {
      alertDiv.style.display = 'none';
    }, 5000);
  }
}

// Función para mostrar notificaciones push modernas
function mostrarMensajeEnPagina(mensaje, tipo) {
  console.log('Mostrando notificación push:', mensaje, tipo);
  
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
function mostrarMensajeConDeshacer(mensaje, productoId) {
  console.log('Mostrando mensaje con deshacer:', mensaje, productoId);
  
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
                  onclick="restaurarProducto(${productoId}, this)" 
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

// Función para restaurar producto
function restaurarProducto(productoId, button) {
  console.log('Restaurando producto:', productoId);
  
  // Deshabilitar botón
  button.disabled = true;
  button.textContent = 'Restaurando...';
  button.style.opacity = '0.7';
  
  // Enviar petición para restaurar
  fetch(`/producto/restaurar/${productoId}/`, {
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
      actualizarTablaProductos();
      
      // Remover la notificación de eliminación
      const notification = button.closest('.notification');
      if (notification) {
        notification.remove();
      }
    } else {
      // Mostrar error
      alert('Error al restaurar el producto: ' + data.message);
      
      // Restaurar botón
      button.disabled = false;
      button.textContent = 'Deshacer';
      button.style.opacity = '1';
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error al restaurar el producto');
    
    // Restaurar botón
    button.disabled = false;
    button.textContent = 'Deshacer';
    button.style.opacity = '1';
  });
}

// Función para actualizar la tabla de productos dinámicamente
function actualizarTablaProductos() {
  console.log('Actualizando tabla de productos...');
  
  // Obtener los datos actualizados de la tabla
  fetch(window.location.href)
    .then(response => response.text())
    .then(html => {
      console.log('HTML recibido, longitud:', html.length);
      
      // Crear un elemento temporal para parsear el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Verificar si hay productos en la nueva respuesta
      const nuevaTabla = doc.querySelector('.table-responsive');
      const nuevoCardTabla = doc.querySelector('.card.shadow-lg.border-0.mb-4');
      const nuevoMensaje = doc.querySelector('.alert-info');
      const cardActual = document.querySelector('.card.shadow-lg.border-0.mb-4');
      const cardMensaje = document.querySelector('.card.shadow-lg.border-0:not(.mb-4)');
      
      console.log('Elementos encontrados:', {
        nuevaTabla: !!nuevaTabla,
        nuevoCardTabla: !!nuevoCardTabla,
        nuevoMensaje: !!nuevoMensaje,
        cardActual: !!cardActual,
        cardMensaje: !!cardMensaje
      });
      
      if (nuevaTabla && cardActual) {
        // Hay productos, actualizar la tabla
        const tablaActual = cardActual.querySelector('.table-responsive');
        console.log('Tabla actual encontrada:', !!tablaActual);
        
        if (tablaActual) {
          console.log('Reemplazando contenido de la tabla...');
          tablaActual.innerHTML = nuevaTabla.innerHTML;
          
          // Reinicializar DataTables
          if ($.fn.DataTable.isDataTable('.datatable')) {
            console.log('Destruyendo DataTable existente...');
            $('.datatable').DataTable().destroy();
          }
          
          // Reinicializar DataTables con la nueva tabla
          console.log('Reinicializando DataTable...');
          const table = $('.datatable').DataTable({
            language: {
              info: "Mostrando _START_ de _END_ | Total _TOTAL_ producto(s)",
              infoEmpty: "Sin productos para mostrar",
              lengthMenu: "Mostrar _MENU_ productos",
              search: "🔍 Buscar:",
              zeroRecords: "No se encontraron resultados.",
              infoFiltered: "(filtrado de un total de _MAX_ producto(s))",
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
              { orderable: false, targets: [2, 7] }
            ],
            pagingType: 'full_numbers',
          });
          
          // Reconfigurar el buscador
          $('#searchProductos').off('input').on('input', function () {
            const val = this.value.toLowerCase();

            $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
              const nombre = data[0].toLowerCase();
              const marca = data[1].toLowerCase();
              const codigo = data[3].toLowerCase();
              return nombre.includes(val) || marca.includes(val) || codigo.includes(val);
            });

            table.draw();
            $.fn.dataTable.ext.search.pop();
          });
          
          console.log('Tabla actualizada correctamente');
        } else {
          console.error('No se pudo encontrar la tabla actual dentro del card');
        }
      } else if (nuevoCardTabla && cardMensaje) {
        // Si no existe la tabla actual pero sí existe el card del mensaje, reemplazar el card por el card de la tabla
        console.log('Reemplazando card de mensaje por card de tabla...');
        cardMensaje.outerHTML = nuevoCardTabla.outerHTML;
        

        
        // Reinicializar DataTables
        if ($.fn.DataTable.isDataTable('.datatable')) {
          $('.datatable').DataTable().destroy();
        }
        
        const table = $('.datatable').DataTable({
          language: {
            info: "Mostrando _START_ de _END_ | Total _TOTAL_ producto(s)",
            infoEmpty: "Sin productos para mostrar",
            lengthMenu: "Mostrar _MENU_ productos",
            search: "🔍 Buscar:",
            zeroRecords: "No se encontraron resultados.",
            infoFiltered: "(filtrado de un total de _MAX_ producto(s))",
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
            { orderable: false, targets: [2, 7] }
          ],
          pagingType: 'full_numbers',
        });
        
        // Reconfigurar el buscador
        $('#searchProductos').off('input').on('input', function () {
          const val = this.value.toLowerCase();
          $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
            const nombre = data[0].toLowerCase();
            const marca = data[1].toLowerCase();
            const codigo = data[3].toLowerCase();
            return nombre.includes(val) || marca.includes(val) || codigo.includes(val);
          });
          table.draw();
          $.fn.dataTable.ext.search.pop();
        });
        
        console.log('Card de tabla restaurado correctamente');
      } else if (nuevoMensaje) {
        // No hay productos, mostrar mensaje
        console.log('Mostrando mensaje de "no hay productos"');
        const contenedorActual = document.querySelector('.action-bar').nextElementSibling;
        console.log('Contenedor actual encontrado:', !!contenedorActual);
        
        if (contenedorActual) {
          contenedorActual.outerHTML = nuevoMensaje.parentElement.parentElement.outerHTML;
          console.log('Mensaje de "no hay productos" mostrado');
        } else {
          console.error('No se pudo encontrar el contenedor para mostrar el mensaje');
        }
      } else {
        console.error('No se pudo encontrar la tabla ni el mensaje en la respuesta');
        console.log('Elementos buscados en el HTML:', {
          tableResponsive: doc.querySelectorAll('.table-responsive').length,
          alertInfo: doc.querySelectorAll('.alert-info').length,
          cards: doc.querySelectorAll('.card').length
        });
      }
    })
    .catch(error => {
      console.error('Error al actualizar la tabla:', error);
    });
}

// Limpiar mensajes al abrir modal de eliminación
deleteProductModal.addEventListener('show.bs.modal', function() {
  const alertDiv = this.querySelector('.modal-alert');
  if (alertDiv) alertDiv.style.display = 'none';
});

// Limpiar mensajes al abrir modal de agregar
const addProductModal = document.getElementById('addProductModal');
addProductModal.addEventListener('show.bs.modal', function() {
  const alertDiv = this.querySelector('.modal-alert');
  if (alertDiv) alertDiv.style.display = 'none';
  
  // Limpiar el formulario
  const form = this.querySelector('form');
  if (form) {
    form.reset();
  }
  
  // Limpiar clases de validación
  const inputs = this.querySelectorAll('.form-control');
  inputs.forEach(input => {
    input.classList.remove('is-invalid', 'is-valid');
  });
  
  // Limpiar mensajes de error
  const errorDivs = this.querySelectorAll('.invalid-feedback');
  errorDivs.forEach(div => {
    div.textContent = '';
  });
  
  // Inicializar autocompletado de categorías para el modal de agregar
  setTimeout(() => {
    inicializarAutocompletadoCategorias();
  }, 100);
});

// Corregir problema de accesibilidad al cerrar modal
addProductModal.addEventListener('hidden.bs.modal', function() {
  // Remover aria-hidden cuando el modal se cierra
  this.removeAttribute('aria-hidden');
  
  // Asegurar que el foco vuelva al botón que abrió el modal
  const triggerButton = document.querySelector('[data-bs-target="#addProductModal"]');
  if (triggerButton) {
    triggerButton.focus();
  }
});

// Al abrir el modal de agregar producto, limpiar clases de error
addProductModal.addEventListener('show.bs.modal', function () {
  const precioInput = this.querySelector('[name="precio_unitario"]');
  const codigoInput = this.querySelector('[name="codigo"]');
  if (precioInput) precioInput.classList.remove('is-invalid');
  if (codigoInput) codigoInput.classList.remove('is-invalid');
  // Limpiar mensaje de error global
  const alertDiv = this.querySelector('.modal-alert');
  if (alertDiv) alertDiv.remove();
});
// Al abrir el modal de editar producto, limpiar clases de error
editProductModal.addEventListener('show.bs.modal', function () {
  const precioInput = this.querySelector('[name="precio_unitario"]');
  const codigoInput = this.querySelector('[name="codigo"]');
  if (precioInput) precioInput.classList.remove('is-invalid');
  if (codigoInput) codigoInput.classList.remove('is-invalid');
});

// Ya existe la declaración de deleteProductModal arriba, solo agregar el event listener aquí
if (deleteProductModal) {
    deleteProductModal.addEventListener('hidden.bs.modal', function () {
        const alertDiv = deleteProductModal.querySelector('.modal-alert');
        if (alertDiv) {
            alertDiv.remove();
        }
    });
}


$(document).ready(function () {
  const table = $('.datatable').DataTable({
    language: {
      info: "Mostrando _START_ de _END_ | Total _TOTAL_ producto(s)",
      infoEmpty: "Sin productos para mostrar",
      lengthMenu: "Mostrar _MENU_ productos",
      search: "🔍 Buscar:",
      zeroRecords: "No se encontraron resultados.",
      infoFiltered: "(filtrado de un total de _MAX_ producto(s))",
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
      { orderable: false, targets: [2, 7] }
    ],
    pagingType: 'full_numbers',
  });

  $('#searchProductos').on('input', function () {
    const val = this.value.toLowerCase();

    $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
      const nombre = data[0].toLowerCase();
      const marca = data[1].toLowerCase();
      const codigo = data[4].toLowerCase(); // índice correcto para Código SKU
      return nombre.includes(val) || marca.includes(val) || codigo.includes(val);
    });

    table.draw();
    $.fn.dataTable.ext.search.pop();
  });

  // Configuración global para la paginación de DataTables
  $.fn.DataTable.ext.pager.numbers_length = 5;

  // Inicializar autocompletado de categorías cuando se cargan los modales
  inicializarAutocompletadoCategorias();
});

// Funciones para autocompletado de categorías
function inicializarAutocompletadoCategorias() {
  // Autocompletado para modal de agregar
  const addCategoriaInput = document.getElementById('add-categoria');
  const addCategoriaHidden = document.getElementById('add-categoria-hidden');
  const addCategoriaSuggestions = document.getElementById('add-categoria-suggestions');

  if (addCategoriaInput && addCategoriaHidden && addCategoriaSuggestions) {
    // Remover event listeners existentes para evitar duplicados
    addCategoriaInput.removeEventListener('input', function() { fetchCategorias('add'); });
    addCategoriaInput.removeEventListener('focus', function() { fetchCategorias('add'); });
    
    addCategoriaInput.addEventListener('input', function() {
      fetchCategorias('add');
    });

    addCategoriaInput.addEventListener('focus', function() {
      fetchCategorias('add');
    });
  }

  // Autocompletado para modal de editar
  const editCategoriaInput = document.getElementById('edit-categoria');
  const editCategoriaHidden = document.getElementById('edit-categoria-hidden');
  const editCategoriaSuggestions = document.getElementById('edit-categoria-suggestions');

  if (editCategoriaInput && editCategoriaHidden && editCategoriaSuggestions) {
    // Remover event listeners existentes para evitar duplicados
    editCategoriaInput.removeEventListener('input', function() { fetchCategorias('edit'); });
    editCategoriaInput.removeEventListener('focus', function() { fetchCategorias('edit'); });
    
    editCategoriaInput.addEventListener('input', function() {
      fetchCategorias('edit');
    });

    editCategoriaInput.addEventListener('focus', function() {
      fetchCategorias('edit');
    });
  }

  // Cerrar sugerencias al hacer clic fuera (event listener global)
  document.removeEventListener('click', handleClickOutside);
  document.addEventListener('click', handleClickOutside);
}

function handleClickOutside(e) {
  const addCategoriaInput = document.getElementById('add-categoria');
  const addCategoriaSuggestions = document.getElementById('add-categoria-suggestions');
  const editCategoriaInput = document.getElementById('edit-categoria');
  const editCategoriaSuggestions = document.getElementById('edit-categoria-suggestions');

  if (addCategoriaInput && addCategoriaSuggestions) {
    if (!addCategoriaInput.contains(e.target) && !addCategoriaSuggestions.contains(e.target)) {
      closeCategoriaSuggestions('add');
    }
  }

  if (editCategoriaInput && editCategoriaSuggestions) {
    if (!editCategoriaInput.contains(e.target) && !editCategoriaSuggestions.contains(e.target)) {
      closeCategoriaSuggestions('edit');
    }
  }
}

function fetchCategorias(mode) {
  const input = document.getElementById(`${mode}-categoria`);
  const suggestions = document.getElementById(`${mode}-categoria-suggestions`);
  
  if (!input || !suggestions) return;
  
  const query = input.value.trim();
  
  // Mostrar todas las categorías si no hay texto de búsqueda
  const url = `/producto/autocomplete_categorias/?q=${encodeURIComponent(query)}`;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      const categorias = data.results || [];
      renderCategoriaSuggestions(mode, categorias);
    })
    .catch(error => {
      console.error('Error en fetchCategorias:', error);
    });
}

function renderCategoriaSuggestions(mode, items) {
  const input = document.getElementById(`${mode}-categoria`);
  const hidden = document.getElementById(`${mode}-categoria-hidden`);
  const suggestions = document.getElementById(`${mode}-categoria-suggestions`);
  
  if (!input || !hidden || !suggestions) return;
  
  suggestions.innerHTML = '';
  if (!items.length) {
    suggestions.style.display = 'none';
    return;
  }
  
  // Limitar a 5 resultados
  const limitedItems = items.slice(0, 5);
  
  limitedItems.forEach((item) => {
    const div = document.createElement('button');
    div.type = 'button';
    div.className = 'list-group-item list-group-item-action';
    
    // Truncar la descripción si es muy larga (no cortar palabras y permitir unas 3 palabras más)
    let descripcionTruncada = '';
    if (item.descripcion) {
      const limite = 65; // un poco más largo que antes
      if (item.descripcion.length > limite) {
        let sub = item.descripcion.substring(0, limite);
        // Buscar el último espacio antes del límite para no cortar palabras
        const ultimoEspacio = sub.lastIndexOf(' ');
        if (ultimoEspacio > 0) {
          sub = sub.substring(0, ultimoEspacio);
        }
        descripcionTruncada = sub + '...';
      } else {
        descripcionTruncada = item.descripcion;
      }
    }
    
    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${item.nombre}</strong>
        </div>
      </div>
    `;
    div.onclick = function() {
      input.value = item.nombre;
      hidden.value = item.id;
      closeCategoriaSuggestions(mode);
    };
    suggestions.appendChild(div);
  });
  
  suggestions.style.display = 'block';
}

function closeCategoriaSuggestions(mode) {
  const suggestions = document.getElementById(`${mode}-categoria-suggestions`);
  if (suggestions) {
    suggestions.style.display = 'none';
  }
}

// Funcionalidad del contador de caracteres para descripción
function inicializarContadorCaracteres() {
  // Contador para modal de agregar
  const addDescripcion = document.getElementById('add-descripcion');
  const addCounter = document.getElementById('add-descripcion-counter');
  
  if (addDescripcion && addCounter) {
    addDescripcion.addEventListener('input', function() {
      const longitud = this.value.length;
      addCounter.textContent = longitud;
      
      // Cambiar color cuando se acerca al límite
      if (longitud >= 450) {
        addCounter.style.color = '#dc3545'; // Rojo
      } else if (longitud >= 400) {
        addCounter.style.color = '#ffc107'; // Amarillo
      } else {
        addCounter.style.color = '#6c757d'; // Gris
      }
    });
    
    // Inicializar contador
    addCounter.textContent = addDescripcion.value.length;
  }
  
  // Contador para modal de editar
  const editDescripcion = document.getElementById('edit-descripcion');
  const editCounter = document.getElementById('edit-descripcion-counter');
  
  if (editDescripcion && editCounter) {
    editDescripcion.addEventListener('input', function() {
      const longitud = this.value.length;
      editCounter.textContent = longitud;
      
      // Cambiar color cuando se acerca al límite
      if (longitud >= 450) {
        editCounter.style.color = '#dc3545'; // Rojo
      } else if (longitud >= 400) {
        editCounter.style.color = '#ffc107'; // Amarillo
      } else {
        editCounter.style.color = '#6c757d'; // Gris
      }
    });
    
    // Inicializar contador
    editCounter.textContent = editDescripcion.value.length;
  }
}

// Inicializar contadores cuando se cargan los modales
document.addEventListener('DOMContentLoaded', function() {
  inicializarContadorCaracteres();
});

// Reinicializar contadores cuando se abren los modales
if (addProductModal) {
  addProductModal.addEventListener('shown.bs.modal', function() {
    setTimeout(() => {
      inicializarContadorCaracteres();
    }, 100);
  });
}

if (editProductModal) {
  editProductModal.addEventListener('shown.bs.modal', function() {
    setTimeout(() => {
      inicializarContadorCaracteres();
    }, 100);
  });
}

// Quitar borde rojo al escribir en código o precio (agregar y editar)
function inicializarListenersInputsProducto() {
  document.querySelectorAll('[name="codigo"], [name="precio_unitario"]').forEach(input => {
    input.addEventListener('input', function() {
      this.classList.remove('is-invalid');
    });
  });
}
// Inicializar listeners al abrir los modales
addProductModal.addEventListener('shown.bs.modal', inicializarListenersInputsProducto);
editProductModal.addEventListener('shown.bs.modal', inicializarListenersInputsProducto);

