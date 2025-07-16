$(document).ready(function () {
  const botonesEliminar = document.querySelectorAll(".btn-delete-producto");
  const formEliminar = document.getElementById("deleteCategoryForm");
  const inputProductoId = document.getElementById("delete-id");
  const spanNombreProducto = document.getElementById("deleteCategoryName");

  botonesEliminar.forEach(btn => {
    btn.addEventListener("click", function () {
      inputProductoId.value = this.getAttribute("data-producto-id");
      spanNombreProducto.textContent = this.getAttribute("data-producto-nombre");
      formEliminar.action = this.getAttribute("data-url");
    });
  });
});

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
    // Buscar solo en las columnas de nombre, marca y código SKU
    $('.datatable').DataTable().columns([0,1,2]).search(this.value).draw();
  });
});

// Configuración global para la paginación de DataTables
$.fn.DataTable.ext.pager.numbers_length = 5;

// Función para mostrar mensaje en página (igual que en categorías)
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

// Función para mostrar mensaje con botón deshacer (igual que en categorías)
function mostrarMensajeConDeshacer(mensaje, productoId, categoriaId) {
  console.log('Mostrando mensaje con deshacer:', mensaje, productoId, categoriaId);
  
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
                  onclick="restaurarProductoCategoria(${categoriaId}, ${productoId}, this)" 
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

// Función para restaurar producto en categoría (igual que restaurarCategoria)
function restaurarProductoCategoria(categoriaId, productoId, button) {
  const productoEliminadoStr = sessionStorage.getItem('productoEliminado');
  if (!productoEliminadoStr) return;
  
  const productoEliminado = JSON.parse(productoEliminadoStr);
  
  // Verificar que no hayan pasado más de 5 minutos (300000 ms)
  const tiempoTranscurrido = new Date().getTime() - productoEliminado.timestamp;
  if (tiempoTranscurrido > 300000) {
    alert('El tiempo para deshacer ha expirado (5 minutos).');
    sessionStorage.removeItem('productoEliminado');
    return;
  }
  
  // Hacer petición AJAX para restaurar el producto en la base de datos
  $.ajax({
    url: `/categoria/${categoriaId}/restaurar_producto/${productoEliminado.id}/`,
    type: 'POST',
    data: {
      'csrfmiddlewaretoken': $('[name=csrfmiddlewaretoken]').val()
    },
    success: function (data) {
      // Ocultar la notificación actual
      const notification = button.closest('.notification');
      if (notification) {
        notification.remove();
      }
      
      // Verificar si la tabla está oculta (cuando no hay productos)
      const mensajeNoProductos = $('.alert-info:contains("No hay productos en esta categoría")');
      
      if (mensajeNoProductos.length > 0) {
        // Buscar el contenedor donde está el mensaje
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
                    <th class="text-center">Precio</th>
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
      
      // Restaurar la fila en la tabla
      const nuevaFila = $(productoEliminado.filaHtml);
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
      } else {
        // Si no encuentra la tabla con clase específica, buscar cualquier tabla
        $('table tbody').first().append(nuevaFila);
        nuevaFila.show();
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
    }
  });
}

// Manejo de AJAX para eliminación de productos (igual que en categorías)
$(document).ready(function() {
  // Variables para el modal de eliminación
  let idProductoEliminar = null;
  let idCategoriaEliminar = null;
  let filaProducto = null;

  // Abrir modal de eliminación y guardar datos
  $(document).on('click', 'button[data-bs-target="#deleteCategoryModal"]', function () {
    idProductoEliminar = $(this).data('producto-id');
    idCategoriaEliminar = $(this).data('categoria-id');
    filaProducto = $(this).closest('tr');
    const nombre = $(this).data('producto-nombre');
    $('#deleteCategoryName').text(nombre);
  });

  // Confirmar eliminación por AJAX
  $('#deleteCategoryForm').on('submit', function (e) {
    e.preventDefault();
    if (!idProductoEliminar || !idCategoriaEliminar) return;
    
    $.ajax({
      url: `/categoria/${idCategoriaEliminar}/productos/eliminar/${idProductoEliminar}/`,
      type: 'POST',
      data: {
        'csrfmiddlewaretoken': $('[name=csrfmiddlewaretoken]').val()
      },
      success: function (data) {
        // Cerrar modal
        $('#deleteCategoryModal').modal('hide');
        
        // Guardar datos del producto eliminado en sessionStorage para poder restaurarlo
        const productoEliminado = {
          id: idProductoEliminar,
          categoriaId: idCategoriaEliminar,
          nombre: $('#deleteCategoryName').text(),
          filaHtml: filaProducto.prop('outerHTML'),
          timestamp: new Date().getTime()
        };
        sessionStorage.setItem('productoEliminado', JSON.stringify(productoEliminado));
        
        // Ocultar fila de la tabla
        filaProducto.hide();
        
        // Verificar si era el último producto
        const filasVisibles = $('.datatable tbody tr:visible').length;
        if (filasVisibles === 0) {
          // Buscar el contenedor de la tabla
          const contenedorTabla = $('.datatable').closest('.card-body');
          if (contenedorTabla.length > 0) {
            // Reemplazar el contenido del contenedor con el mensaje
            contenedorTabla.html(`
              <div class="text-center px-4 py-4">
                <div class="alert alert-info mb-0">No hay productos en esta categoría.</div>
              </div>
            `);
          }
        }
        
        // Mostrar mensaje de éxito con opción de deshacer
        mostrarMensajeConDeshacer('Producto eliminado de la categoría exitosamente.', idProductoEliminar, idCategoriaEliminar);
        
        // Actualizar la lista de productos disponibles en el modal
        actualizarListaProductosDisponibles(idCategoriaEliminar);
      },
      error: function (xhr, status, error) {
        $('#deleteCategoryModal').modal('hide');
        let mensaje = 'Error al eliminar el producto de la categoría.';
        
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
        'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => {
      return response.json().catch(() => null);
    })
    .then(data => {
      if (data && data.success) {
        // Operación exitosa
        const modal = bootstrap.Modal.getInstance(document.getElementById('agregarProductoModal'));
        if (modal) modal.hide();
        mostrarMensajeEnPagina(data.message, 'success');
        
        // Actualizar la tabla dinámicamente
        actualizarTablaProductos(data.producto);
        
        // Actualizar la lista de productos disponibles en el modal
        const urlParts = window.location.pathname.split('/');
        let categoriaId = null;
        for (let i = 0; i < urlParts.length - 1; i++) {
          if (urlParts[i] === 'categoria' && urlParts[i + 2] === 'productos') {
            categoriaId = urlParts[i + 1];
            break;
          }
        }
        if (categoriaId) {
          actualizarListaProductosDisponibles(categoriaId);
        }
        
        // Limpiar el formulario
        addProductForm.reset();
      } else if (data && data.message) {
        // Error con mensaje
        mostrarMensajeEnPagina(data.message, 'danger');
      } else {
        // Si no hay datos o la respuesta no es JSON, cerrar modal y mostrar advertencia
        const modal = bootstrap.Modal.getInstance(document.getElementById('agregarProductoModal'));
        if (modal) modal.hide();
        mostrarMensajeEnPagina('Producto agregado, pero hubo un problema al procesar la respuesta.', 'warning');
        // Actualizar la tabla por si acaso
        actualizarTablaProductos();
      }
      // Restaurar botón
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    })
    .catch(error => {
      // Si hay error, cerrar el modal y restaurar el botón
      const modal = bootstrap.Modal.getInstance(document.getElementById('agregarProductoModal'));
      if (modal) modal.hide();
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
      mostrarMensajeEnPagina('Error inesperado al agregar el producto.', 'danger');
    });
    return false;
  });
}

// Función para actualizar la lista de productos disponibles en el modal
function actualizarListaProductosDisponibles(categoriaId) {
  fetch(`/categoria/${categoriaId}/productos/disponibles/`, {
    method: 'GET',
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.productos) {
      // Obtener el select del modal
      const selectProductos = document.querySelector('#agregarProductoModal select[name="producto_id"]');
      if (selectProductos) {
        // Limpiar opciones existentes (mantener la primera opción por defecto)
        const primeraOpcion = selectProductos.querySelector('option[value=""]');
        selectProductos.innerHTML = '';
        
        // Restaurar la primera opción
        if (primeraOpcion) {
          selectProductos.appendChild(primeraOpcion);
        } else {
          // Si no existe, crear la opción por defecto
          const opcionDefault = document.createElement('option');
          opcionDefault.value = '';
          opcionDefault.selected = true;
          opcionDefault.disabled = true;
          opcionDefault.textContent = 'Seleccione un producto';
          selectProductos.appendChild(opcionDefault);
        }
        
        // Agregar las nuevas opciones
        data.productos.forEach(producto => {
          const opcion = document.createElement('option');
          opcion.value = producto.id;
          opcion.textContent = `${producto.nombre} (${producto.marca})`;
          selectProductos.appendChild(opcion);
        });
      }
    }
  })
  .catch(error => {
    // Error al actualizar lista de productos disponibles
  });
}

// Función para actualizar la tabla de productos dinámicamente
function actualizarTablaProductos(productoAgregado = null) {
  if (productoAgregado && productoAgregado.id) {
    // Si tenemos datos del producto agregado, agregarlo directamente a la tabla
    let tabla = document.querySelector('.datatable tbody');
    
    // Si no existe la tabla, crearla dinámicamente
    if (!tabla) {
      // Buscar el contenedor donde debería estar la tabla
      let contenedorTabla = null;
      
      // Buscar específicamente el contenedor de la tabla de productos
      // Primero buscar por el mensaje "No hay productos"
      const mensajeNoProductos = document.querySelector('.alert-info');
      if (mensajeNoProductos) {
        contenedorTabla = mensajeNoProductos.closest('.card-body');
      }
      
      // Si no lo encuentra por el mensaje, buscar por la estructura específica
      if (!contenedorTabla) {
        // Buscar el card que contiene la tabla de productos (no el de descripción)
        const cards = document.querySelectorAll('.card');
        for (let card of cards) {
          const cardHeader = card.querySelector('.card-header');
          if (cardHeader && cardHeader.textContent.includes('Productos de la Categoría')) {
            contenedorTabla = card.querySelector('.card-body');
            break;
          }
        }
      }
      
      // Si aún no lo encuentra, buscar el último card-body (que debería ser el de productos)
      if (!contenedorTabla) {
        const cardBodies = document.querySelectorAll('.card-body');
        if (cardBodies.length > 1) {
          contenedorTabla = cardBodies[cardBodies.length - 1]; // El último card-body
        }
      }
      
      if (!contenedorTabla) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }
      
      // Remover el mensaje "No hay productos" si existe
      const mensajeNoProductosEnContenedor = contenedorTabla.querySelector('.alert-info');
      if (mensajeNoProductosEnContenedor) {
        mensajeNoProductosEnContenedor.remove();
      }
      
      // Destruir DataTables existente si existe
      if ($.fn.DataTable.isDataTable('.datatable')) {
        $('.datatable').DataTable().destroy();
      }
      
      // Crear la estructura completa de la tabla
      const tablaHTML = `
        <div class="table-responsive">
          <table class="table datatable table-bordered table-striped table-hover align-middle" style="width: 100%;">
            <thead class="table-dark">
              <tr>
                <th class="text-center">Nombre</th>
                <th class="text-center">Marca</th>
                <th class="text-center">Código SKU</th>
                <th class="text-center">Stock</th>
                <th class="text-center">Precio</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        </div>
      `;
      
      contenedorTabla.innerHTML = tablaHTML;
      tabla = document.querySelector('.datatable tbody');
      
      if (!tabla) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }
    }
    
    if (tabla) {
      // Obtener la categoría ID de la URL de manera más robusta
      const urlParts = window.location.pathname.split('/');
      let categoriaId = null;
      
      // Buscar el patrón /categoria/{id}/productos/
      for (let i = 0; i < urlParts.length - 1; i++) {
        if (urlParts[i] === 'categoria' && urlParts[i + 2] === 'productos') {
          categoriaId = urlParts[i + 1];
          break;
        }
      }
      
      if (!categoriaId) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }
      
      // Re-inicializar DataTable si es necesario
      if ($.fn.DataTable.isDataTable('.datatable')) {
        // Obtener la instancia de DataTable
        const dataTable = $('.datatable').DataTable();
        
        // Agregar la nueva fila usando la API de DataTable
        const nuevaFila = document.createElement('tr');
        nuevaFila.innerHTML = `
          <td class="text-center align-middle">
            ${productoAgregado.nombre || '<span class="text-muted fst-italic">Sin nombre</span>'}
          </td>
          <td class="text-center align-middle">
            ${productoAgregado.marca || '<span class="text-muted fst-italic">Sin marca</span>'}
          </td>
          <td class="text-center align-middle">
            ${productoAgregado.codigo || '<span class="text-muted fst-italic">Sin código</span>'}
          </td>
          <td class="text-center align-middle">${productoAgregado.stock || 0} unidades</td>
          <td class="text-center align-middle">$${(productoAgregado.precio || 0).toLocaleString()}</td>
          <td class="text-center align-middle">
            <button
              type="button"
              class="btn btn-sm btn-danger btn-delete-producto"
              data-bs-toggle="modal"
              data-bs-target="#deleteCategoryModal"
              data-producto-id="${productoAgregado.id}"
              data-producto-nombre="${productoAgregado.nombre || 'Sin nombre'}"
              data-categoria-id="${categoriaId}"
              data-url="/categoria/${categoriaId}/productos/eliminar/${productoAgregado.id}/"
              title="Eliminar producto"
            >
              <i class="bi bi-trash"></i>
            </button>
          </td>
        `;
        
        dataTable.row.add(nuevaFila).draw();
      } else {
        // Agregar la fila manualmente primero
        const nuevaFila = document.createElement('tr');
        nuevaFila.innerHTML = `
          <td class="text-center align-middle">
            ${productoAgregado.nombre || '<span class="text-muted fst-italic">Sin nombre</span>'}
          </td>
          <td class="text-center align-middle">
            ${productoAgregado.marca || '<span class="text-muted fst-italic">Sin marca</span>'}
          </td>
          <td class="text-center align-middle">
            ${productoAgregado.codigo || '<span class="text-muted fst-italic">Sin código</span>'}
          </td>
          <td class="text-center align-middle">${productoAgregado.stock || 0} unidades</td>
          <td class="text-center align-middle">$${(productoAgregado.precio || 0).toLocaleString()}</td>
          <td class="text-center align-middle">
            <button
              type="button"
              class="btn btn-sm btn-danger btn-delete-producto"
              data-bs-toggle="modal"
              data-bs-target="#deleteCategoryModal"
              data-producto-id="${productoAgregado.id}"
              data-producto-nombre="${productoAgregado.nombre || 'Sin nombre'}"
              data-categoria-id="${categoriaId}"
              data-url="/categoria/${categoriaId}/productos/eliminar/${productoAgregado.id}/"
              title="Eliminar producto"
            >
              <i class="bi bi-trash"></i>
            </button>
          </td>
        `;
        
        tabla.appendChild(nuevaFila);
        
        // Inicializar DataTable después de agregar la fila
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
        }, 200);
      }
      
      return;
    }
  }
  
  // Si no tenemos datos del producto o no se pudo agregar, usar recarga
  setTimeout(() => {
    window.location.reload();
  }, 1500);
}

// --- Autocompletado para agregar producto a categoría ---
(function() {
  const input = document.getElementById('producto_autocomplete');
  const suggestions = document.getElementById('autocomplete_suggestions');
  const hiddenId = document.getElementById('producto_id_hidden');
  const errorMsg = document.getElementById('addProductoErrorMsg');
  const form = document.querySelector('#agregarProductoModal form');
  let currentFocus = -1;
  let productos = [];

  if (!input || !suggestions || !hiddenId || !errorMsg || !form) return;

  // Obtener el ID de la categoría de la URL
  function getCategoriaId() {
    const urlParts = window.location.pathname.split('/');
    for (let i = 0; i < urlParts.length - 1; i++) {
      if (urlParts[i] === 'categoria' && urlParts[i + 2] === 'productos') {
        const categoriaId = urlParts[i + 1];
        return categoriaId;
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
            <small class="text-muted">Código: ${item.codigo} | Marca: ${item.marca || ''}</small>
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
    const categoriaId = getCategoriaId();
    
    // Mostrar todos los productos si no hay texto de búsqueda
    if (q.length === 0) {
      if (!categoriaId) {
        closeSuggestions();
        hiddenId.value = '';
        return;
      }
      const url = `/categoria/autocomplete_productos/?q=${encodeURIComponent('')}&categoria_id=${categoriaId}`;
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
    
    if (!categoriaId) return;
    const url = `/categoria/autocomplete_productos/?q=${encodeURIComponent(q)}&categoria_id=${categoriaId}`;
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
  input.addEventListener('focus', function() {
    fetchProductos();
  });

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
  const addModal = document.getElementById('agregarProductoModal');
  if (addModal) {
    addModal.addEventListener('show.bs.modal', function() {
      clearError();
      input.value = '';
      hiddenId.value = '';
      closeSuggestions();
    });
  }
})();

// Script para el escaneo de códigos (igual que compras/ventas)
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

        // Validar el código (AJAX, igual que en compras/ventas)
        fetch('/categoria/validar_codigo/?codigo=' + encodeURIComponent(codigo))
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
