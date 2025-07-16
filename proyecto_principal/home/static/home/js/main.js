$(document).ready(function () {
  // Configuración global para la paginación de DataTables
  $.fn.DataTable.ext.pager.numbers_length = 5;
  // Inicializar DataTable igual que en categorías, pero con flechas Unicode clásicas
  const table = $('#tablaMovimientos').DataTable({
    pagingType: 'full_numbers',
    language: {
      info: "Mostrando _START_ de _END_ | Total _TOTAL_ movimiento(s)",
      infoEmpty: "Sin movimientos para mostrar",
      lengthMenu: "Mostrar _MENU_ movimientos",
      search: "🔍 Buscar:",
      zeroRecords: "No se encontraron resultados.",
      infoFiltered: "(filtrado de un total de _MAX_ movimiento(s))",
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
      { orderable: false, targets: [] }
    ]
  });

  // Búsqueda en tiempo real (si agregas un input de búsqueda específico)
  $('#searchMovimiento').on('keyup', function () {
    table.column(0).search(this.value).draw();
  });
});