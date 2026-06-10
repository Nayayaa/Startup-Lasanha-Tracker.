from django.db import models


class Marca(models.Model):
    
    nome = models.CharField(
        max_length=100, unique=True,
                            verbose_name="Nome da Marca"
                            )
    
    def __str__(self):
        return self.nome
    
    class Meta:
        verbose_name = "Marca"
        verbose_name_plural = "Marcas"
        ordering = ["nome"]


class Categoria(models.Model):
    nome = models.CharField(
        max_length=20, unique=True, 
         verbose_name="Categoria"
         )
    
    def __str__(self):
        return self.nome
    
    class Meta:
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"
        ordering = ["nome"]
