from rest_framework import viewsets, permissions
from .models import Marca, Categoria
from .serializers import MarcaSerializer, CategoriaSerializer


class MarcaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar marcas.
    - GET /api/catalogo/marcas/ - listar todas
    - GET /api/catalogo/marcas/{id}/ - detalhe
    """
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar categorias (tipos de veículos).
    - GET /api/catalogo/categorias/ - listar todas
    - GET /api/catalogo/categorias/{id}/ - detalhe
    """
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
