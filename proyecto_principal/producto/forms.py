# archivo: forms.py
from django import forms
from home.models import Producto

class ProductoForm(forms.ModelForm):
    class Meta:
        model = Producto
        fields = [
            'id_categoria',
            'nombre',
            'marca',
            'descripcion',
            'stock_actual',
            'stock_minimo',
            'precio_unitario',
        ]
        widgets = {
            'descripcion': forms.Textarea(attrs={
                'rows': 3,
                'maxlength': 500,
                'placeholder': 'Descripción del producto (máximo 500 caracteres)',
                'class': 'form-control'
            }),
        }
    
    def clean_descripcion(self):
        descripcion = self.cleaned_data.get('descripcion')
        if descripcion and len(descripcion) > 500:
            raise forms.ValidationError(
                'La descripción no puede exceder los 500 caracteres.'
            )
        return descripcion

    def clean_precio_unitario(self):
        precio = self.cleaned_data.get('precio_unitario')
        if precio is not None and precio < 0:
            raise forms.ValidationError('El precio no puede ser negativo.')
        return precio