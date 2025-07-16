document.addEventListener('DOMContentLoaded', function() {
    // Búsqueda de productos
    const searchInput = document.getElementById('buscarProducto');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('tbody tr');
            
            tableRows.forEach(row => {
                const productName = row.querySelector('td:first-child').textContent.toLowerCase();
                const productBrand = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                
                if (productName.includes(searchTerm) || productBrand.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Configurar los event listeners iniciales
    reconfigurarEventListeners();
}); 

// Autocomplete y validación en modal de agregar producto
(function() {
    const input = document.getElementById('producto_autocomplete');
    const suggestions = document.getElementById('autocomplete_suggestions');
    const hiddenId = document.getElementById('producto_id_hidden');
    const errorMsg = document.getElementById('addProductoErrorMsg');
    const form = document.querySelector('#agregarProductoModal form');
    let currentFocus = -1;
    let productos = [];

    if (!input || !suggestions || !hiddenId || !errorMsg || !form) {
        return;
    }

    // Obtener el ID del proveedor de la URL
    function getProveedorId() {
        const urlParts = window.location.pathname.split('/');
        for (let i = 0; i < urlParts.length - 1; i++) {
            if (urlParts[i] === 'proveedor' && urlParts[i + 2] === 'productos') {
                const proveedorId = urlParts[i + 1];
                return proveedorId;
            }
        }
        return null;
    }

    function closeSuggestions() {
        suggestions.innerHTML = '';
        suggestions.style.display = 'none';
        currentFocus = -1;
    }

    function showError(message) {
        errorMsg.innerHTML = message;
        errorMsg.classList.remove('d-none');
    }

    function clearError() {
        errorMsg.innerHTML = '';
        errorMsg.classList.add('d-none');
    }

    function renderSuggestions(items) {
        suggestions.innerHTML = '';
        if (!items.length) {
            suggestions.style.display = 'none';
            return;
        }
        // Limitar a 5 resultados
        const limitedItems = items.slice(0, 5);
        // Ajustar el ancho del contenedor al del input
        suggestions.style.width = input.offsetWidth + 'px';
        limitedItems.forEach((item, idx) => {
            const div = document.createElement('button');
            div.type = 'button';
            div.className = 'list-group-item list-group-item-action';
            div.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${item.nombre}</strong>
                        <br>
                        <small class="text-muted">Código: ${item.codigo} | Marca: ${item.marca}</small>
                    </div>
                    <span class="badge bg-primary rounded-pill">$${item.precio_venta}</span>
                </div>
            `;
            div.onclick = function() {
                input.value = item.nombre;
                hiddenId.value = item.id;
                closeSuggestions();
                clearError();
            };
            suggestions.appendChild(div);
        });
        suggestions.style.display = 'block';
    }

    function fetchProductos() {
        const q = input.value.trim();
        const proveedorId = getProveedorId();
        
        // Mostrar todos los productos si no hay texto de búsqueda
        if (q.length === 0) {
            if (!proveedorId) {
                closeSuggestions();
                hiddenId.value = '';
                return;
            }
            
            const url = `/proveedor/autocomplete_productos/?q=${encodeURIComponent('')}&proveedor=${proveedorId}`;
            
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    productos = data.results || [];
                    renderSuggestions(productos);
                    hiddenId.value = '';
                })
                .catch(error => {
                    console.error('Error al buscar productos:', error);
                });
            return;
        }
        
        if (!proveedorId) {
            return;
        }
        
        const url = `/proveedor/autocomplete_productos/?q=${encodeURIComponent(q)}&proveedor=${proveedorId}`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                productos = data.results || [];
                renderSuggestions(productos);
                
                if (productos.length === 1) {
                    hiddenId.value = productos[0].id;
                } else {
                    hiddenId.value = '';
                }
            })
            .catch(error => {
                console.error('Error al buscar productos:', error);
            });
    }

    input.addEventListener('input', fetchProductos);
    // Mostrar sugerencias al enfocar el input
    const productoInput = document.getElementById('producto_autocomplete');
    if (productoInput) {
      productoInput.addEventListener('focus', function() {
        fetchProductos();
      });
    }

    input.addEventListener('keydown', function(e) {
        const items = suggestions.querySelectorAll('.list-group-item');
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
        }
    });

    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestions.contains(e.target)) {
            closeSuggestions();
        }
    });

    // Validar formulario antes de enviar
    form.addEventListener('submit', function(e) {
        if (!hiddenId.value) {
            e.preventDefault();
            showError('Por favor, seleccione un producto de la lista.');
            input.focus();
            return false;
        }
        clearError();
    });

        // Limpiar al abrir el modal
    const modal = document.getElementById('agregarProductoModal');
    if (modal) {
      modal.addEventListener('show.bs.modal', function() {
        input.value = '';
        hiddenId.value = '';
        closeSuggestions();
        clearError();
      });
      
      // Limpiar al cerrar el modal
      modal.addEventListener('hidden.bs.modal', function() {
        input.value = '';
        hiddenId.value = '';
        closeSuggestions();
        clearError();
        
        // Limpiar errores de validación
        const form = modal.querySelector('form');
        if (form) {
          form.reset();
          form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
          form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
          form.querySelectorAll('.modal-alert').forEach(el => el.remove());
        }
        
        // Restaurar botón si está deshabilitado
        const submitButton = modal.querySelector('button[type="submit"]');
        if (submitButton && submitButton.disabled) {
          submitButton.disabled = false;
          submitButton.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Agregar';
        }
      });
    }
})();

// Función para mostrar mensaje en página (igual que en categorías)
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

// Función para mostrar mensaje con botón deshacer (igual que en categorías)
function mostrarMensajeConDeshacer(mensaje, productoId, proveedorId) {
  
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
    transition: transform 3s linear;
  `;
  
  notification.appendChild(progressBar);
  
  // Contenido de la notificación con botón deshacer
  notification.innerHTML += `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="flex: 1;">
        <div style="font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 8px;">
          ${mensaje}
        </div>
        <button onclick="restaurarProductoProveedor(${proveedorId}, ${productoId}, this)" 
                style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s; width: 100%;">
          Deshacer
        </button>
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
  
  // Auto-remover después de 5 segundos (más tiempo para deshacer)
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
  
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

// Función para restaurar producto eliminado
function restaurarProductoProveedor(proveedorId, productoId, button) {
  
  // Deshabilitar botón durante la operación
  button.disabled = true;
  button.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Restaurando...';
  
  // Obtener datos del producto eliminado del sessionStorage
  const productoEliminado = JSON.parse(sessionStorage.getItem('productoEliminado'));
  
  $.ajax({
    url: `/proveedor/${proveedorId}/productos/restaurar/${productoId}/`,
    type: 'POST',
    data: {
      'csrfmiddlewaretoken': $('[name=csrfmiddlewaretoken]').val(),
      'precio_proveedor': productoEliminado ? productoEliminado.precioProveedor : null
    },
    success: function (data) {
      // Cerrar la notificación
      button.closest('.notification').remove();
      
      // Verificar si hay mensaje de "no hay productos"
      const mensajeNoProductos = $('.alert-info:contains("No hay productos")');
      
      if (mensajeNoProductos.length > 0) {
        // Si hay mensaje de "no hay productos", reemplazarlo con la tabla
        const contenedorMensaje = mensajeNoProductos.closest('.card-body');
        if (contenedorMensaje.length > 0) {
          // Recrear la tabla en el mismo contenedor
          contenedorMensaje.html(`
            <div class="table-responsive">
              <table class="table datatable table-bordered table-striped table-hover align-middle" style="width: 100%;">
                <thead class="table-dark">
                  <tr>
                    <th class="text-center">Nombre</th>
                    <th class="text-center">Marca</th>
                    <th class="text-center">Stock</th>
                    <th class="text-center">Precio Venta</th>
                    <th class="text-center">Precio Proveedor</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                </tbody>
              </table>
            </div>
          `);
          
          // Inicializar DataTable
          setTimeout(() => {
            if (!$.fn.DataTable.isDataTable('.datatable')) {
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
                  { orderable: false, targets: -1 }
                ],
                pagingType: 'full_numbers'
              });
            }
          }, 100);
        }
      }
      
      // Buscar filas ocultas primero
      const filaOculta = $('.datatable tbody tr:hidden');
      if (filaOculta.length > 0) {
        // Mostrar la primera fila oculta
        filaOculta.first().show();
        
        // Si DataTable existe, redibujar
        if ($.fn.DataTable.isDataTable('.datatable')) {
          $('.datatable').DataTable().draw();
        }
      } else if (productoEliminado && productoEliminado.id == productoId) {
        // Si no hay filas ocultas pero hay datos en sessionStorage, restaurar la fila
        let nuevaFila = $(productoEliminado.filaHtml);
        
        // Actualizar el precio del proveedor en la fila si viene en la respuesta
        if (data.precio_proveedor !== undefined) {
          const precioFormateado = new Intl.NumberFormat('es-CL').format(data.precio_proveedor);
          nuevaFila.find('td:eq(4)').text(`$${precioFormateado}`);
        }
        
        // Buscar la tabla y agregar la fila al final del tbody
        const tbody = $('.datatable tbody');
        if (tbody.length > 0) {
          tbody.append(nuevaFila);
          // Asegurar que la fila sea visible
          nuevaFila.show();
          
          // Si DataTable existe, redibujar
          if ($.fn.DataTable.isDataTable('.datatable')) {
            $('.datatable').DataTable().draw();
          }
        }
      } else {
        // Si no hay filas ocultas ni datos en sessionStorage, actualizar la tabla completa
        actualizarTablaProductos();
      }
      
      // Mostrar mensaje de restauración exitosa
      mostrarMensajeEnPagina('Producto restaurado correctamente.', 'success');
      
      // Limpiar datos del sessionStorage
      sessionStorage.removeItem('productoEliminado');
    },
    error: function (xhr, status, error) {
      let mensaje = 'Error al restaurar el producto.';
      
      try {
        const response = JSON.parse(xhr.responseText);
        if (response.message) {
          mensaje = response.message;
        }
      } catch (e) {
        // No se pudo parsear la respuesta JSON
      }
      
      // Mostrar mensaje de error
      mostrarMensajeEnPagina(mensaje, 'danger');
      
      // Restaurar botón en caso de error
      button.disabled = false;
      button.innerHTML = 'Deshacer';
    }
  });
}

// Manejo de AJAX para eliminación de productos (igual que en categorías)
$(document).ready(function() {
  // Variables para el modal de eliminación
  let idProductoEliminar = null;
  let idProveedorEliminar = null;
  let filaProducto = null;

  // Abrir modal de eliminación y guardar datos
  $(document).on('click', 'button[data-bs-target="#deleteProductoModal"]', function () {
    idProductoEliminar = $(this).data('producto-id');
    idProveedorEliminar = $(this).data('proveedor-id');
    filaProducto = $(this).closest('tr');
    const nombre = $(this).data('producto-nombre');
    $('#deleteProductoName').text(nombre);
  });

  // Confirmar eliminación por AJAX
  $('#deleteProductoForm').on('submit', function (e) {
    e.preventDefault();
    if (!idProductoEliminar || !idProveedorEliminar) return;
    
    $.ajax({
      url: `/proveedor/${idProveedorEliminar}/productos/eliminar/${idProductoEliminar}/`,
      type: 'POST',
      data: {
        'csrfmiddlewaretoken': $('[name=csrfmiddlewaretoken]').val()
      },
      success: function (data) {
        // Cerrar modal
        $('#deleteProductoModal').modal('hide');
        
        // Guardar datos del producto eliminado en sessionStorage para poder restaurarlo
        const productoEliminado = {
          id: idProductoEliminar,
          proveedorId: idProveedorEliminar,
          nombre: $('#deleteProductoName').text(),
          filaHtml: filaProducto.prop('outerHTML'),
          precioProveedor: filaProducto.find('td:eq(4)').text().replace(/[^\d]/g, ''), // Extraer precio del proveedor
          timestamp: new Date().getTime()
        };
        sessionStorage.setItem('productoEliminado', JSON.stringify(productoEliminado));
        
        // Verificar si era el último producto antes de ocultar
        const filasVisibles = $('.datatable tbody tr:visible').length;
        
        if (filasVisibles === 1) {
          // Si era el último producto, reemplazar toda la tabla con el mensaje
          const contenedorTabla = $('.datatable').closest('.card-body');
          if (contenedorTabla.length > 0) {
            // Reemplazar el contenido del contenedor con el mensaje
            contenedorTabla.html(`
              <div class="text-center px-4 py-4">
                <div class="alert alert-info mb-0">No hay productos en este proveedor.</div>
              </div>
            `);
          }
        } else {
          // Si no era el último producto, solo ocultar la fila
          filaProducto.hide();
        }
        
        // Mostrar mensaje de éxito con opción de deshacer
        mostrarMensajeConDeshacer('Producto eliminado del proveedor exitosamente.', idProductoEliminar, idProveedorEliminar);
      },
      error: function (xhr, status, error) {
        $('#deleteProductoModal').modal('hide');
        let mensaje = 'Error al eliminar el producto del proveedor.';
        
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.message) {
            mensaje = response.message;
          }
        } catch (e) {
          // No se pudo parsear la respuesta JSON
        }
        
        // Mostrar mensaje de error
        mostrarMensajeEnPagina(mensaje, 'danger');
      }
    });
  });
});

// Manejar el envío del formulario de agregar producto con AJAX
const addProductForm = document.getElementById('agregarProductoModal').querySelector('form');

if (addProductForm) {
  addProductForm.addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();
    
    const formData = new FormData(this);
    const modal = document.getElementById('agregarProductoModal');
    const submitButton = modal.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Deshabilitar botón y mostrar loading
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Agregando...';
    
    fetch(this.action, {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRFToken': formData.get('csrfmiddlewaretoken')
      }
    })
    .then(response => {
      
      // Verificar si es redirección
      if (response.redirected || response.status === 302) {
        
        // Mostrar mensaje de éxito y actualizar tabla
        mostrarMensajeEnPagina("Producto agregado exitosamente.", "success");
        actualizarTablaProductos();
        return null;
      }
      
      // Intentar parsear como JSON
      return response.json();
    })
    .then(data => {
      if (data) {
        
        if (data.success) {
          // Operación exitosa
          
          // Cerrar el modal
          const modalElement = document.getElementById('agregarProductoModal');
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          } else {
            // Si no hay instancia, usar jQuery
            $('#agregarProductoModal').modal('hide');
          }
          
          // Mostrar mensaje de éxito en la página principal (solo si no se mostró antes)
          if (!response.redirected && response.status !== 302) {
            mostrarMensajeEnPagina(data.message || "Producto agregado exitosamente.", 'success');
          }
          
          // Actualizar la tabla dinámicamente
          actualizarTablaProductos();
        } else {
          // Error
          const modal = document.getElementById('agregarProductoModal');
          let alertDiv = modal.querySelector('.modal-alert');
          
          if (!alertDiv) {
            alertDiv = document.createElement('div');
            alertDiv.className = 'modal-alert alert alert-danger mt-3';
            const modalFooter = modal.querySelector('.modal-footer');
            modalFooter.insertBefore(alertDiv, modalFooter.firstChild);
          }
          
          alertDiv.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>${data.message}`;
          alertDiv.style.display = 'block';
          
          // Mostrar errores específicos de campos si existen
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
        
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
      } else {
        
        // Si no hay datos JSON pero la respuesta fue exitosa, cerrar modal y actualizar
        const modalElement = document.getElementById('agregarProductoModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        } else {
          // Si no hay instancia, usar jQuery
          $('#agregarProductoModal').modal('hide');
        }
        
        // Actualizar la tabla dinámicamente
        actualizarTablaProductos();
        
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
      }
    })
    .catch(error => {
      console.error('Error en agregar:', error);
      
      // Restaurar botón en caso de error
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
      
      // Mostrar mensaje de error
      mostrarMensajeEnPagina("Error al agregar el producto. Intente nuevamente.", "danger");
    });
    
    return false;
  });
}

// Función para reconfigurar los event listeners de los botones de editar
function reconfigurarEventListeners() {
    // Configurar modal de editar precio
    const editPriceButtons = document.querySelectorAll('.btn-edit-precio');
    editPriceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productoId = this.getAttribute('data-producto-id');
            const productoNombre = this.getAttribute('data-producto-nombre');
            const precioActual = this.getAttribute('data-precio-actual');
            const url = this.getAttribute('data-url');
            
            document.getElementById('edit-producto-id').value = productoId;
            document.getElementById('edit-precio-proveedor').value = Math.round(Number(precioActual));
            document.getElementById('editarPrecioForm').action = url;
        });
    });

    // Configurar modal de eliminar producto
    const deleteProductButtons = document.querySelectorAll('.btn-delete-producto');
    deleteProductButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productoId = this.getAttribute('data-producto-id');
            const productoNombre = this.getAttribute('data-producto-nombre');
            const url = this.getAttribute('data-url');
            
            document.getElementById('delete-producto-id').value = productoId;
            document.getElementById('deleteProductoName').textContent = productoNombre;
            document.getElementById('deleteProductoForm').action = url;
        });
    });
}

// Función para actualizar la tabla de productos dinámicamente
function actualizarTablaProductos(productoAgregado = null) {
  
  // Obtener el ID del proveedor de la URL
  const urlParts = window.location.pathname.split('/');
  let proveedorId = null;
  for (let i = 0; i < urlParts.length - 1; i++) {
    if (urlParts[i] === 'proveedor' && urlParts[i + 2] === 'productos') {
      proveedorId = urlParts[i + 1];
      break;
    }
  }
  
  if (!proveedorId) {
    console.error('No se pudo obtener el ID del proveedor de la URL');
    return;
  }
  
  // Hacer petición AJAX para obtener la tabla actualizada
  fetch(`/proveedor/${proveedorId}/productos/`)
    .then(response => response.text())
    .then(html => {
      // Crear un DOM temporal para parsear el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Buscar la tabla actualizada
      const nuevaTabla = doc.querySelector('.table-responsive');
      const nuevoMensaje = doc.querySelector('.alert-info');
      
      // Buscar elementos actuales
      const tablaActual = document.querySelector('.table-responsive');
      const mensajeActual = document.querySelector('.alert-info');
      
      if (nuevaTabla && tablaActual) {
        // Reemplazar la tabla actual con la nueva
        tablaActual.outerHTML = nuevaTabla.outerHTML;
        
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
            { orderable: false, targets: -1 }
          ],
          pagingType: 'full_numbers'
        });
        
        // Reconfigurar el buscador
        $('#buscarProducto').off('keyup').on('keyup', function () {
          table.search(this.value).draw();
        });
        
        // Reconfigurar los event listeners de los botones
        reconfigurarEventListeners();
        
      } else if (nuevaTabla && mensajeActual) {
        // Si no existe la tabla actual pero sí existe el mensaje, reemplazar el mensaje por la tabla
        mensajeActual.closest('.card-body').innerHTML = nuevaTabla.outerHTML;
        
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
            { orderable: false, targets: -1 }
          ],
          pagingType: 'full_numbers'
        });
        
        // Reconfigurar el buscador
        $('#buscarProducto').off('keyup').on('keyup', function () {
          table.search(this.value).draw();
        });
        
        // Reconfigurar los event listeners de los botones
        reconfigurarEventListeners();
        
      } else if (nuevoMensaje) {
        // No hay productos, mostrar mensaje
        const contenedorActual = document.querySelector('.action-bar').nextElementSibling;
        
        if (contenedorActual) {
          contenedorActual.outerHTML = nuevoMensaje.parentElement.parentElement.outerHTML;
        } else {
          console.error('No se pudo encontrar el contenedor para mostrar el mensaje');
        }
      } else {
        console.error('No se pudo encontrar la tabla ni el mensaje en la respuesta');
      }
    })
    .catch(error => {
      console.error('Error al actualizar la tabla:', error);
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
        { orderable: false, targets: -1 }
      ],
      pagingType: 'full_numbers'
    });
  
    $('#buscarProducto').on('keyup', function () {
      table.search(this.value).draw();
    });
  });
  
// Script para el escaneo de códigos (igual que compras/ventas/categoría)
(function() {
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

        // Validar el código (AJAX, igual que en compras/ventas/categoría)
        fetch('/proveedor/validar_codigo/?codigo=' + encodeURIComponent(codigo))
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
              const addManualModal = new bootstrap.Modal(document.getElementById('agregarProductoModal'));
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
})();
  