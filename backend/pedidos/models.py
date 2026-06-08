from django.db import models


class Pedido(models.Model):
    class Status(models.TextChoices):
        RASCUNHO = "rascunho", "Rascunho"
        PROPOSTA_ENVIADA = "proposta_enviada", "Proposta enviada"
        PAGAMENTO_RETIDO = "pagamento_retido", "Pagamento retido"
        EM_TRANSFERENCIA = "em_transferencia", "Em transferência"
        CONCLUIDO = "concluido", "Concluído"
        CANCELADO = "cancelado", "Cancelado"

    comprador = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="pedidos",
        verbose_name="Comprador",
    )
    anuncio = models.ForeignKey(
        "anuncios.Anuncio",
        on_delete=models.PROTECT,
        related_name="pedidos",
        verbose_name="Anúncio",
    )
    preco_snapshot = models.DecimalField(max_digits=12, decimal_places=2)
    valor_retido = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.RASCUNHO,
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-criado_em"]
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"

    def __str__(self) -> str:
        return f"Pedido #{self.pk} — {self.anuncio.titulo}"