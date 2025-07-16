from django.urls import path
from . import views


urlpatterns = [
    path('', views.productos, name='productos'),  # lista productos en /producto/
    path('agregar/', views.agregar_producto, name='agregar_producto'),
    path('editar/<int:id>/', views.editar_producto, name='editar_producto'),
    path('eliminar/<int:id>/', views.eliminar_producto, name='eliminar_producto'),
    path('restaurar/<int:id>/', views.restaurar_producto, name='restaurar_producto'),
    path('validar/', views.validar_codigo, name='validar_codigo'),
    path('autocomplete_categorias/', views.autocomplete_categorias, name='autocomplete_categorias'),
]