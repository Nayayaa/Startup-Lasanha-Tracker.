from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    telefone = models.CharField(
        max_length=15, blank=True,
        verbose_name="Telefone"
    )
    data_de_nascimento = models.DateField(
        null=True, blank=True,
        verbose_name="Data de Nascimento"
    )
    foto_perfil = models.ImageField(
        upload_to='fotos_perfil/', blank=True,
        null=True, verbose_name='Foto de Perfil'
    )
    cpf = models.CharField(
        max_length=14, unique=True,
        blank=True, null=True,
        verbose_name='CPF'
    )

    def __str__(self):
        return self.username
    
class PerfilAnunciante(models.Model):
    user = models.OneToOneField(
        User,
        on_delete      = models.CASCADE,
        related_name   = "perfil_anunciante"
        )
    verificado         = models.BooleanField(  default= False)
    status_verificacao = models.CharField(
     default ="pendente",
     max_length =20
    )
    score  = models.PositiveIntegerField(default =0)
    criado_em = models.DateTimeField(auto_now_add =True)
    atualizado_em = models.DateTimeField (auto_now =True)
        
    def __str__ (self):
        return f"{self.user.username} - {self.status_verificacao}"
        