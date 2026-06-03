from rest_framework import viewsets, status, filters, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from .models import Anuncio, Portal, FotoAnuncio
from .serializers import AnuncioSerializer, FotoAnuncioSerializer, PortalSerializer
from catalogo.models import Marca
import requests
from rest_framework.parsers import MultiPartParser


class AnuncioViewSet(viewsets.ModelViewSet):

    queryset = Anuncio.objects.all()
    serializer_class = AnuncioSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['modelo', 'marca__nome', 'categoria__nome', 'cor']
    ordering_fields = ['ano', 'preco', 'quilometragem', 'criado_em']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'upload_foto'):
            return [AllowAny()]
        return [IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        queryset = Anuncio.objects.all().prefetch_related("fotos")
        marca = self.request.query_params.get('marca')
        categoria = self.request.query_params.get('categoria')
        ano = self.request.query_params.get('ano')
        portal = self.request.query_params.get('portal')
        status_filtro = self.request.query_params.get('status')

        if marca:
            queryset = queryset.filter(marca__nome__icontains=marca)
        if categoria:
            queryset = queryset.filter(categoria__nome__icontains=categoria)
        if ano:
            queryset = queryset.filter(ano=ano)
        if portal:
            queryset = queryset.filter(portal__id=portal)
        if status_filtro:
            queryset = queryset.filter(status=status_filtro)

        return queryset

    def _prepare_data(self, data, instance=None):
        """
        Extrai campos extras do dict, resolve marca e portal.
        Retorna (data_modificado, dados_externos).
        """
        # Auto-assign portal "Anuncio de Usuario"
        if not data.get('portal'):
            portal_obj, _ = Portal.objects.get_or_create(
                nome='Anuncio de Usuario',
                defaults={'ativo': True}
            )
            data['portal'] = portal_obj.id

        # Resolve marca por nome
        marca_nome = str(data.get('marca_nome', '')).strip().title()
        if marca_nome:
            marca_obj, _ = Marca.objects.get_or_create(nome=marca_nome)
            data['marca'] = marca_obj.id
        elif instance and not data.get('marca'):
            data['marca'] = instance.marca_id

        # Monta título automático
        if not data.get('titulo'):
            modelo = data.get('modelo', instance.modelo if instance else '')
            ano = data.get('ano', instance.ano if instance else '')
            nome_marca = marca_nome or (instance.marca.nome if instance else '')
            data['titulo'] = f"{nome_marca} {modelo} {ano}".strip()

        # Extrai campos de contato → dados_externos
        existing_dados = (instance.dados_externos or {}) if instance else {}
        dados_externos = {
            **existing_dados,
            'nome_contato': str(data.pop('nome_contato', existing_dados.get('nome_contato', '')) or ''),
            'telefone':     str(data.pop('telefone',     existing_dados.get('telefone', ''))     or ''),
            'email':        str(data.pop('email',        existing_dados.get('email', ''))        or ''),
            'tipo':         str(data.pop('tipo',         existing_dados.get('tipo', 'venda'))    or 'venda'),
        }
        data.pop('marca_nome', None)

        return data, dados_externos

    def create(self, request, *args, **kwargs):
        data, dados_externos = self._prepare_data(request.data.copy())

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        anunciante = request.user if request.user.is_authenticated else None
        serializer.save(anunciante=anunciante, dados_externos=dados_externos)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        data, dados_externos = self._prepare_data(request.data.copy(), instance=instance)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save(dados_externos=dados_externos)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='buscar-ml')
    def buscar_ml(self, request):
        """
        Busca carros no Mercado Livre em tempo real.
        GET /api/anuncios/buscar-ml/?q=fusca
        """
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {"erro": "Parâmetro 'q' é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            resp = requests.get(
                "https://api.mercadolibre.com/sites/MLB/search",
                params={
                    "q":        f"carro classico {query}",
                    "category": "MLB1744",
                    "limit":    20,
                    "sort":     "price_asc",
                },
                timeout=5
            )
            resp.raise_for_status()
            dados = resp.json()

            resultados = []
            for item in dados.get("results", []):
                atributos = {
                    a["id"]: a.get("value_name", "")
                    for a in item.get("attributes", [])
                }
                resultados.append({
                    "titulo":        item.get("title"),
                    "preco":         item.get("price"),
                    "ano":           atributos.get("VEHICLE_YEAR"),
                    "quilometragem": atributos.get("KILOMETERS"),
                    "combustivel":   atributos.get("FUEL_TYPE"),
                    "cambio":        atributos.get("TRANSMISSION"),
                    "cor":           atributos.get("COLOR"),
                    "link_origem":   item.get("permalink"),
                    "imagem":        item.get("thumbnail"),
                    "fonte":         "mercadolivre",
                    "condicao":      item.get("condition"),
                    "localizacao":   item.get("address", {}).get("state_name", ""),
                })

            return Response({
                "query":      query,
                "total":      dados.get("paging", {}).get("total", 0),
                "resultados": resultados
            })

        except requests.Timeout:
            return Response(
                {"erro": "O Mercado Livre demorou para responder. Tente novamente."},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except Exception as e:
            return Response(
                {"erro": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(
        detail=True,
        methods=['post'],
        url_path='fotos',
        parser_classes=[MultiPartParser]
    )
    def upload_foto(self, request, pk=None):
        anuncio = self.get_object()
        serializer = FotoAnuncioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(anuncio=anuncio)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FotoAnuncioDeleteView(mixins.DestroyModelMixin, viewsets.GenericViewSet):
    """DELETE /api/fotos/{id}/ — remove uma foto individual."""
    queryset = FotoAnuncio.objects.all()
    serializer_class = FotoAnuncioSerializer
    permission_classes = [AllowAny]


class PortalViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Portal.objects.filter(ativo=True)
    serializer_class = PortalSerializer
    permission_classes = [AllowAny]
