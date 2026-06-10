from rest_framework import serializers

from .models import Pedido


class PedidoSerializer(serializers.ModelSerializer):
    anuncio_titulo = serializers.CharField(source="anuncio.titulo", read_only=True)
    comprador_username = serializers.CharField(source="comprador.username", read_only=True)

    class Meta:
        model = Pedido
        fields = [
            "id",
            "comprador",
            "comprador_username",
            "anuncio",
            "anuncio_titulo",
            "preco_snapshot",
            "valor_retido",
            "status",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = [
            "comprador",
            "preco_snapshot",
            "valor_retido",
            "criado_em",
            "atualizado_em",
        ]


class PedidoCreateSerializer(serializers.Serializer):
    anuncio_id = serializers.IntegerField()
