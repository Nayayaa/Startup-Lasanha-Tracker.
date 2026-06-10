from django.core.management.base import BaseCommand
from anuncios.models import Anuncio, Portal
from catalogo.models import Marca, Categoria
from users.models import User
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Cria anuncios de teste"
    def handle (self,*args, **kwargs):
        portal, _ = Portal.objects.get_or_create(nome="Anuncio de Usuario")
        marca, _  = Marca.objects.get_or_create(nome="Volkswagen")
        categoria, _ =  Categoria.objects.get_or_create(nome="Classico")
        user, _ = User.objects.get_or_create(username= "teste")
        
        Anuncio.objects.create(
            portal=portal,
            marca=marca,
            categoria=categoria,
            anunciante=user,
            modelo="Fusca 1972",
            ano=1972,
            cor="Azul",
            titulo="Fusca azul classico",
            descricao="Carro de colecionador",
            preco=45000
        )

        self.stdout.write(self.style.SUCCESS("Anuncios de teste criados"))
        