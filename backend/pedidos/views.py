from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from anuncios.models import Anuncio
from .models import Pedido
from .serializers import PedidoCreateSerializer, PedidoSerializer
from .permissions import IsDonoDoPedido


class PedidoViewSet(viewsets.ModelViewSet):
	queryset = Pedido.objects.select_related("anuncio", "comprador")
	permission_classes = [IsAuthenticated]

	_STATUS_FLOW = {
		Pedido.Status.PROPOSTA_ENVIADA: Pedido.Status.PAGAMENTO_RETIDO,
		Pedido.Status.PAGAMENTO_RETIDO: Pedido.Status.EM_TRANSFERENCIA,
		Pedido.Status.EM_TRANSFERENCIA: Pedido.Status.CONCLUIDO,
	}

	def get_queryset(self):
		return super().get_queryset().filter(comprador=self.request.user)

	def get_permissions(self):
		if self.action in ("list", "create", "meus", "retrieve"):
			return [IsAuthenticated()]
		return [IsAuthenticated(), IsDonoDoPedido()]

	def get_serializer_class(self):
		if self.action == "create":
			return PedidoCreateSerializer
		return PedidoSerializer

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		anuncio_id = serializer.validated_data["anuncio_id"]
		try:
			anuncio = Anuncio.objects.get(id=anuncio_id)
		except Anuncio.DoesNotExist:
			return Response({"erro": "Anúncio não encontrado."}, status=status.HTTP_404_NOT_FOUND)

		if anuncio.anunciante_id and anuncio.anunciante_id == request.user.id:
			return Response(
				{"erro": "Você não pode comprar o próprio anúncio."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		pedido = Pedido.objects.create(
			comprador=request.user,
			anuncio=anuncio,
			preco_snapshot=anuncio.preco,
			valor_retido=anuncio.preco,
			status=Pedido.Status.PROPOSTA_ENVIADA,
		)

		output = PedidoSerializer(pedido, context={"request": request})
		return Response(output.data, status=status.HTTP_201_CREATED)

	def partial_update(self, request, *args, **kwargs):
		instance = self.get_object()
		next_status = request.data.get("status")

		if next_status:
			esperado = self._STATUS_FLOW.get(instance.status)
			if esperado != next_status:
				return Response(
					{"erro": "Transição de status inválida."},
					status=status.HTTP_400_BAD_REQUEST,
				)

		return super().partial_update(request, *args, **kwargs)

	@action(detail=False, methods=["get"], url_path="meus")
	def meus(self, request):
		pedidos = self.get_queryset().order_by("-criado_em")
		serializer = PedidoSerializer(pedidos, many=True, context={"request": request})
		return Response(serializer.data)

	@action(detail=True, methods=["post"], url_path="confirmar-recebimento")
	def confirmar_recebimento(self, request, pk=None):
		pedido = self.get_object()
		if pedido.status != Pedido.Status.EM_TRANSFERENCIA:
			return Response(
				{"erro": "Pedido não está em transferência."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		pedido.status = Pedido.Status.CONCLUIDO
		pedido.save(update_fields=["status"]) 
		serializer = PedidoSerializer(pedido, context={"request": request})
		return Response(serializer.data)