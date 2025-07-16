

$(document).ready(function () {
  $('.datatable').DataTable({
    pagingType: 'full_numbers',
    language: {
      url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
    }
  });
  // Configuración global para la paginación de DataTables
  $.fn.DataTable.ext.pager.numbers_length = 5;

  // --- Código para menú móvil ---
  $('#mobileMenuToggle').on('click', function () {
    $('#sidebar').toggleClass('mobile-open');
    $('#sidebarOverlay').toggleClass('active');
  });
  $('#sidebarOverlay').on('click', function () {
    $('#sidebar').removeClass('mobile-open');
    $('#sidebarOverlay').removeClass('active');
  });
});