from django.shortcuts import render, redirect, get_object_or_404
from django.db import models
from home.models import Producto, Codigo, Categoria
from .forms import ProductoForm
from django.utils import timezone
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_GET

def productos(request):
    lista_productos = Producto.objects.all()
    categorias = Categoria.objects.all()
    nombre_usuario = request.session.get('usuario_nombre', 'Invitado')
    return render(request, 'producto/productos.html', {
        'productos': lista_productos,
        'categorias': categorias,
        'nombre_usuario': nombre_usuario,
    })

def agregar_producto(request):
    if request.method == 'POST':
        form = ProductoForm(request.POST)
        codigo = request.POST.get('codigo', '').strip()
        
        # Validar si el código ya existe (solo productos no eliminados)
        if codigo and Codigo.objects.filter(codigo=codigo, id_producto__eliminado=False).exists():
            return JsonResponse({
                'success': False,
                'message': f"El código SKU '{codigo}' ya existe. Por favor, use un código diferente.",
                'field': 'codigo'
            })
        
        if form.is_valid():
            producto = form.save()
            if codigo:
                Codigo.objects.create(id_producto=producto, codigo=codigo)
            return JsonResponse({
                'success': True,
                'message': 'Producto agregado correctamente.'
            })
        else:
            # Devolver errores del formulario
            errors = {}
            for field, error_list in form.errors.items():
                errors[field] = error_list[0]
            msg = 'Error al agregar el producto.'
            if 'precio_unitario' in errors and 'negativo' in errors['precio_unitario']:
                msg = errors['precio_unitario']
            return JsonResponse({
                'success': False,
                'message': msg,
                'errors': errors
            })
    
    return redirect('productos')

def editar_producto(request, id):
    producto = get_object_or_404(Producto, id_producto=id)
    if request.method == 'POST':
        form = ProductoForm(request.POST, instance=producto)
        codigo = request.POST.get('codigo', '').strip()
        
        # Validar si el código ya existe (excluyendo el código actual del producto)
        codigo_actual = producto.codigo_set.first()
        if codigo:
            if codigo_actual and codigo == codigo_actual.codigo:
                # Es el mismo código, no hay problema
                pass
            elif Codigo.objects.filter(codigo=codigo, id_producto__eliminado=False).exists():
                return JsonResponse({
                    'success': False,
                    'message': f"El código SKU '{codigo}' ya existe. Por favor, use un código diferente.",
                    'field': 'codigo'
                })
        
        if form.is_valid():
            form.save()
            if codigo:
                Codigo.objects.filter(id_producto=producto).delete()
                Codigo.objects.create(id_producto=producto, codigo=codigo)
            return JsonResponse({
                'success': True,
                'message': 'Producto editado correctamente.'
            })
        else:
            # Devolver errores del formulario
            errors = {}
            for field, error_list in form.errors.items():
                errors[field] = error_list[0]
            msg = 'Error al actualizar el producto.'
            if 'precio_unitario' in errors and 'negativo' in errors['precio_unitario']:
                msg = errors['precio_unitario']
            return JsonResponse({
                'success': False,
                'message': msg,
                'errors': errors
            })
    
    return redirect('productos')

def eliminar_producto(request, id):
    if request.method == 'POST':
        producto = get_object_or_404(Producto, id_producto=id)
        try:
            # Usar soft delete en lugar de eliminación permanente
            producto.soft_delete()
            return JsonResponse({
                'success': True,
                'message': 'Producto eliminado correctamente.',
                'producto_id': producto.id_producto
            })
        except ValueError as e:
            # Capturar el error específico de dependencias
            return JsonResponse({
                'success': False,
                'message': str(e)
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': 'Error al eliminar el producto.'
            })
    
    return redirect('productos')

def restaurar_producto(request, id):
    if request.method == 'POST':
        producto = get_object_or_404(Producto.all_objects, id_producto=id, eliminado=True)
        try:
            producto.restore()
            return JsonResponse({
                'success': True,
                'message': 'Producto restaurado correctamente.'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': 'Error al restaurar el producto.'
            })
    
    return redirect('productos')

def validar_codigo(request):
    codigo = request.GET.get('codigo', '').strip()
    existe = Codigo.objects.filter(codigo=codigo, id_producto__eliminado=False).exists()
    return JsonResponse({'existe': existe})

@require_GET
def autocomplete_categorias(request):
    query = request.GET.get('q', '').strip()
    
    # Buscar categorías que coincidan con la consulta
    if query:
        categorias_filtradas = Categoria.objects.filter(
            nombre__icontains=query
        ).order_by('nombre')
    else:
        # Si no hay query, mostrar todas las categorías
        categorias_filtradas = Categoria.objects.all().order_by('nombre')
    
    # Limitar a 10 resultados
    categorias_filtradas = categorias_filtradas[:10]
    
    results = []
    for categoria in categorias_filtradas:
        results.append({
            'id': categoria.id_categoria,
            'nombre': categoria.nombre,
            'descripcion': categoria.descripcion or ''
        })
    
    return JsonResponse({'results': results})
