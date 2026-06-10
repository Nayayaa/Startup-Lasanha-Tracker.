from rest_framework import serializers
from .models import Marca, Categoria


class MarcaSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Marca
        fields = ['id', 'nome']


class CategoriaSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Categoria
        fields = ['id', 'nome']
     