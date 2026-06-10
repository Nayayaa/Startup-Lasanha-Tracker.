from rest_framework import serializers
from .models import User


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para registração de novos usuários"""
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(**validated_data, password=password)
        


class UserSerializer(serializers.ModelSerializer):
    """Serializer para perfil de usuário"""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'telefone', 'data_de_nascimento', 'foto_perfil', 'cpf',
            'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
