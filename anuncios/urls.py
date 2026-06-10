from rest_framework.routers import DefaultRouter
from .views import AnuncioViewSet, PortalViewSet

router = DefaultRouter()
router.register(r'anuncios', AnuncioViewSet, basename='anuncio')
router.register(r'portais' ,PortalViewSet)


urlpatterns = router.urls
