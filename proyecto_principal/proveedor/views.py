from django.shortcuts import render, redirect, get_object_or_404
from home.models import Proveedore, Producto, ProductoProveedore, Codigo
from .forms import ProveedoreForm
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Q
from django.views.decorators.http import require_GET
import json

def proveedores(request):
    proveedores = Proveedore.objects.all()
    nombre_usuario = request.session.get('usuario_nombre', 'Invitado')
    return render(request, 'proveedor/proveedores.html', {
        'proveedores': proveedores,
        'nombre_usuario': nombre_usuario,
    })

def agregar_proveedor(request):
    if request.method == 'POST':
        form = ProveedoreForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResponse({
                'success': True,
                'message': 'Proveedor agregado correctamente.'
            })
        else:
            errors = {}
            for field, error_list in form.errors.items():
                errors[field] = error_list[0]
            return JsonResponse({
                'success': False,
                'message': 'Error al agregar el proveedor.',
                'errors': errors
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Método no permitido.'
    }, status=405)

def editar_proveedor(request, id):
    proveedor = get_object_or_404(Proveedore, pk=id)
    if request.method == 'POST':
        form = ProveedoreForm(request.POST, instance=proveedor)
        if form.is_valid():
            form.save()
            return JsonResponse({
                'success': True,
                'message': 'Proveedor editado correctamente.'
            })
        else:
            errors = {}
            for field, error_list in form.errors.items():
                errors[field] = error_list[0]
            return JsonResponse({
                'success': False,
                'message': 'Error al editar el proveedor.',
                'errors': errors
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Método no permitido.'
    }, status=405)

def eliminar_proveedor(request, id):
    if request.method == 'POST':
        proveedor = get_object_or_404(Proveedore, id_proveedor=id)
        try:
            proveedor.soft_delete()
            return JsonResponse({
                'success': True,
                'message': 'Proveedor eliminado correctamente.',
                'proveedor_id': proveedor.id_proveedor
            })
        except ValueError as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': 'Error al eliminar el proveedor.'
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Método no permitido.'
    }, status=405)

def restaurar_proveedor(request, id):
    if request.method == 'POST':
        proveedor = get_object_or_404(Proveedore.all_objects, id_proveedor=id, eliminado=True)
        try:
            proveedor.restore()
            return JsonResponse({
                'success': True,
                'message': 'Proveedor restaurado correctamente.'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': 'Error al restaurar el proveedor.'
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Método no permitido.'
    }, status=405)

def proveedor_producto(request, proveedor_id):
    proveedor = get_object_or_404(Proveedore, pk=proveedor_id)
    producto_proveedores = ProductoProveedore.objects.filter(id_proveedor=proveedor).select_related('id_producto')
    
    productos_no_en_proveedor = Producto.objects.exclude(
        id_producto__in=producto_proveedores.values_list('id_producto_id', flat=True)
    )
    
    nombre_usuario = request.session.get('usuario_nombre', 'Invitado')

    return render(request, 'proveedor/proveedor_producto.html', {
        'proveedor': proveedor,
        'producto_proveedores': producto_proveedores,
        'productos_no_en_proveedor': productos_no_en_proveedor,
        'nombre_usuario': nombre_usuario,
    })

def agregar_producto_proveedor(request, proveedor_id):
    if request.method == 'POST':
        proveedor = get_object_or_404(Proveedore, pk=proveedor_id)
        producto_id = request.POST.get('producto_id')
        precio_proveedor = request.POST.get('precio_proveedor')
        
        if producto_id and precio_proveedor:
            producto = get_object_or_404(Producto, id_producto=producto_id)
            
            producto_proveedor, created = ProductoProveedore.objects.get_or_create(
                id_proveedor=proveedor,
                id_producto=producto,
                defaults={'precio_proveedor': precio_proveedor}
            )
            
            if not created:
                producto_proveedor.precio_proveedor = precio_proveedor
                producto_proveedor.save()
            
            messages.success(request, f"Producto {producto.nombre} agregado al proveedor {proveedor.nombre} con precio ${precio_proveedor}.")
    return redirect('proveedor_producto', proveedor_id=proveedor_id)

def editar_precio_proveedor(request, proveedor_id, producto_id):
    if request.method == 'POST':
        proveedor = get_object_or_404(Proveedore, pk=proveedor_id)
        producto = get_object_or_404(Producto, id_producto=producto_id)
        nuevo_precio = request.POST.get('precio_proveedor')
        
        if nuevo_precio:
            producto_proveedor = get_object_or_404(ProductoProveedore, 
                                                 id_proveedor=proveedor, 
                                                 id_producto=producto)
            producto_proveedor.precio_proveedor = nuevo_precio
            producto_proveedor.save()
            messages.success(request, f"Precio actualizado para {producto.nombre} a ${nuevo_precio}.")
    
    return redirect('proveedor_producto', proveedor_id=proveedor_id)

def eliminar_producto_proveedor(request, producto_id, proveedor_id):
    if request.method == 'POST':
        try:
            proveedor = get_object_or_404(Proveedore, id_proveedor=proveedor_id)
            producto = get_object_or_404(Producto, id_producto=producto_id)
            
            producto_proveedor = get_object_or_404(ProductoProveedore, 
                                                 id_proveedor=proveedor, 
                                                 id_producto=producto)
            nombre_producto = producto.nombre
            producto_proveedor.delete()
            
            messages.error(request, f"Producto {nombre_producto} eliminado del proveedor {proveedor.nombre}.")
        except Exception as e:
            messages.error(request, f"Error al eliminar el producto: {str(e)}")
    return redirect('proveedor_producto', proveedor_id=proveedor_id)

def restaurar_producto_proveedor(request, proveedor_id, producto_id):
    """Vista AJAX para restaurar producto eliminado del proveedor"""
    if request.method == 'POST':
        try:
            proveedor = get_object_or_404(Proveedore, id_proveedor=proveedor_id)
            producto = get_object_or_404(Producto, id_producto=producto_id)
            
            # Verificar si ya existe la relación
            if ProductoProveedore.objects.filter(id_proveedor=proveedor, id_producto=producto).exists():
                return JsonResponse({
                    'success': False,
                    'message': 'El producto ya está asociado a este proveedor.'
                })
            
            # Obtener el precio del proveedor del request si está disponible
            precio_proveedor = request.POST.get('precio_proveedor')
            
            # Crear la relación producto-proveedor con el precio original
            producto_proveedor = ProductoProveedore.objects.create(
                id_proveedor=proveedor,
                id_producto=producto,
                precio_proveedor=precio_proveedor if precio_proveedor else 0
            )
            
            return JsonResponse({
                'success': True,
                'message': f'Producto {producto.nombre} restaurado al proveedor {proveedor.nombre} exitosamente.',
                'precio_proveedor': producto_proveedor.precio_proveedor
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al restaurar el producto: {str(e)}'
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Método no permitido.'
    }, status=405)

@require_GET
def autocomplete_productos_proveedor(request):
    """Vista AJAX para autocompletado de productos en proveedores"""
    query = request.GET.get('q', '').strip()
    proveedor_id = request.GET.get('proveedor')
    
    # Si no hay query, mostrar todos los productos disponibles para el proveedor
    if not query:
        productos = Producto.objects.all().select_related('id_categoria')
        
        # Excluir productos que ya están asociados al proveedor
        if proveedor_id:
            productos_asociados = ProductoProveedore.objects.filter(
                id_proveedor_id=proveedor_id
            ).values_list('id_producto_id', flat=True)
            productos = productos.exclude(id_producto__in=productos_asociados)
        
        # Limitar a 10 resultados y ordenar por nombre
        productos = productos.order_by('nombre')[:10]
        
        results = []
        for p in productos:
            codigo = p.codigo_set.first()
            results.append({
                'id': p.id_producto,
                'nombre': p.nombre,
                'codigo': codigo.codigo if codigo else '',
                'marca': p.marca,
                'precio_venta': float(p.precio_unitario),
                'stock': p.stock_actual,
                'categoria': p.id_categoria.nombre if p.id_categoria else None
            })
        
        return JsonResponse({'results': results})
    
    # Primero buscar coincidencia exacta por nombre o código
    producto_exacto = Producto.objects.filter(
        Q(nombre__iexact=query) | 
        Q(codigo__codigo__iexact=query)
    ).first()
    
    if producto_exacto:
        # Si hay coincidencia exacta, retornar solo ese producto
        codigo = producto_exacto.codigo_set.first()
        return JsonResponse({
            'results': [{
                'id': producto_exacto.id_producto,
                'nombre': producto_exacto.nombre,
                'codigo': codigo.codigo if codigo else '',
                'marca': producto_exacto.marca,
                'precio_venta': float(producto_exacto.precio_unitario),
                'stock': producto_exacto.stock_actual,
                'categoria': producto_exacto.id_categoria.nombre if producto_exacto.id_categoria else None
            }]
        })
    
    # Si no hay coincidencia exacta, buscar coincidencias parciales
    productos = Producto.objects.filter(
        Q(nombre__icontains=query) | 
        Q(codigo__codigo__icontains=query)
    ).distinct()
    
    # Excluir productos que ya están asociados al proveedor
    if proveedor_id:
        productos_asociados = ProductoProveedore.objects.filter(
            id_proveedor_id=proveedor_id
        ).values_list('id_producto_id', flat=True)
        productos = productos.exclude(id_producto__in=productos_asociados)
    
    # Limitar a 10 resultados y ordenar por nombre
    productos = productos.order_by('nombre')[:10]
    
    results = []
    for p in productos:
        codigo = p.codigo_set.first()
        results.append({
            'id': p.id_producto,
            'nombre': p.nombre,
            'codigo': codigo.codigo if codigo else '',
            'marca': p.marca,
            'precio_venta': float(p.precio_unitario),
            'stock': p.stock_actual,
            'categoria': p.id_categoria.nombre if p.id_categoria else None
        })
    
    return JsonResponse({'results': results})

@require_GET
def validar_codigo(request):
    codigo = request.GET.get('codigo', '').strip()
    if codigo:
        from home.models import Producto
        try:
            producto = Producto.objects.get(codigo__codigo=codigo)
            return JsonResponse({
                'existe': True,
                'nombre': producto.nombre,
                'precio': float(producto.precio_unitario)
            })
        except Producto.DoesNotExist:
            return JsonResponse({'existe': False})
    return JsonResponse({'existe': False})