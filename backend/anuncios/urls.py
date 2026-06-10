from rest_framework.routers import DefaultRouter
from .views import AnuncioViewSet, PortalViewSet, FotoAnuncioDeleteView

router = DefaultRouter()
router.register(r'anuncios', AnuncioViewSet, basename='anuncio')
router.register(r'portais', PortalViewSet)
router.register(r'fotos', FotoAnuncioDeleteView, basename='foto')

urlpatterns = router.urls
