from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from home.models import Categoria, Producto 
from .forms import CategoriaForm
from django.contrib import messages
import json
from django.db import models
from django.db.models import Q
from django.views.decorators.http import require_GET


def categorias(request):
    categorias = Categoria.objects.all()
    nombre_usuario = request.session.get('usuario_nombre', 'Invitado')  # Obtiene el nombre del usuario de la sesión
    return render(request, 'categoria/categorias.html', {
        'categorias': categorias,
        'nombre_usuario': nombre_usuario
    })


def agregar_categoria(request):
    if request.method == 'POST':
        form = CategoriaForm(request.POST)
        if form.is_valid():
            form.save()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Categoría agregada correctamente.'
                })
            else:
                messages.success(request, "Categoría agregada correctamente.")
                return redirect('categorias')
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                errors = {}
                # Obtener el primer mensaje de error específico
                first_error = None
                for field, error_list in form.errors.items():
                    errors[field] = error_list[0]
                    if not first_error:
                        first_error = error_list[0]
                return JsonResponse({
                    'success': False,
                    'message': first_error or 'Error al agregar la categoría. Por favor, corrige los errores.',
                    'errors': errors
                })
            else:
                messages.error(request, "Error al agregar la categoría. Por favor, corrige los errores.")
    else:
        form = CategoriaForm()
    return render(request, 'categoria/form_categoria.html', {'form': form, 'accion': 'Agregar'})


def editar_categoria(request, id):
    categoria = get_object_or_404(Categoria, pk=id)
    if request.method == 'POST':
        form = CategoriaForm(request.POST, instance=categoria)
        if form.is_valid():
            form.save()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Categoría editada correctamente.'
                })
            else:
                messages.success(request, "Categoría editada correctamente.")
                return redirect('categorias')
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                errors = {}
                # Obtener el primer mensaje de error específico
                first_error = None
                for field, error_list in form.errors.items():
                    errors[field] = error_list[0]
                    if not first_error:
                        first_error = error_list[0]
                return JsonResponse({
                    'success': False,
                    'message': first_error or 'Error al editar la categoría.',
                    'errors': errors
                })
            else:
                messages.error(request, "Error al editar la categoría. ")
    else:
        form = CategoriaForm(instance=categoria)
    return render(request, 'categoria/form_categoria.html', {'form': form, 'accion': 'Editar'})


def eliminar_categoria(request, id):
    if request.method == 'POST':
        categoria = get_object_or_404(Categoria, id_categoria=id)
        
        # Verificar si es una petición AJAX
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            try:
                categoria.soft_delete()
                return JsonResponse({
                    'success': True,
                    'message': f'Categoría "{categoria.nombre}" eliminada exitosamente.'
                })
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'message': f'Error al eliminar la categoría: {str(e)}'
                })
        else:
            # Petición normal (no AJAX)
            categoria.delete()
            messages.error(request, "Categoría eliminada correctamente.")
            return redirect('categorias')
    
    return redirect('categorias')


def restaurar_categoria(request, id):
    if request.method == 'POST':
        try:
            categoria = Categoria.all_objects.get(id_categoria=id, eliminado=True)
            categoria.restore()
            return JsonResponse({
                'success': True,
                'message': f'Categoría "{categoria.nombre}" restaurada exitosamente.'
            })
        except Categoria.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'La categoría no existe o no fue eliminada.'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al restaurar la categoría: {str(e)}'
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Método no permitido.'
    })


def categoria_producto(request, categoria_id):
    categoria = get_object_or_404(Categoria, pk=categoria_id)
    productos = Producto.objects.filter(id_categoria=categoria)
    productos_no_en_categoria = Producto.objects.filter(id_categoria__isnull=True)
    nombre_usuario = request.session.get('usuario_nombre', 'Invitado')

    # Verificar si es una petición AJAX
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        # Devolver solo el contenido de la tabla para actualización dinámica
        return render(request, 'categoria/categoria_producto.html', {
            'categoria': categoria,
            'productos': productos,
            'productos_no_en_categoria': productos_no_en_categoria,
            'nombre_usuario': nombre_usuario,
        })

    return render(request, 'categoria/categoria_producto.html', {
        'categoria': categoria,
        'productos': productos,
        'productos_no_en_categoria': productos_no_en_categoria,
        'nombre_usuario': nombre_usuario,
    })


def agregar_producto_categoria(request, categoria_id):
    if request.method == 'POST':
        categoria = get_object_or_404(Categoria, pk=categoria_id)
        producto_id = request.POST.get('producto_id')
        if producto_id:
            producto = get_object_or_404(Producto, pk=producto_id)
            producto.id_categoria = categoria
            producto.save()
            
            # Verificar si es una petición AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                # Obtener el código del producto
                codigo_producto = producto.codigo_set.first()
                producto_data = {
                    'id': producto.id_producto,
                    'nombre': producto.nombre or 'Sin nombre',
                    'marca': producto.marca or 'Sin marca',
                    'codigo': codigo_producto.codigo if codigo_producto else 'Sin código',
                    'stock': producto.stock_actual,
                    'precio': float(producto.precio_unitario)
                }
                print(f"DEBUG: Enviando datos del producto: {producto_data}")
                return JsonResponse({
                    'success': True,
                    'message': f'Producto {producto.nombre} agregado a la categoría {categoria.nombre} exitosamente.',
                    'producto': producto_data
                })
            else:
                messages.success(request, f"Producto {producto.nombre} agregado a la categoría {categoria.nombre}.")
                return redirect('categoria_producto', categoria_id=categoria_id)
        else:
            # Verificar si es una petición AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': 'No se seleccionó ningún producto.'
                })
            else:
                messages.error(request, "No se seleccionó ningún producto.")
                return redirect('categoria_producto', categoria_id=categoria_id)
    
    # Si no es POST, redirigir
    return redirect('categoria_producto', categoria_id=categoria_id)


def obtener_productos_disponibles_ajax(request, categoria_id):
    """Vista AJAX para obtener productos disponibles para agregar a una categoría"""
    if request.method == 'GET' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            categoria = get_object_or_404(Categoria, pk=categoria_id)
            productos_disponibles = Producto.objects.filter(id_categoria__isnull=True)
            
            # Convertir productos a formato JSON
            productos_data = []
            for producto in productos_disponibles:
                productos_data.append({
                    'id': producto.id_producto,
                    'nombre': producto.nombre or 'Sin nombre',
                    'marca': producto.marca or 'Sin marca'
                })
            
            return JsonResponse({
                'success': True,
                'productos': productos_data
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al obtener productos disponibles: {str(e)}'
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Método no permitido.'
    })


def eliminar_producto_categoria(request, categoria_id, producto_id):
    if request.method == 'POST':
        try:
            producto = Producto.objects.get(id_producto=producto_id, id_categoria_id=categoria_id)
            producto.id_categoria = None
            producto.save()
            
            # Obtener la lista actualizada de productos disponibles
            productos_disponibles = Producto.objects.filter(id_categoria__isnull=True)
            productos_data = []
            for prod in productos_disponibles:
                productos_data.append({
                    'id': prod.id_producto,
                    'nombre': prod.nombre or 'Sin nombre',
                    'marca': prod.marca or 'Sin marca'
                })
            
            # Verificar si es una petición AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': f'Producto {producto.nombre} eliminado de la categoría exitosamente.',
                    'productos_disponibles': productos_data
                })
            else:
                messages.success(request, f"Producto {producto.nombre} eliminado de la categoría.")
                return redirect('categoria_producto', categoria_id=categoria_id)
                
        except Producto.DoesNotExist:
            # Verificar si es una petición AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': 'El producto no está en esta categoría o ya fue eliminado.'
                })
            else:
                messages.warning(request, "El producto no está en esta categoría o ya fue eliminado.")
                return redirect('categoria_producto', categoria_id=categoria_id)
    
    # Si no es POST, redirigir
    return redirect('categoria_producto', categoria_id=categoria_id)


def restaurar_producto_categoria(request, categoria_id, producto_id):
    if request.method == 'POST':
        try:
            categoria = get_object_or_404(Categoria, pk=categoria_id)
            producto = get_object_or_404(Producto, pk=producto_id)
            
            # Verificar que el producto no esté ya en la categoría
            if producto.id_categoria == categoria:
                return JsonResponse({
                    'success': False,
                    'message': 'El producto ya está en esta categoría.'
                })
            
            # Restaurar el producto en la categoría
            producto.id_categoria = categoria
            producto.save()
            
            return JsonResponse({
                'success': True,
                'message': f'Producto "{producto.nombre}" restaurado en la categoría exitosamente.'
            })
            
        except (Categoria.DoesNotExist, Producto.DoesNotExist):
            return JsonResponse({
                'success': False,
                'message': 'La categoría o el producto no existe.'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al restaurar el producto: {str(e)}'
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Método no permitido.'
    })


def obtener_productos_categoria_ajax(request, categoria_id):
    """Vista AJAX para obtener productos de una categoría en formato JSON"""
    if request.method == 'GET' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            categoria = get_object_or_404(Categoria, pk=categoria_id)
            productos = Producto.objects.filter(id_categoria=categoria)
            
            # Convertir productos a formato JSON
            productos_data = []
            for producto in productos:
                productos_data.append({
                    'id': producto.id_producto,
                    'nombre': producto.nombre or 'Sin nombre',
                    'marca': producto.marca or 'Sin marca',
                    'stock': producto.stock_actual,
                    'precio': float(producto.precio_unitario),
                    'categoria_id': categoria_id
                })
            
            return JsonResponse({
                'success': True,
                'productos': productos_data,
                'categoria_nombre': categoria.nombre
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al obtener productos: {str(e)}'
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Método no permitido.'
    })


def autocomplete_productos(request):
    from home.models import Producto
    from django.db.models import Q
    query = request.GET.get('q', '').strip()
    categoria_id = request.GET.get('categoria_id')

    # Si no hay query, mostrar todos los productos disponibles para la categoría
    if not query:
        productos = Producto.objects.all().select_related('id_categoria')
        
        # Excluir productos que ya están asociados a la categoría
        if categoria_id:
            productos = productos.exclude(id_categoria=categoria_id)
        
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

    # Buscar coincidencia exacta por nombre o código
    producto_exacto = Producto.objects.filter(
        Q(nombre__iexact=query) |
        Q(codigo__codigo__iexact=query)
    ).first()

    if producto_exacto:
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

    # Excluir productos que ya están asociados a la categoría
    if categoria_id:
        productos = productos.exclude(id_categoria=categoria_id)

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


