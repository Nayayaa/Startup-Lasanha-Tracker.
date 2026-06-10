from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PerfilAnunciante


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Informações Pessoais', {
            'fields': ('first_name', 'last_name', 'email', 'data_de_nascimento', 'cpf')
        }),
        ('Contato', {'fields': ('telefone', 'foto_perfil')}),
        ('Permissões', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Datas', {'fields': ('last_login', 'date_joined')}),
    )
    list_display = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
    search_fields = ['username', 'email', 'cpf']
    ordering = ['-date_joined']
    readonly_fields = ['last_login', 'date_joined']


@admin.register(PerfilAnunciante)
class PerfilAnuncianteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'verificado', 'status_verificacao', 'score']
    search_fields = ['user__username', 'user__email']
    list_filter = ['verificado', 'status_verificacao']