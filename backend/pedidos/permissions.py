from rest_framework.permissions import BasePermission


class IsDonoDoPedido(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.comprador_id == request.user.id