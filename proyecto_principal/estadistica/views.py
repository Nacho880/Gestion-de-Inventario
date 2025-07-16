from django.shortcuts import render
from django.db.models import Sum, F, FloatField
from django.http import JsonResponse
from home.models import Venta, Compra, DetalleVenta, DetalleCompra
from datetime import datetime, date, timedelta
from home.models import Producto
from django.utils import timezone
from django.utils.timezone import localdate, make_aware, get_current_timezone
from django.db import models

def estadisticas(request):
    nombre_usuario = request.session.get('usuario_nombre', 'Invitado')
    
    # Usar fecha local según la zona horaria de Django
    fecha_actual = localdate()
    print(f"[DEBUG] Fecha actual local: {fecha_actual}")
    ventas_hoy_debug = DetalleVenta.objects.filter(
        venta__fecha__date=fecha_actual,
        cantidad__gt=0,
        venta__eliminado=False
    )
    print(f"[DEBUG] Ventas hoy encontradas: {ventas_hoy_debug.count()}")
    for v in ventas_hoy_debug:
        print(f"[DEBUG] Venta: {v.venta.id_venta}, Producto: {v.producto.nombre}, Cantidad: {v.cantidad}, Fecha: {v.venta.fecha}, Eliminado: {v.venta.eliminado}")
    
    # DEBUG: Listar ventas recientes
    from datetime import timedelta
    ventas_recientes = Venta.objects.filter(fecha__gte=fecha_actual - timedelta(days=3)).order_by('-fecha')
    print("[DEBUG] Ventas recientes (últimos 3 días):")
    for v in ventas_recientes:
        print(f"[DEBUG] Venta ID: {v.id_venta}, Fecha: {v.fecha}, Eliminado: {v.eliminado}, Total: {v.total_venta}")

    # Verificar si es una petición AJAX para el resumen del día
    if request.GET.get('ajax') == 'resumen_dia':
        
        # Filtros específicos para el día actual
        filtro_ventas_hoy = {'venta__fecha__date': fecha_actual, 'cantidad__gt': 0, 'venta__eliminado': False}
        filtro_compras_hoy = {'compra__fecha__date': fecha_actual, 'compra__eliminado': False}

        # Totales específicos del día actual
        totales_ventas_hoy = DetalleVenta.objects.filter(**filtro_ventas_hoy).aggregate(
            total_cant=Sum('cantidad'),
            total_monto=Sum(F('cantidad') * F('precio_unitario'), output_field=FloatField())
        )

        totales_compras_hoy = DetalleCompra.objects.filter(**filtro_compras_hoy).aggregate(
            total_cant=Sum('cantidad'),
            total_monto=Sum(F('cantidad') * F('precio_compra'), output_field=FloatField())
        )

        # Producto más vendido del día actual
        producto_mas_vendido_hoy = (
            DetalleVenta.objects.filter(**filtro_ventas_hoy)
            .values('producto__nombre')
            .annotate(total_vendido=Sum('cantidad'))
            .filter(total_vendido__gt=0)  # Filtrar productos con total vendido mayor a 0
            .order_by('-total_vendido')
            .first()
        )
        
        # Si no hay producto más vendido hoy, mostrar el del historial
        if not producto_mas_vendido_hoy:
            producto_mas_vendido_hoy = (
                DetalleVenta.objects.filter(
                    cantidad__gt=0,
                    venta__eliminado=False
                )
                .values('producto__nombre')
                .annotate(total_vendido=Sum('cantidad'))
                .filter(total_vendido__gt=0)
                .order_by('-total_vendido')
                .first()
            )
            if producto_mas_vendido_hoy:
                producto_mas_vendido_hoy['es_historico'] = True
        
        # Si no hay producto más vendido hoy, mostrar el del historial
        if not producto_mas_vendido_hoy:
            producto_mas_vendido_hoy = (
                DetalleVenta.objects.filter(
                    cantidad__gt=0,
                    venta__eliminado=False
                )
                .values('producto__nombre')
                .annotate(total_vendido=Sum('cantidad'))
                .filter(total_vendido__gt=0)
                .order_by('-total_vendido')
                .first()
            )
            if producto_mas_vendido_hoy:
                producto_mas_vendido_hoy['es_historico'] = True

        # Producto más comprado del día actual
        producto_mas_comprado_hoy = (
            DetalleCompra.objects.filter(**filtro_compras_hoy)
            .values('producto__nombre')
            .annotate(total_comprado=Sum('cantidad'))
            .order_by('-total_comprado')
            .first()
        )

        # Producto con mayor gasto del día actual
        mayor_gasto_hoy = (
            DetalleCompra.objects.filter(**filtro_compras_hoy)
            .values('producto__nombre')
            .annotate(monto_gastado=Sum(F('cantidad') * F('precio_compra'), output_field=FloatField()))
            .order_by('-monto_gastado')
            .first()
        )

        return JsonResponse({
            'totales_ventas_hoy': {
                'total_cant': totales_ventas_hoy['total_cant'] or 0,
                'total_monto': float(totales_ventas_hoy['total_monto'] or 0)
            },
            'totales_compras_hoy': {
                'total_cant': totales_compras_hoy['total_cant'] or 0,
                'total_monto': float(totales_compras_hoy['total_monto'] or 0)
            },
            'producto_mas_vendido_hoy': producto_mas_vendido_hoy,
            'producto_mas_comprado_hoy': producto_mas_comprado_hoy,
            'mayor_gasto_hoy': mayor_gasto_hoy,
        })

    # Verificar si es una petición AJAX para los datos del día del gráfico
    if request.GET.get('ajax') == 'datos_dia':
        top = request.GET.get('top', 10)
        
        try:
            top = int(top)
            if top < 1:
                top = 10
        except ValueError:
            top = 10

        # Filtros específicos para el día actual (usar __date)
        filtro_ventas_hoy = {'venta__fecha__date': fecha_actual}
        
        # Agregar filtro para excluir ventas con total 0 (reembolsadas) y ventas eliminadas
        filtro_ventas_hoy['cantidad__gt'] = 0
        filtro_ventas_hoy['venta__eliminado'] = False

        # Productos vendidos del día actual para el gráfico
        productos_vendidos_hoy = (
            DetalleVenta.objects.filter(**filtro_ventas_hoy)
            .values('producto__nombre')
            .annotate(total_vendido=Sum('cantidad'))
            .filter(total_vendido__gt=0)  # Filtrar productos con total vendido mayor a 0
            .order_by('-total_vendido')[:top]
        )

        return JsonResponse({
            'productos_vendidos_hoy': list(productos_vendidos_hoy),
        })

    top = request.GET.get('top', 10)
    fecha_inicio_str = request.GET.get('fecha_inicio')
    fecha_fin_str = request.GET.get('fecha_fin')

    advertencia_fecha = False

    try:
        top = int(top)
        if top < 1:
            top = 10
    except ValueError:
        top = 10

    def parse_fecha(fecha_str):
        try:
            return datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except:
            return None

    # fecha_actual ya está definido arriba
    fecha_inicio = parse_fecha(fecha_inicio_str)
    fecha_fin = parse_fecha(fecha_fin_str)

    # Eliminar el filtrado por defecto de hoy: si no hay filtros de fecha, no aplicar ningún filtro
    # (No asignar fecha_inicio ni fecha_fin por defecto)

    # Si no hay filtros de fecha, mostrar todo el historial sin filtros
    periodo_actual = 'historico'  # Por defecto es histórico (sin filtros)
    if not fecha_inicio_str and not fecha_fin_str:
        # No aplicar ningún filtro de fecha - mostrar todo el historial
        fecha_inicio = None
        fecha_fin = None
        fecha_inicio_str = ''
        fecha_fin_str = ''
        periodo_actual = 'historico'
    else:
        # Determinar qué período está seleccionado
        if fecha_inicio and fecha_fin:
            if fecha_inicio == fecha_fin:
                # Períodos de un solo día
                if fecha_inicio == fecha_actual:
                    periodo_actual = 'hoy'
                else:
                    ayer = fecha_actual - timedelta(days=1)
                    if fecha_inicio == ayer:
                        periodo_actual = 'ayer'
            else:
                # Períodos de múltiples días
                # Calcular inicio de semana (domingo, como en JavaScript)
                # weekday() devuelve 0=lunes, 1=martes, ..., 6=domingo
                # Necesitamos convertir a 0=domingo, 1=lunes, ..., 6=sábado
                weekday_js = (fecha_actual.weekday() + 1) % 7  # Convertir a formato JavaScript
                inicio_semana = fecha_actual - timedelta(days=weekday_js)
                # Calcular inicio del mes
                inicio_mes = fecha_actual.replace(day=1)
                # Calcular inicio del mes anterior
                if fecha_actual.month == 1:
                    inicio_mes_anterior = fecha_actual.replace(year=fecha_actual.year-1, month=12, day=1)
                else:
                    inicio_mes_anterior = fecha_actual.replace(month=fecha_actual.month-1, day=1)
                # Calcular fin del mes anterior (último día del mes anterior)
                if fecha_actual.month == 1:
                    # Si estamos en enero, el mes anterior es diciembre del año anterior
                    fin_mes_anterior = fecha_actual.replace(year=fecha_actual.year-1, month=12, day=31)
                else:
                    # El último día del mes anterior es el día 0 del mes actual
                    fin_mes_anterior = fecha_actual.replace(month=fecha_actual.month, day=1) - timedelta(days=1)
                # Calcular inicio del año
                inicio_año = fecha_actual.replace(month=1, day=1)
                
                # Verificar cada período
                if fecha_inicio == inicio_semana and fecha_fin == fecha_actual:
                    periodo_actual = 'semana'
                elif fecha_inicio == inicio_mes and fecha_fin == fecha_actual:
                    periodo_actual = 'mes'
                elif fecha_inicio == inicio_mes_anterior and fecha_fin == fin_mes_anterior:
                    periodo_actual = 'mes_anterior'
                elif fecha_inicio == inicio_año and fecha_fin == fecha_actual:
                    periodo_actual = 'año'

    if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
        fecha_inicio, fecha_fin = fecha_fin, fecha_inicio
        advertencia_fecha = True

    # Obtener la fecha actual para el resumen del día
    # fecha_actual = date.today() # Moved up for default date logic
    
    tz = get_current_timezone()
    # Si hay filtros de fecha, usarlos; si no, usar hoy por defecto
    fecha_inicio_str = request.GET.get('fecha_inicio')
    fecha_fin_str = request.GET.get('fecha_fin')
    def parse_fecha(fecha_str):
        try:
            return datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except:
            return None
    fecha_inicio = parse_fecha(fecha_inicio_str)
    fecha_fin = parse_fecha(fecha_fin_str)
    
    # Filtros robustos - solo aplicar filtros de fecha si se especifican
    filtro_ventas = {'cantidad__gt': 0, 'venta__eliminado': False}
    filtro_compras = {'compra__eliminado': False}
    
    # Solo agregar filtros de fecha si se especifican
    if fecha_inicio and fecha_fin:
        dt_inicio = make_aware(datetime.combine(fecha_inicio, datetime.min.time()), tz)
        dt_fin = make_aware(datetime.combine(fecha_fin, datetime.max.time()), tz)
        filtro_ventas.update({'venta__fecha__gte': dt_inicio, 'venta__fecha__lte': dt_fin})
        filtro_compras.update({'compra__fecha__gte': dt_inicio, 'compra__fecha__lte': dt_fin})
    # Usar estos filtros en todas las queries de ventas y compras del período seleccionado
    productos_vendidos = (
        DetalleVenta.objects.filter(**filtro_ventas)
        .values('producto__nombre', 'producto__id_categoria__nombre', 'precio_unitario')
        .annotate(
            total_vendido=Sum('cantidad'),
            monto_generado=Sum(F('cantidad') * F('precio_unitario'), output_field=FloatField())
        )
        .filter(total_vendido__gt=0)
        .order_by('-total_vendido')[:top]
    )
    productos_comprados = (
        DetalleCompra.objects.filter(**filtro_compras)
        .values('producto__nombre', 'compra__proveedor__nombre')
        .annotate(
            total_comprado=Sum('cantidad'),
            monto_gastado=Sum(F('cantidad') * F('precio_compra'), output_field=FloatField())
        )
        .order_by('-total_comprado')[:top]
    )
    totales_ventas = DetalleVenta.objects.filter(**filtro_ventas).aggregate(
        total_cant=Sum('cantidad'),
        total_monto=Sum(F('cantidad') * F('precio_unitario'), output_field=FloatField())
    )
    totales_compras = DetalleCompra.objects.filter(**filtro_compras).aggregate(
        total_cant=Sum('cantidad'),
        total_monto=Sum(F('cantidad') * F('precio_compra'), output_field=FloatField())
    )

    # Totales específicos del día actual para el resumen general
    # Filtros robustos para el resumen del día (AJAX)
    dt_hoy_inicio = make_aware(datetime.combine(fecha_actual, datetime.min.time()), tz)
    dt_hoy_fin = make_aware(datetime.combine(fecha_actual, datetime.max.time()), tz)
    filtro_ventas_hoy = {
        'venta__fecha__gte': dt_hoy_inicio,
        'venta__fecha__lte': dt_hoy_fin,
        'cantidad__gt': 0,
        'venta__eliminado': False
    }
    filtro_compras_hoy = {
        'compra__fecha__gte': dt_hoy_inicio,
        'compra__fecha__lte': dt_hoy_fin,
        'compra__eliminado': False
    }
    # Usar estos filtros en todas las queries del resumen del día (AJAX)
    totales_ventas_hoy = DetalleVenta.objects.filter(**filtro_ventas_hoy).aggregate(
        total_cant=Sum('cantidad'),
        total_monto=Sum(F('cantidad') * F('precio_unitario'), output_field=FloatField())
    )

    totales_compras_hoy = DetalleCompra.objects.filter(**filtro_compras_hoy).aggregate(
        total_cant=Sum('cantidad'),
        total_monto=Sum(F('cantidad') * F('precio_compra'), output_field=FloatField())
    )

    # Producto más vendido del día actual
    producto_mas_vendido_hoy = (
        DetalleVenta.objects.filter(**filtro_ventas_hoy)
        .values('producto__nombre')
        .annotate(total_vendido=Sum('cantidad'))
        .filter(total_vendido__gt=0)  # Filtrar productos con total vendido mayor a 0
        .order_by('-total_vendido')
        .first()
    )
    
    # Si no hay producto más vendido hoy, mostrar el del historial
    if not producto_mas_vendido_hoy:
        producto_mas_vendido_hoy = (
            DetalleVenta.objects.filter(
                cantidad__gt=0,
                venta__eliminado=False
            )
            .values('producto__nombre')
            .annotate(total_vendido=Sum('cantidad'))
            .filter(total_vendido__gt=0)
            .order_by('-total_vendido')
            .first()
        )
        if producto_mas_vendido_hoy:
            producto_mas_vendido_hoy['es_historico'] = True

    # Producto más comprado del día actual
    producto_mas_comprado_hoy = (
        DetalleCompra.objects.filter(**filtro_compras_hoy)
        .values('producto__nombre')
        .annotate(total_comprado=Sum('cantidad'))
        .order_by('-total_comprado')
        .first()
    )

    # Producto con mayor gasto del día actual
    mayor_gasto_hoy = (
        DetalleCompra.objects.filter(**filtro_compras_hoy)
        .values('producto__nombre')
        .annotate(monto_gastado=Sum(F('cantidad') * F('precio_compra'), output_field=FloatField()))
        .order_by('-monto_gastado')
        .first()
    )

    # Categorías más vendidas
    categorias_vendidas = (
        DetalleVenta.objects.filter(**filtro_ventas)
        .values('producto__id_categoria__nombre')
        .annotate(
            total_vendido=Sum('cantidad'),
            monto_generado=Sum(F('cantidad') * F('precio_unitario'), output_field=FloatField())
        )
        .filter(total_vendido__gt=0)  # Filtrar categorías con total vendido mayor a 0
        .order_by('-total_vendido')
    )

    # Categorías más compradas
    categorias_compradas = (
        DetalleCompra.objects.filter(**filtro_compras)
        .values('producto__id_categoria__nombre')
        .annotate(
            total_comprado=Sum('cantidad'),
            monto_gastado=Sum(F('cantidad') * F('precio_compra'), output_field=FloatField())
        )
        .order_by('-total_comprado')
    )

    # Ventas por día
    ventas_por_dia = (
        DetalleVenta.objects.filter(**filtro_ventas)
        .values('venta__fecha__date')
        .annotate(
            total_cant=Sum('cantidad'),
            total_monto=Sum(F('cantidad') * F('precio_unitario'), output_field=FloatField())
        )
        .filter(total_cant__gt=0)  # Filtrar días con total vendido mayor a 0
        .order_by('venta__fecha__date')
    )

    # Compras por día
    compras_por_dia = (
        DetalleCompra.objects.filter(**filtro_compras)
        .values('compra__fecha__date')
        .annotate(
            total_cant=Sum('cantidad'),
            total_monto=Sum(F('cantidad') * F('precio_compra'), output_field=FloatField())
        )
        .order_by('compra__fecha__date')
    )

    # Producto más vendido y menos vendido del período seleccionado
    producto_mas_vendido = None
    producto_menos_vendido = None
    if productos_vendidos:
        producto_mas_vendido = max(productos_vendidos, key=lambda x: x['total_vendido'])
        producto_menos_vendido = min(productos_vendidos, key=lambda x: x['total_vendido'])

    # Producto más comprado, menos comprado, mayor gasto y menor gasto del período seleccionado
    producto_mas_comprado = None
    producto_menos_comprado = None
    mayor_gasto = None
    menor_gasto = None
    if productos_comprados:
        producto_mas_comprado = max(productos_comprados, key=lambda x: x['total_comprado'])
        producto_menos_comprado = min(productos_comprados, key=lambda x: x['total_comprado'])
        mayor_gasto = max(productos_comprados, key=lambda x: x['monto_gastado'])
        menor_gasto = min(productos_comprados, key=lambda x: x['monto_gastado'])

    # Redondear precios a enteros en productos_vendidos y productos_comprados
    def redondear_precios(lista, campos):
        for item in lista:
            for campo in campos:
                if campo in item and item[campo] is not None:
                    item[campo] = int(round(item[campo]))
        return lista
    productos_vendidos = redondear_precios(list(productos_vendidos), ['precio_unitario', 'monto_generado'])
    productos_comprados = redondear_precios(list(productos_comprados), ['monto_gastado'])

    compras_por_proveedor = (
        DetalleCompra.objects.filter(**filtro_compras)
        .values('compra__proveedor__nombre')
        .annotate(
            total_cant=Sum('cantidad'),
            total_monto=Sum(F('cantidad') * F('precio_compra'), output_field=FloatField())
        )
        .order_by('-total_monto')
    )

    context = {
        'productos_vendidos': productos_vendidos,
        'productos_comprados': productos_comprados,
        'compras_por_proveedor': compras_por_proveedor,
        'totales_ventas': totales_ventas,
        'totales_compras': totales_compras,
        'totales_ventas_hoy': totales_ventas_hoy,
        'totales_compras_hoy': totales_compras_hoy,
        'producto_mas_vendido_hoy': producto_mas_vendido_hoy,
        'producto_mas_comprado_hoy': producto_mas_comprado_hoy,
        'mayor_gasto_hoy': mayor_gasto_hoy,
        'categorias_vendidas': categorias_vendidas,
        'categorias_compradas': categorias_compradas,
        'ventas_por_dia': ventas_por_dia,
        'compras_por_dia': compras_por_dia,
        'fecha_inicio': fecha_inicio_str,
        'fecha_fin': fecha_fin_str,
        'top': top,
        'advertencia_fecha': advertencia_fecha,
        'nombre_usuario': nombre_usuario,
        'producto_mas_vendido': producto_mas_vendido,
        'producto_menos_vendido': producto_menos_vendido,
        'producto_mas_comprado': producto_mas_comprado,
        'producto_menos_comprado': producto_menos_comprado,
        'mayor_gasto': mayor_gasto,
        'menor_gasto': menor_gasto,
        'fecha_actual': fecha_actual.strftime('%Y-%m-%d'),
        'periodo_actual': periodo_actual,
        'debug_periodo': periodo_actual  # Para debug
    }

    return render(request, 'estadistica/estadisticas.html', context)
