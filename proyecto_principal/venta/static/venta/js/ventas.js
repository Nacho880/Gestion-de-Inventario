// ADAPTACIÓN DE COMPRAS.JS PARA VENTAS (PRIMERA PARTE)
// Cambios: rutas, textos, y lógica de proveedor eliminada si no aplica

console.log('Ventas.js limpio cargado');

// Función para mostrar notificaciones push modernas
function mostrarMensajeEnPagina(mensaje, tipo) {
  // Detectar si es un mensaje especial de carrito
  const esCarritoSuccess = tipo === 'success' && /agregado al carrito/i.test(mensaje);
  const esCarritoEliminado = tipo === 'danger' && /eliminado del carrito/i.test(mensaje);
  // Detectar mensaje de venta creada exitosamente
  const esVentaCreada = tipo === 'success' && /venta #\d+ creada exitosamente\.?/i.test(mensaje);

  if ((esCarritoSuccess || esCarritoEliminado) && !esVentaCreada) {
    // Mostrar como alerta dentro de <main class="content">
    let mainContent = document.querySelector('main.content');
    if (!mainContent) mainContent = document.body;
    // Eliminar alertas previas del mismo tipo (solo JS, no las de Django)
    const prevAlerts = mainContent.querySelectorAll('.alert[data-js-alert]');
    prevAlerts.forEach(alert => alert.remove());
    // Crear la alerta tipo Bootstrap
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.setAttribute('data-js-alert', 'true');
    alertDiv.style.cssText = `
      margin-bottom: 18px;
      font-size: 1.1rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.07);
      display: flex;
      align-items: center;
      gap: 12px;
    `;
    // Icono
    let iconHtml = '';
    if (tipo === 'success') {
      iconHtml = '<i class="bi bi-check-circle me-2" style="font-size:1.3em;"></i>';
    } else if (tipo === 'danger') {
      iconHtml = '<i class="bi bi-x-circle me-2" style="font-size:1.3em;"></i>';
    }
    alertDiv.innerHTML = `
      ${iconHtml}
      <span style="flex:1;">${mensaje}</span>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar" style="pointer-events:auto;"></button>
    `;
    alertDiv.querySelector('.btn-close').onclick = function() {
      alertDiv.classList.remove('show');
      setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.parentNode.removeChild(alertDiv);
      }, 200);
    };
    if (mainContent.firstChild) {
      mainContent.insertBefore(alertDiv, mainContent.firstChild);
    } else {
      mainContent.appendChild(alertDiv);
    }
    setTimeout(() => {
      alertDiv.classList.remove('show');
      setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.parentNode.removeChild(alertDiv);
      }, 200);
    }, 3000);
    return;
  }

  // --- DISEÑO MODERNO FLOTANTE PARA OTROS MENSAJES ---
  let notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      left: auto;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      pointer-events: none;
    `;
    document.body.appendChild(notificationContainer);
  }
  // Crear la notificación flotante
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
    background: ${tipo === 'danger' ? '#dc3545' : tipo === 'success' ? '#198754' : tipo === 'warning' ? '#ffc107' : '#0d6efd'};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    margin-bottom: 10px;
    position: relative;
    overflow: hidden;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    min-width: 350px;
    max-width: 600px;
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: auto;
  `;
  // Icono
  let icon = 'bi-info-circle';
  if (tipo === 'success') icon = 'bi-check-circle';
  else if (tipo === 'danger') icon = 'bi-x-circle';
  else if (tipo === 'warning') icon = 'bi-exclamation-triangle';
  notification.innerHTML = `
    <i class="bi ${icon}" style="font-size: 1.2em;"></i>
    <span style="flex:1;">${mensaje}</span>
    <button type="button" class="btn-close" aria-label="Cerrar" style="pointer-events:auto;"></button>
  `;
  notification.querySelector('.btn-close').onclick = function() {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) notification.parentNode.removeChild(notification);
    }, 200);
  };
  notificationContainer.appendChild(notification);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) notification.parentNode.removeChild(notification);
    }, 200);
  }, 3000);
}

// Función para mostrar mensaje con botón deshacer
function mostrarMensajeConDeshacer(mensaje, ventaId) {
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
                  onclick="restaurarVenta(${ventaId}, this)" 
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

// Función para restaurar venta
function restaurarVenta(ventaId, button) {
  console.log('Iniciando restauración de venta:', ventaId);
  
  // Deshabilitar botón
  button.disabled = true;
  button.textContent = 'Restaurando...';
  button.style.opacity = '0.7';
  
  // Enviar petición para restaurar
  fetch(`/ventas/restaurar/${ventaId}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Restaurar exitosamente
      mostrarMensajeEnPagina('Venta restaurada correctamente', 'success');
      
      // Actualizar la tabla de ventas
      actualizarTablaVentas();
      
      // Remover la notificación
      const notification = button.closest('.notification');
      if (notification) {
        notification.remove();
      }
    } else {
      // Error al restaurar
      mostrarMensajeEnPagina(data.message || 'Error al restaurar la venta', 'danger');
      
      // Restaurar botón
      button.disabled = false;
      button.textContent = 'Deshacer';
      button.style.opacity = '1';
    }
  })
  .catch(error => {
    console.error('Error al restaurar venta:', error);
    mostrarMensajeEnPagina('Error al restaurar la venta', 'danger');
    
    // Restaurar botón
    button.disabled = false;
    button.textContent = 'Deshacer';
    button.style.opacity = '1';
  });
}

// Función para actualizar tabla de ventas
function actualizarTablaVentas(ventaEliminadaId = null) {
  // Hacer la petición para obtener el HTML actualizado
  fetch(window.location.href)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      // Crear un parser para el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Buscar todos los cards en el HTML nuevo
      const cardsNuevos = doc.querySelectorAll('.card');
      
      // Buscar todos los cards en el HTML actual
      const cardsActuales = document.querySelectorAll('.card');
      
      // Buscar el card del historial de ventas en el HTML nuevo
      let historialCardNuevo = null;
      for (let i = 0; i < cardsNuevos.length; i++) {
        const card = cardsNuevos[i];
        const header = card.querySelector('.card-header');
        if (header && header.textContent.includes('Historial de Ventas')) {
          historialCardNuevo = card;
          break;
        }
      }
      
      // Buscar el card del historial de ventas en el HTML actual
      let historialCardActual = null;
      for (let i = 0; i < cardsActuales.length; i++) {
        const card = cardsActuales[i];
        const header = card.querySelector('.card-header');
        if (header && header.textContent.includes('Historial de Ventas')) {
          historialCardActual = card;
          break;
        }
      }
      
      // Verificar que encontramos ambos cards
      if (!historialCardNuevo) {
        console.error('No se encontró el card del historial en el HTML nuevo');
        return;
      }
      
      if (!historialCardActual) {
        console.error('No se encontró el card del historial en el HTML actual');
        return;
      }
      
      // Obtener las secciones card-body
      const nuevaSeccionHistorial = historialCardNuevo.querySelector('.card-body');
      const seccionHistorialActual = historialCardActual.querySelector('.card-body');
      
      // Verificar que encontramos ambas secciones
      if (!nuevaSeccionHistorial) {
        console.error('No se encontró la sección card-body en el HTML nuevo');
        return;
      }
      
      if (!seccionHistorialActual) {
        console.error('No se encontró la sección card-body en el HTML actual');
        return;
      }
      
      // Actualizar el contenido
      seccionHistorialActual.innerHTML = nuevaSeccionHistorial.innerHTML;
      
      // Re-inicializar los event listeners
      inicializarEventListenersVentas();
    })
    .catch(error => {
      console.error('Error al actualizar tabla de ventas:', error);
    });
}

// Función para mostrar mensajes en modales
function mostrarMensajeEnModal(modalId, mensaje, tipo) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const errorMsg = modal.querySelector('#addManualErrorMsg');
  if (errorMsg) {
    // Limpiar el mensaje anterior del modal
    errorMsg.innerHTML = '';
    errorMsg.classList.remove('d-none', 'text-success', 'text-danger', 'text-warning');
    errorMsg.classList.add('text-' + tipo);
    errorMsg.innerHTML = mensaje;
  }
}

// Modales edición y eliminación 
const deleteVentaModal = document.getElementById('deleteVentaModal');

deleteVentaModal.addEventListener('show.bs.modal', function (event) {
  const button = event.relatedTarget;
  const id = button.getAttribute('data-id');
  
  document.getElementById('delete-id').value = id;
  
  // Buscar el número de venta en el DOM
  const ventaElement = document.querySelector(`[data-bs-target="#collapse${id}"]`);
  if (ventaElement) {
    const ventaText = ventaElement.querySelector('.fw-bold').textContent;
    const numeroVenta = ventaText.match(/Venta #(\d+)/);
    if (numeroVenta) {
      document.getElementById('delete-producto').textContent = `#${numeroVenta[1]}`;
    } else {
      document.getElementById('delete-producto').textContent = `#${id}`;
    }
  } else {
    document.getElementById('delete-producto').textContent = `#${id}`;
  }
  
  document.getElementById('deleteVentaForm').action = `/ventas/eliminar/${id}/`;
});

// Manejar el envío del formulario de eliminación con AJAX
const deleteVentaForm = document.getElementById('deleteVentaForm');
if (deleteVentaForm) {
  deleteVentaForm.addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();
    
    const formData = new FormData(this);
    const modal = document.getElementById('deleteVentaModal');
    const submitButton = modal.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Eliminando...';
    
    fetch('/ventas/eliminar/' + formData.get('id') + '/', {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => {
      return response.json();
    })
    .then(data => {
      if (data) {
        if (data.success) {
          // Eliminación exitosa, cerrar el modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('deleteVentaModal'));
          modal.hide();
          
          // Mostrar mensaje con botón deshacer
          mostrarMensajeConDeshacer(data.message, data.venta_id);
          
          // Eliminar acordeón de la venta eliminada
          actualizarTablaVentas(data.venta_id);
        } else {
          // Error
          mostrarMensajeEnPagina(data.message || 'Error al eliminar la venta', 'danger');
        }
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
      }
    })
    .catch(error => {
      console.error('Error en eliminación:', error);
      mostrarMensajeEnPagina('Error al eliminar la venta', 'danger');
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    });
    return false;
  });
} else {
  console.log('Formulario de eliminación NO encontrado');
}

// Modal de escaneo de código
const scanCodeModalEl = document.getElementById('scanCodeModal');
const scanCodeInput = document.getElementById('scanCodeInput');
const scanMessage = document.getElementById('scanMessage');
let scanTimeout = null;

function showError(message) {
  scanMessage.innerHTML = message;
  scanMessage.style.display = 'block';
}

function clearError() {
  scanMessage.innerHTML = '';
  scanMessage.style.display = 'none';
}

if (scanCodeModalEl && scanCodeInput && scanMessage) {
  scanCodeModalEl.addEventListener('shown.bs.modal', () => {
    scanCodeInput.value = '';
    clearError();
    scanCodeInput.focus();
  });

  scanCodeInput.addEventListener('keydown', function(event) {
    if(event.key === 'Enter') {
      event.preventDefault();
      const codigo = this.value.trim();
      if(codigo === '') return;

      // Limpiar timeout anterior si existe
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }

      // Validar el código
      fetch('/ventas/validar_codigo/?codigo=' + encodeURIComponent(codigo))
        .then(response => response.json())
        .then(data => {
          if(!data.existe) {
            showError(`⚠️ No se encontró el código "<strong>${codigo}</strong>".`);
            scanCodeInput.value = '';
            scanCodeInput.focus();
          } else {
            // Código existe, cerrar modal escaneo y abrir modal agregar producto
            const scanModalInstance = bootstrap.Modal.getInstance(scanCodeModalEl);
            scanModalInstance.hide();

            // Abrir modal de agregar producto
            const addManualModal = new bootstrap.Modal(document.getElementById('addManualModal'));
            addManualModal.show();

            // Poner código en el input de producto y poner foco
            const productoInput = document.getElementById('producto_autocomplete');
            if(productoInput) {
              productoInput.value = codigo;
              productoInput.focus();
              // Disparar el evento input para activar la búsqueda
              productoInput.dispatchEvent(new Event('input'));
            }
          }
        })
        .catch(() => {
          showError('⚠️ Error al validar el código. Intente nuevamente.');
          scanCodeInput.value = '';
          scanCodeInput.focus();
        });
    }
  });

  // Limpiar el input después de un tiempo si no se completó el escaneo
  scanCodeInput.addEventListener('input', function() {
    if (scanTimeout) {
      clearTimeout(scanTimeout);
    }
    scanTimeout = setTimeout(() => {
      this.value = '';
    }, 1000);
  });

  // Limpiar error al cerrar el modal
  scanCodeModalEl.addEventListener('hidden.bs.modal', () => {
    clearError();
    scanCodeInput.value = '';
  });
}

// Abrir modal de agregar manual desde botón (si existe)
const btnAgregarManual = document.getElementById('btnAgregarManual');
if (btnAgregarManual) {
  btnAgregarManual.addEventListener('click', () => {
    // Ocultar modal de escaneo
    const scanModalEl = document.getElementById('scanCodeModal');
    const scanModal = bootstrap.Modal.getInstance(scanModalEl);
    scanModal.hide();

    // Abrir modal de añadir venta
    const addVentaModalEl = document.getElementById('addVentaModal');
    const addVentaModal = new bootstrap.Modal(addVentaModalEl);
    addVentaModal.show();
  });
}

// --- FUNCIONES DE CARRITO ---
function handleAddToCart(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const submitButton = this.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Agregando...';
  
  fetch(this.action, {
    method: 'POST',
    body: formData,
    headers: {
      'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Cerrar el modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('addManualModal'));
      modal.hide();
      
      mostrarMensajeEnPagina(data.message, 'success');
      
      // Actualizar solo la sección del carrito
      actualizarSeccionCarrito();
    } else {
      mostrarMensajeEnModal('addManualModal', data.message, 'danger');
    }
    
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  })
  .catch(error => {
    console.error('Error al agregar al carrito:', error);
    mostrarMensajeEnModal('addManualModal', 'Error al agregar al carrito', 'danger');
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  });
}

// Manejar formulario de agregar al carrito con AJAX (inicial)
const addToCartForm = document.querySelector('#addManualModal form');
if (addToCartForm) {
  addToCartForm.addEventListener('submit', handleAddToCart);
}

// --- LÓGICA DE CARRITO (AGREGAR, EDITAR, ELIMINAR, ACTUALIZAR) ---

// Función para actualizar solo la sección del carrito
function actualizarSeccionCarrito() {
  // Hacer la petición para obtener el HTML actualizado
  fetch(window.location.href)
    .then(response => response.text())
    .then(html => {
      // Crear un parser para el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      // Buscar el card del carrito en el HTML nuevo
      const cardsNuevos = doc.querySelectorAll('.card');
      let carritoCardNuevo = null;
      for (let card of cardsNuevos) {
        const header = card.querySelector('.card-header');
        if (header && header.textContent.includes('Carrito de Venta')) {
          carritoCardNuevo = card;
          break;
        }
      }
      // Buscar el card del carrito en el HTML actual
      const cardsActuales = document.querySelectorAll('.card');
      let carritoCardActual = null;
      for (let card of cardsActuales) {
        const header = card.querySelector('.card-header');
        if (header && header.textContent.includes('Carrito de Venta')) {
          carritoCardActual = card;
          break;
        }
      }
      // Verificar que encontramos ambos cards
      if (!carritoCardNuevo || !carritoCardActual) {
        window.location.reload();
        return;
      }
      // Obtener las secciones card-body
      const nuevaSeccionCarrito = carritoCardNuevo.querySelector('.card-body');
      const seccionCarritoActual = carritoCardActual.querySelector('.card-body');
      if (!nuevaSeccionCarrito || !seccionCarritoActual) {
        window.location.reload();
        return;
      }
      // Actualizar el contenido
      seccionCarritoActual.innerHTML = nuevaSeccionCarrito.innerHTML;
      // Re-inicializar los event listeners
      inicializarEventListenersCarrito();
      // Re-inicializar event listeners para inputs de cantidad
      const cantidadInputs = document.querySelectorAll('.carrito-cantidad-input');
      cantidadInputs.forEach((input) => {
        input.removeEventListener('change', handleCantidadChange);
        input.removeEventListener('input', handleCantidadChange);
        input.addEventListener('change', handleCantidadChange);
        input.addEventListener('input', handleCantidadChange);
      });
    })
    .catch(() => {
      window.location.reload();
    });
}

// Función para inicializar los event listeners del modal
function inicializarEventListenersModal() {
  // Obtener referencias a los elementos del modal
  const productoInput = document.getElementById('producto_autocomplete');
  const categoriaFiltro = document.getElementById('categoria_filtro');
  const productoHidden = document.getElementById('producto_id_hidden');
  const productoSuggestions = document.getElementById('autocomplete_suggestions');
  const form = document.querySelector('#addManualModal form');
  
  if (!productoInput || !productoHidden || !productoSuggestions || !form) return;

  // Remover event listeners existentes para evitar duplicados
  productoInput.removeEventListener('input', fetchProductosGlobal);
  productoInput.removeEventListener('focus', fetchProductosGlobal);
  productoInput.addEventListener('input', fetchProductosGlobal);
  productoInput.addEventListener('focus', fetchProductosGlobal);
    
  // Event listener para cambio de categoría
  if (categoriaFiltro) {
    categoriaFiltro.removeEventListener('change', fetchProductosGlobal);
    categoriaFiltro.addEventListener('change', fetchProductosGlobal);
  }

  // Re-agregar el event listener del formulario
  form.removeEventListener('submit', handleAddToCart);
  form.addEventListener('submit', handleAddToCart);
}

// Función para inicializar los event listeners del carrito
function inicializarEventListenersCarrito() {
  // Event listeners para eliminar del carrito
  const deleteFromCartForms = document.querySelectorAll('form[action*="carrito/eliminar"]');
  deleteFromCartForms.forEach((form) => {
    form.removeEventListener('submit', handleDeleteFromCart);
    form.addEventListener('submit', handleDeleteFromCart);
  });
  // Event listeners para editar cantidad del carrito
  const editCartForms = document.querySelectorAll('form[action*="carrito/editar"]');
  editCartForms.forEach((form) => {
    form.removeEventListener('submit', handleEditCartQuantity);
    form.addEventListener('submit', handleEditCartQuantity);
  });
  // Event listener para finalizar venta
  const finalizarVentaForm = document.querySelector('form[action*="carrito/finalizar"]');
  if (finalizarVentaForm) {
    finalizarVentaForm.removeEventListener('submit', handleFinalizarVenta);
    finalizarVentaForm.addEventListener('submit', handleFinalizarVenta);
  }
}

// Función para manejar la eliminación del carrito
function handleDeleteFromCart(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const submitButton = this.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Eliminando...';
  fetch(this.action, {
    method: 'POST',
    body: formData,
    headers: {
      'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      mostrarMensajeEnPagina(data.message, 'danger');
      actualizarSeccionCarrito();
    } else {
      mostrarMensajeEnPagina(data.message, 'danger');
    }
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  })
  .catch(() => {
    mostrarMensajeEnPagina('Error al eliminar del carrito', 'danger');
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  });
}

// Función para manejar la edición de cantidad en el carrito
function handleEditCartQuantity(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const input = this.querySelector('input[name="cantidad"]');
  const originalValue = input.value;
  input.style.opacity = '0.7';
  input.disabled = true;
  fetch(this.action, {
    method: 'POST',
    body: formData,
    headers: {
      'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      actualizarSeccionCarrito();
    } else {
      mostrarMensajeEnPagina(data.message, 'danger');
      input.value = originalValue;
    }
    input.style.opacity = '1';
    input.disabled = false;
  })
  .catch(() => {
    mostrarMensajeEnPagina('Error al editar cantidad del carrito', 'danger');
    input.value = originalValue;
    input.style.opacity = '1';
    input.disabled = false;
  });
}

// Función para manejar la finalización de venta
function handleFinalizarVenta(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const submitButton = this.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Finalizando...';
  fetch(this.action, {
    method: 'POST',
    body: formData,
    headers: {
      'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      mostrarMensajeEnPagina(data.message, 'success');
      actualizarSeccionCarrito();
      // Si tienes una tabla de ventas, aquí puedes actualizarla también
        } else {
      mostrarMensajeEnPagina(data.message, 'danger');
    }
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  })
  .catch(() => {
    mostrarMensajeEnPagina('Error al finalizar venta', 'danger');
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  });
}

// Función para manejar el cambio de cantidad
function handleCantidadChange() {
  const input = this;
  const cantidad = parseInt(input.value);
  const max = parseInt(input.getAttribute('max'));
  if (max && cantidad > max) {
    input.value = max;
    mostrarMensajeEnPagina(`La cantidad máxima disponible es ${max} unidades.`, 'warning');
  }
  const form = this.closest('form');
  if (form) {
    form.dispatchEvent(new Event('submit'));
  }
}

// Variables globales para autocompletado
let productos = [];
let currentFocus = -1;
let fetchTimeout = null;

// --- AUTOCOMPLETADO DE PRODUCTOS CON FILTRO DE CATEGORÍA ---
function fetchProductosGlobal() {
  const productoInput = document.getElementById('producto_autocomplete');
  const categoriaFiltro = document.getElementById('categoria_filtro');
  const productoSuggestions = document.getElementById('autocomplete_suggestions');
  const productoHidden = document.getElementById('producto_id_hidden');

  if (!productoInput || !productoSuggestions) {
    return;
  }

  const q = productoInput.value.trim();
  const categoria = categoriaFiltro ? categoriaFiltro.value : '';

  // Limpiar timeout anterior si existe
  if (fetchTimeout) {
    clearTimeout(fetchTimeout);
  }

  // Si no hay texto de búsqueda, mostrar inmediatamente
  if (q.length === 0) {
    const url = categoria ? 
      `/ventas/autocomplete_productos/?q=${encodeURIComponent('')}&categoria=${categoria}` :
      `/ventas/autocomplete_productos/?q=${encodeURIComponent('')}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const productos = data.results || [];
        renderProductoSuggestionsGlobal(productos);
      })
      .catch(error => {
        console.error('Error en fetchProductos:', error);
      });
    return;
  }

  // Para búsquedas con texto, usar debounce de 150ms
  fetchTimeout = setTimeout(() => {
    const url = categoria ? 
      `/ventas/autocomplete_productos/?q=${encodeURIComponent(q)}&categoria=${categoria}` :
      `/ventas/autocomplete_productos/?q=${encodeURIComponent(q)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const productos = data.results || [];
        renderProductoSuggestionsGlobal(productos);
      })
      .catch(error => {
        console.error('Error en fetchProductos con texto:', error);
      });
  }, 150);
}

function renderProductoSuggestionsGlobal(items) {
  const productoSuggestions = document.getElementById('autocomplete_suggestions');
  const productoInput = document.getElementById('producto_autocomplete');
  const productoHidden = document.getElementById('producto_id_hidden');

  if (!productoSuggestions || !productoInput || !productoHidden) return;

  productoSuggestions.innerHTML = '';
  if (!items.length) {
    productoSuggestions.style.display = 'none';
    return;
  }

  // Limitar a 5 resultados
  const limitedItems = items.slice(0, 5);
  limitedItems.forEach((item, idx) => {
    const div = document.createElement('button');
    div.type = 'button';
    div.className = 'list-group-item list-group-item-action';
    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${item.nombre}</strong>
          <br>
          <small class="text-muted">Código: ${item.codigo} | Stock: ${item.stock}</small>
        </div>
        <span class="badge bg-primary rounded-pill">$${item.precio_venta}</span>
      </div>
    `;
    div.onclick = function() {
      productoInput.value = item.nombre;
      if (productoHidden) productoHidden.value = item.id;
      closeProductoSuggestionsGlobal();
      clearErrorGlobal();
    };
    productoSuggestions.appendChild(div);
  });
  productoSuggestions.style.display = 'block';
}

function closeProductoSuggestionsGlobal() {
  const productoSuggestions = document.getElementById('autocomplete_suggestions');
  if (productoSuggestions) {
    productoSuggestions.style.display = 'none';
  }
}

function clearErrorGlobal() {
  const errorMsg = document.getElementById('addManualErrorMsg');
  if (errorMsg) {
    errorMsg.classList.add('d-none');
    errorMsg.innerHTML = '';
  }
}

// Inicializar eventos de autocompletado
(function() {
  const productoInput = document.getElementById('producto_autocomplete');
  const categoriaFiltro = document.getElementById('categoria_filtro');
  const productoSuggestions = document.getElementById('autocomplete_suggestions');
  const productoHidden = document.getElementById('producto_id_hidden');
  let productos = [];
  let currentFocus = -1;

  if (!productoInput || !productoSuggestions) return;

  productoInput.addEventListener('input', fetchProductosGlobal);
  productoInput.addEventListener('focus', fetchProductosGlobal);

  // Event listener para cambio de categoría
  if (categoriaFiltro) {
    categoriaFiltro.addEventListener('change', fetchProductosGlobal);
  }

  productoInput.addEventListener('keydown', function(e) {
    const items = productoSuggestions.querySelectorAll('.list-group-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      currentFocus++;
      if (currentFocus >= items.length) currentFocus = 0;
      items.forEach((el, idx) => el.classList.toggle('active', idx === currentFocus));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      currentFocus--;
      if (currentFocus < 0) currentFocus = items.length - 1;
      items.forEach((el, idx) => el.classList.toggle('active', idx === currentFocus));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (currentFocus > -1 && items[currentFocus]) {
        e.preventDefault();
        items[currentFocus].click();
      }
      else if (productos.length === 1) {
        e.preventDefault();
        productoInput.value = productos[0].nombre;
        productoHidden.value = productos[0].id;
        closeProductoSuggestionsGlobal();
      }
    }
  });

  // Cerrar sugerencias al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (!productoInput.contains(e.target) && !productoSuggestions.contains(e.target)) {
      closeProductoSuggestionsGlobal();
    }
  });
})();

// Inicializar event listeners al cargar la página
window.addEventListener('DOMContentLoaded', function() {
  inicializarEventListenersCarrito();
  // Event listeners para inputs de cantidad (cambio automático)
  const cantidadInputs = document.querySelectorAll('.carrito-cantidad-input');
  cantidadInputs.forEach((input) => {
    input.addEventListener('change', handleCantidadChange);
    input.addEventListener('input', handleCantidadChange);
  });
});

// Función para inicializar event listeners de ventas
function inicializarEventListenersVentas() {
  // Aquí puedes agregar otros event listeners específicos de ventas si es necesario
} 