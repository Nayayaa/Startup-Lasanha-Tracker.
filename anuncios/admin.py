from django.contrib import admin
from .models import Anuncio, FotoAnuncio, Portal


class FotoAnuncioInline(admin.TabularInline):
    """
    Inline: Adiciona fotos dentro da página de Anúncio.
    """
    model = FotoAnuncio
    extra = 1  # 1 linha vazia para nova foto
    fields = ['imagem', 'ordem']
    ordering = ['ordem']


@admin.register(Portal)
class PortalAdmin(admin.ModelAdmin):
    """Admin para Portais de Scraping"""
    list_display = ['id', 'nome', 'ativo']
    list_filter = ['ativo']
    search_fields = ['nome', ]
   


@admin.register(Anuncio)
class AnuncioAdmin(admin.ModelAdmin):
    list_display = ['id', 'marca', 'modelo', 'ano', 'preco', 'anunciante', 'portal', 'criado_em']
    list_filter = ['marca', 'categoria', 'ano', 'portal', 'status']
    search_fields = ['modelo', 'marca__nome', 'categoria__nome', 'titulo']
    readonly_fields = ['criado_em', 'atualizado_em']
    inlines = [FotoAnuncioInline]  # Fotos integradas


@admin.register(FotoAnuncio)
class FotoAnuncioAdmin(admin.ModelAdmin):
    """Admin separado para gerenciar fotos."""
    list_display = ['id', 'anuncio', 'ordem']
    list_filter = ['anuncio', 'ordem']
    search_fields = ['anuncio__titulo']
    ordering = ['anuncio', 'ordem']
