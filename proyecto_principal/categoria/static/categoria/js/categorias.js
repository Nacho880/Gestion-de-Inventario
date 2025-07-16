// Modales edición y eliminación 
const editCategoryModal = document.getElementById('editCategoryModal');
const deleteCategoryModal = document.getElementById('deleteCategoryModal');

editCategoryModal.addEventListener('show.bs.modal', function (event) {
  const button = event.relatedTarget;
  const id = button.getAttribute('data-id');
  const nombre = button.getAttribute('data-nombre');
  const descripcion = button.getAttribute('data-descripcion');

  document.getElementById('edit-id').value = id;
  document.getElementById('edit-nombre').value = nombre;
  document.getElementById('edit-descripcion').value = descripcion;

  document.getElementById('editCategoryForm').action = `/categoria/editar/${id}/`;
});

deleteCategoryModal.addEventListener('show.bs.modal', function (event) {
  const button = event.relatedTarget;
  const id = button.getAttribute('data-id');
  const nombre = button.getAttribute('data-nombre');

  document.getElementById('delete-id').value = id;
  document.getElementById('delete-nombre').textContent = nombre;

  document.getElementById('deleteCategoryForm').action = `/categoria/eliminar/${id}/`;
});

$(document).ready(function () {
  // Variables para el modal de eliminación
  let idCategoriaEliminar = null;
  let filaCategoria = null;

  // Configuración global para la paginación de DataTables
  $.fn.DataTable.ext.pager.numbers_length = 5;

  // Configurar DataTable
  const table = $('.datatable').DataTable({
    pagingType: 'full_numbers',
    language: {
      info: "Mostrando _START_ de _END_ | Total _TOTAL_ categoría(s)",
      infoEmpty: "Sin categorías para mostrar",
      lengthMenu: "Mostrar _MENU_ categorías",
      search: "🔍 Buscar:",
      zeroRecords: "No se encontraron resultados.",
      infoFiltered: "(filtrado de un total de _MAX_ categoría(s))",
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
      { orderable: false, targets: [1, 2] }
    ]
  });

  // Búsqueda en tiempo real
  $('#searchCategorias').on('keyup', function () {
    table.column(0).search(this.value).draw();
  });

  // Abrir modal de eliminación y guardar datos
  $(document).on('click', 'button[data-bs-target="#deleteCategoryModal"]', function () {
    idCategoriaEliminar = $(this).data('id');
    filaCategoria = $(this).closest('tr');
    const nombre = $(this).data('nombre');
    $('#delete-nombre').text(nombre);
  });

  // Confirmar eliminación por AJAX
  $('#deleteCategoryForm').on('submit', function (e) {
    e.preventDefault();
    if (!idCategoriaEliminar) return;
    
    console.log('Intentando eliminar categoría ID:', idCategoriaEliminar);
    
    $.ajax({
      url: `/categoria/eliminar/${idCategoriaEliminar}/`,
      type: 'POST',
      data: {
        'csrfmiddlewaretoken': $('[name=csrfmiddlewaretoken]').val()
      },
      success: function (data) {
        console.log('Respuesta exitosa:', data);
        // Cerrar modal
        $('#deleteCategoryModal').modal('hide');
        
        // Guardar datos de la categoría eliminada en sessionStorage para poder restaurarla
        const categoriaEliminada = {
          id: idCategoriaEliminar,
          nombre: $('#delete-nombre').text(),
          filaHtml: filaCategoria.prop('outerHTML'),
          timestamp: new Date().getTime()
        };
        sessionStorage.setItem('categoriaEliminada', JSON.stringify(categoriaEliminada));
        
        // Ocultar fila de la tabla
        filaCategoria.hide();
        
        // Verificar si era la última categoría
        const filasVisibles = $('#tablaCategorias tbody tr:visible').length;
        if (filasVisibles === 0) {
          // Ocultar toda la tabla y mostrar mensaje de "no hay categorías"
          $('.card.shadow-lg.border-0.mb-4').hide();
          const mensajeNoCategorias = `
            <div class="card shadow-lg border-0">
              <div class="card-body text-center px-4 py-4">
                <div class="alert alert-info mb-0">No hay categorías registradas.</div>
              </div>
            </div>
          `;
          $('.content').append(mensajeNoCategorias);
        }
        
        // Mostrar mensaje de éxito con opción de deshacer
        mostrarMensajeConDeshacer('Categoría eliminada exitosamente.', idCategoriaEliminar);
      },
      error: function (xhr, status, error) {
        console.log('Error en AJAX:', xhr.responseText);
        console.log('Status:', status);
        console.log('Error:', error);
        
        $('#deleteCategoryModal').modal('hide');
        let mensaje = 'Error al eliminar la categoría.';
        
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.message) {
            mensaje = response.message;
          }
        } catch (e) {
          console.log('No se pudo parsear la respuesta JSON');
        }
        
        // Mostrar mensaje de error
        mostrarMensajeEnPagina(mensaje, 'danger');
      }
    });
  });

  // Manejar el envío del formulario de agregar categoría con AJAX
  const addCategoryForm = document.getElementById('addCategoryModal').querySelector('form');
  console.log('Buscando formulario de agregar categoría:', addCategoryForm);
  
  if (addCategoryForm) {
    console.log('Formulario de agregar categoría encontrado, agregando event listener');
    
    addCategoryForm.addEventListener('submit', function (event) {
      console.log('Formulario de agregar categoría enviado, previniendo envío normal');
      event.preventDefault();
      event.stopPropagation();
      
      const formData = new FormData(this);
      const modal = document.getElementById('addCategoryModal');
      const submitButton = modal.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;
      
      console.log('Datos del formulario de agregar categoría:', {
        action: this.action,
        nombre: formData.get('nombre'),
        descripcion: formData.get('descripcion')
      });
      
      // Deshabilitar botón y mostrar loading
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Guardando...';
      
      fetch(this.action, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(response => response.json().catch(() => null))
      .then(data => {
        // Limpiar mensajes de error previos
        let alertDiv = modal.querySelector('.modal-alert');
        if (alertDiv) alertDiv.remove();
        const alertContainer = modal.querySelector('.modal-alert-container');
        if (alertContainer) alertContainer.innerHTML = '';
        const inputs = modal.querySelectorAll('.is-invalid');
        inputs.forEach(input => input.classList.remove('is-invalid'));
        const feedbacks = modal.querySelectorAll('.invalid-feedback');
        feedbacks.forEach(fb => fb.remove());

        if (data && data.success) {
          const modalInstance = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
          if (modalInstance) modalInstance.hide();
          mostrarMensajeEnPagina(data.message, 'success');
          actualizarTablaCategorias();
        } else if (data && data.errors) {
          // Mostrar solo mensaje general en el contenedor fijo
          if (alertContainer) {
            alertContainer.innerHTML = `<div class='modal-alert alert alert-danger mt-3 text-center'><i class=\"bi bi-exclamation-triangle me-2\"></i>${data.message}</div>`;
          }
        } else {
          mostrarMensajeEnPagina('Error inesperado al agregar la categoría.', 'danger');
        }
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
      })
      .catch(() => {
        mostrarMensajeEnPagina('Error inesperado al agregar la categoría.', 'danger');
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
      });
      return false;
    });
  } else {
    console.log('Formulario de agregar categoría NO encontrado');
  }
  
  // Manejar el envío del formulario de editar categoría con AJAX
  const editCategoryForm = document.getElementById('editCategoryModal').querySelector('form');
  console.log('Buscando formulario de editar categoría:', editCategoryForm);
  
  if (editCategoryForm) {
    console.log('Formulario de editar categoría encontrado, agregando event listener');
    
    editCategoryForm.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();

      const formData = new FormData(this);
      const modal = document.getElementById('editCategoryModal');
      const submitButton = modal.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;

      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Guardando...';

      fetch(this.action, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(response => response.json().catch(() => null))
      .then(data => {
        // Limpiar mensajes de error previos
        let alertDiv = modal.querySelector('.modal-alert');
        if (alertDiv) alertDiv.remove();
        const alertContainer = modal.querySelector('.modal-alert-container');
        if (alertContainer) alertContainer.innerHTML = '';
        const inputs = modal.querySelectorAll('.is-invalid');
        inputs.forEach(input => input.classList.remove('is-invalid'));
        const feedbacks = modal.querySelectorAll('.invalid-feedback');
        feedbacks.forEach(fb => fb.remove());

        if (data && data.success) {
          const modalInstance = bootstrap.Modal.getInstance(document.getElementById('editCategoryModal'));
          if (modalInstance) modalInstance.hide();
          mostrarMensajeEnPagina(data.message, 'success');
          actualizarTablaCategorias();
        } else if (data && data.errors) {
          // Mostrar solo mensaje general en el contenedor fijo
          if (alertContainer) {
            alertContainer.innerHTML = `<div class='modal-alert alert alert-danger mt-3 text-center'><i class=\"bi bi-exclamation-triangle me-2\"></i>${data.message}</div>`;
          }
        } else {
          mostrarMensajeEnPagina('Error inesperado al editar la categoría.', 'danger');
        }
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
      })
      .catch(() => {
        mostrarMensajeEnPagina('Error inesperado al editar la categoría.', 'danger');
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
      });
    });
  } else {
    console.log('Formulario de editar categoría NO encontrado');
  }

  const addCategoryModal = document.getElementById('addCategoryModal');
  if (addCategoryModal) {
    addCategoryModal.addEventListener('hidden.bs.modal', function () {
      const form = addCategoryModal.querySelector('form');
      if (form) {
        form.reset();
      }
      // Limpiar contadores de caracteres si existen
      const nombreCounter = document.getElementById('add-nombre-counter');
      if (nombreCounter) nombreCounter.textContent = '0';
      const descripcionCounter = document.getElementById('add-descripcion-counter');
      if (descripcionCounter) descripcionCounter.textContent = '0';
      // Limpiar mensajes de error
      const alertDiv = addCategoryModal.querySelector('.modal-alert');
      if (alertDiv) alertDiv.remove();
      const alertContainer = addCategoryModal.querySelector('.modal-alert-container');
      if (alertContainer) alertContainer.innerHTML = '';
      // Limpiar clases de error
      const inputs = addCategoryModal.querySelectorAll('.is-invalid');
      inputs.forEach(input => input.classList.remove('is-invalid'));
      const feedbacks = addCategoryModal.querySelectorAll('.invalid-feedback');
      feedbacks.forEach(fb => fb.remove());
    });
  }
});

// Función para mostrar notificaciones push modernas (igual que en productos)
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

// Función para mostrar mensaje con botón deshacer (igual que en productos)
function mostrarMensajeConDeshacer(mensaje, categoriaId) {
  console.log('Mostrando mensaje con deshacer:', mensaje, categoriaId);
  
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
                  onclick="restaurarCategoria(${categoriaId}, this)" 
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

// Función para restaurar categoría (llamada desde el botón deshacer)
function restaurarCategoria(categoriaId, button) {
  const categoriaEliminadaStr = sessionStorage.getItem('categoriaEliminada');
  if (!categoriaEliminadaStr) return;
  
  const categoriaEliminada = JSON.parse(categoriaEliminadaStr);
  
  // Verificar que no hayan pasado más de 5 minutos (300000 ms)
  const tiempoTranscurrido = new Date().getTime() - categoriaEliminada.timestamp;
  if (tiempoTranscurrido > 300000) {
    alert('El tiempo para deshacer ha expirado (5 minutos).');
    sessionStorage.removeItem('categoriaEliminada');
    return;
  }
  
  console.log('Intentando restaurar categoría ID:', categoriaEliminada.id);
  
  // Hacer petición AJAX para restaurar la categoría en la base de datos
  $.ajax({
    url: `/categoria/restaurar/${categoriaEliminada.id}/`,
    type: 'POST',
    data: {
      'csrfmiddlewaretoken': $('[name=csrfmiddlewaretoken]').val()
    },
    success: function (data) {
      console.log('Respuesta exitosa de restauración:', data);
      
      // Ocultar la notificación actual
      const notification = button.closest('.notification');
      if (notification) {
        notification.remove();
      }
      
      // Verificar si la tabla está oculta (cuando no hay categorías)
      const tablaOculta = $('.card.shadow-lg.border-0.mb-4').is(':hidden');
      
      if (tablaOculta) {
        // Si la tabla está oculta, mostrarla y ocultar el mensaje de "no hay categorías"
        $('.card.shadow-lg.border-0.mb-4').show();
        // Remover el mensaje de "no hay categorías" (el card que contiene el alert-info)
        $('.card.shadow-lg.border-0:has(.alert-info)').remove();
      }
      
      // Restaurar la fila en la tabla
      const nuevaFila = $(categoriaEliminada.filaHtml);
      // Buscar la tabla y agregar la fila al final del tbody
      const tbody = $('#tablaCategorias tbody');
      if (tbody.length > 0) {
        tbody.append(nuevaFila);
        // Asegurar que la fila sea visible
        nuevaFila.show();
      } else {
        // Si no encuentra la tabla con ID específico, buscar cualquier tabla
        $('table tbody').first().append(nuevaFila);
        nuevaFila.show();
      }
      
      // Mostrar mensaje de restauración exitosa
      mostrarMensajeEnPagina('Categoría restaurada correctamente.', 'success');
      
      // Limpiar datos del sessionStorage
      sessionStorage.removeItem('categoriaEliminada');
    },
    error: function (xhr, status, error) {
      console.log('Error en AJAX de restauración:', xhr.responseText);
      
      let mensaje = 'Error al restaurar la categoría.';
      
      try {
        const response = JSON.parse(xhr.responseText);
        if (response.message) {
          mensaje = response.message;
        }
      } catch (e) {
        console.log('No se pudo parsear la respuesta JSON');
      }
      
      // Mostrar mensaje de error
      mostrarMensajeEnPagina(mensaje, 'danger');
    }
  });
}

// Función para actualizar la tabla de categorías dinámicamente
function actualizarTablaCategorias() {
  console.log('Actualizando tabla de categorías...');
  
  // Hacer petición AJAX para obtener el HTML actualizado de la tabla
  fetch(window.location.href)
    .then(response => response.text())
    .then(html => {
      // Crear un elemento temporal para parsear el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Buscar la tabla actualizada
      const nuevaTabla = doc.querySelector('#tablaCategorias');
      const tablaActual = document.querySelector('#tablaCategorias');
      
      if (nuevaTabla && tablaActual) {
        // Reemplazar el contenido de la tabla
        tablaActual.innerHTML = nuevaTabla.innerHTML;
        
        // Reinicializar DataTable
        if ($.fn.DataTable.isDataTable('#tablaCategorias')) {
          $('#tablaCategorias').DataTable().destroy();
        }
        
        $('#tablaCategorias').DataTable({
          pagingType: 'full_numbers',
          language: {
            info: "Mostrando _START_ de _END_ | Total _TOTAL_ categoría(s)",
            infoEmpty: "Sin categorías para mostrar",
            lengthMenu: "Mostrar _MENU_ categorías",
            search: "🔍 Buscar:",
            zeroRecords: "No se encontraron resultados.",
            infoFiltered: "(filtrado de un total de _MAX_ categoría(s))",
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
            { orderable: false, targets: [1, 2] }
          ]
        });
        
        console.log('Tabla de categorías actualizada correctamente');
      } else {
        console.log('No se encontró la tabla para actualizar');
        // Si no se encuentra la tabla, recargar la página
        window.location.reload();
      }
    })
    .catch(error => {
      console.error('Error al actualizar tabla:', error);
      // Si hay error, recargar la página
      window.location.reload();
    });
}

// Funcionalidad del contador de caracteres para categorías
function inicializarContadorCaracteres() {
  // Contadores para modal de agregar
  const addNombre = document.getElementById('add-nombre');
  const addNombreCounter = document.getElementById('add-nombre-counter');
  const addDescripcion = document.getElementById('add-descripcion');
  const addDescripcionCounter = document.getElementById('add-descripcion-counter');
  
  // Contador para nombre (agregar)
  if (addNombre && addNombreCounter) {
    addNombre.addEventListener('input', function() {
      const longitud = this.value.length;
      addNombreCounter.textContent = longitud;
      
      // Cambiar color cuando se acerca al límite
      if (longitud >= 90) {
        addNombreCounter.style.color = '#dc3545'; // Rojo
      } else if (longitud >= 80) {
        addNombreCounter.style.color = '#ffc107'; // Amarillo
      } else {
        addNombreCounter.style.color = '#6c757d'; // Gris
      }
    });
    
    // Inicializar contador
    addNombreCounter.textContent = addNombre.value.length;
  }
  
  // Contador para descripción (agregar)
  if (addDescripcion && addDescripcionCounter) {
    addDescripcion.addEventListener('input', function() {
      const longitud = this.value.length;
      addDescripcionCounter.textContent = longitud;
      
      // Cambiar color cuando se acerca al límite
      if (longitud >= 900) {
        addDescripcionCounter.style.color = '#dc3545'; // Rojo
      } else if (longitud >= 800) {
        addDescripcionCounter.style.color = '#ffc107'; // Amarillo
      } else {
        addDescripcionCounter.style.color = '#6c757d'; // Gris
      }
    });
    
    // Inicializar contador
    addDescripcionCounter.textContent = addDescripcion.value.length;
  }
  
  // Contadores para modal de editar
  const editNombre = document.getElementById('edit-nombre');
  const editNombreCounter = document.getElementById('edit-nombre-counter');
  const editDescripcion = document.getElementById('edit-descripcion');
  const editDescripcionCounter = document.getElementById('edit-descripcion-counter');
  
  // Contador para nombre (editar)
  if (editNombre && editNombreCounter) {
    editNombre.addEventListener('input', function() {
      const longitud = this.value.length;
      editNombreCounter.textContent = longitud;
      
      // Cambiar color cuando se acerca al límite
      if (longitud >= 90) {
        editNombreCounter.style.color = '#dc3545'; // Rojo
      } else if (longitud >= 80) {
        editNombreCounter.style.color = '#ffc107'; // Amarillo
      } else {
        editNombreCounter.style.color = '#6c757d'; // Gris
      }
    });
    
    // Inicializar contador
    editNombreCounter.textContent = editNombre.value.length;
  }
  
  // Contador para descripción (editar)
  if (editDescripcion && editDescripcionCounter) {
    editDescripcion.addEventListener('input', function() {
      const longitud = this.value.length;
      editDescripcionCounter.textContent = longitud;
      
      // Cambiar color cuando se acerca al límite
      if (longitud >= 900) {
        editDescripcionCounter.style.color = '#dc3545'; // Rojo
      } else if (longitud >= 800) {
        editDescripcionCounter.style.color = '#ffc107'; // Amarillo
      } else {
        editDescripcionCounter.style.color = '#6c757d'; // Gris
      }
    });
    
    // Inicializar contador
    editDescripcionCounter.textContent = editDescripcion.value.length;
  }
}

// Inicializar contadores cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
  inicializarContadorCaracteres();
});

// Reinicializar contadores cuando se abren los modales
if (addCategoryModal) {
  addCategoryModal.addEventListener('shown.bs.modal', function() {
    setTimeout(() => {
      inicializarContadorCaracteres();
    }, 100);
  });
}

if (editCategoryModal) {
  editCategoryModal.addEventListener('shown.bs.modal', function() {
    setTimeout(() => {
      inicializarContadorCaracteres();
    }, 100);
  });
}
