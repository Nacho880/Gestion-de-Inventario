from django import forms
from home.models import Categoria

class CategoriaForm(forms.ModelForm):
    class Meta:
        model = Categoria
        fields = ['nombre', 'descripcion']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'maxlength': 100,
                'placeholder': 'Nombre de la categoría (máximo 100 caracteres)',
                'class': 'form-control'
            }),
            'descripcion': forms.Textarea(attrs={
                'rows': 4,
                'maxlength': 1000,
                'placeholder': 'Descripción de la categoría (máximo 1000 caracteres)',
                'class': 'form-control'
            }),
        }

    def clean_nombre(self):
        nombre = self.cleaned_data['nombre'].strip()
        
        # Validar longitud
        if len(nombre) > 100:
            raise forms.ValidationError('El nombre no puede exceder los 100 caracteres.')
        
        # Validar que no esté vacío
        if not nombre:
            raise forms.ValidationError('El nombre es obligatorio.')
        
        # Validar que no exista duplicado
        qs = Categoria.all_objects.filter(nombre__iexact=nombre, eliminado=False)
        if self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError('Ya existe una categoría activa con ese nombre. Por favor, elige un nombre diferente.')
        
        return nombre
    
    def clean_descripcion(self):
        descripcion = self.cleaned_data.get('descripcion', '').strip()
        
        # Validar longitud
        if descripcion and len(descripcion) > 1000:
            raise forms.ValidationError('La descripción no puede exceder los 1000 caracteres.')
        
        return descripcion