from django.db import models
from django.contrib.auth import get_user_model
from catalogo.models  import Marca, Categoria 


User = get_user_model()


class Portal(models.Model):
    """
    Modelo para Portais/Fontes de Scraping.
    
    Exemplos: Mercado Livre, OLX, WebMotors, Anúncio de Usuário
    Permite gerenciar dinamicamente quais portais estão ativos.
    """
    nome = models.CharField(
        max_length=50, unique=True,
        verbose_name="Nome do Portal"
    )

    url = models.URLField(
        blank=True, null=True,
        verbose_name="URL do Portal"
    )
    ativo = models.BooleanField(
        default=True,
        verbose_name="Ativo"
    )
    
    class Meta:
        ordering = ['nome']
        verbose_name = "Portal"
        verbose_name_plural = "Portais"
    
    def __str__(self):
        return self.nome


class Anuncio(models.Model):

    class Status(models.TextChoices):
        ATIVO   = 'ativo',   'Ativo'
        VENDIDO = 'vendido', 'Vendido'
        PAUSADO = 'pausado', 'Pausado'
        
    # Relacionamentos
    
    portal = models.ForeignKey(
        Portal,
        on_delete=models.PROTECT,
        related_name="anuncios",
        verbose_name="Portal de Origem",
        null =True
    )
    marca = models.ForeignKey(
        Marca, on_delete=models.PROTECT,
        verbose_name="Marca"
    )
    categoria = models.ForeignKey(
        Categoria, on_delete=models.PROTECT,
        verbose_name="Categoria", blank = True, null = True
    )
    anunciante = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        related_name="anuncios",
        verbose_name="Anunciante", blank=True, null = True
    )
    
    # Dados do veículo
    modelo = models.CharField(max_length=100, verbose_name="Modelo")
    ano = models.PositiveIntegerField(verbose_name="Ano")
    cor = models.CharField(max_length=50, blank=True, verbose_name="Cor")
    placa_preta = models.BooleanField(
        default = False,
        verbose_name = 'placa_preta',
        help_text = " Se marcado, o veiculo é de colecionador"
        )
    
    combustivel = models.CharField(max_length=50, blank=True,
            verbose_name="Combustível"
            )
    cambio = models.CharField(max_length=50, blank=True, verbose_name="Câmbio")
    
    quilometragem = models.PositiveIntegerField(
        null=True, blank=True, 
        verbose_name="Quilometragem"
        )
    
    # Dados do anúncio
    titulo = models.CharField(max_length=200, verbose_name="Título")
    descricao = models.TextField(blank=True, verbose_name="Descrição")
    
    preco = models.DecimalField(
        max_digits=12, decimal_places=2, 
         verbose_name="Preço"
         )

        # Web Scraping - armazena resposta completa da API/scraping
    dados_externos = models.JSONField(
        default=dict, blank=True, 
        verbose_name="Dados de Scraping (JSON completo)"
    )
    
    status    = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ATIVO
    )

    # Timestamps
    criado_em = models.DateTimeField(
        auto_now_add=True, verbose_name="Criado em"
    )
    atualizado_em = models.DateTimeField(
        auto_now=True, verbose_name="Atualizado em"
    )
    

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self):
        return f"{self.marca.nome} {self.modelo} ({self.ano})"


class Estado (models.Model):
    nome = models.CharField(max_length= 100, unique = True)
    uf   = models.CharField(max_length=2, unique = True)
    
    class Meta:
        ordering = ["nome"]
        verbose_name = "estado"
        verbose_name_plural = "estados"
    def __str__ (self):
        return f"{self.nome} ({self.uf})"
        


class Cidade(models.Model):
    estado      = models.ForeignKey(Estado, on_delete = models.CASCADE)
    nome        = models.CharField(max_length= 100)
    codigo_ibge = models.CharField(max_length =7, unique = True, blank = True)
    
    class Meta: 
        unique_together =  [["nome", "estado"]]
        ordering = ["nome"]
        verbose_name = "estado"
        verbose_name_plural = "estados"
    def __str__ (self):
        return f"{self.nome} ({self.estado.uf})"
        
        
class FotoAnuncio(models.Model):
    """
    Modelo para Fotos de Anúncios.
    Permite múltiplas fotos por anúncio.
    
    Uso: anuncio.fotos.all() → retorna todas as fotos em ordem
    """
    
    anuncio = models.ForeignKey(
        Anuncio,
        on_delete=models.CASCADE,  # Se deletar anúncio, deleta fotos
        related_name="fotos",      # anuncio.fotos.all()
        verbose_name="Anúncio"
    )
    
    imagem = models.ImageField(
        upload_to="anuncios/%Y/%m/%d/",
        verbose_name="Foto"
    )
    
    ordem = models.PositiveIntegerField(
        default=0,
        verbose_name="Ordem",
        help_text="0 = primeira foto (destaque na listagem)"
    )
    
    class Meta:
        ordering = ['ordem']  # Mantém ordem de exibição
        verbose_name = "Foto de Anúncio"
        verbose_name_plural = "Fotos de Anúncio"
    
    def __str__(self):
        return f"Foto {self.ordem} - {self.anuncio.titulo}"