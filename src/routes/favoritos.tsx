import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { CarCard } from "@/components/CarCard";
import { useFavorites } from "@/hooks/use-favorites";
import { apiget } from "@/routes/api";
import { mapAnuncioToListing, type ApiAnuncio } from "@/lib/anuncios-api";
import { type Listing } from "@/data/cars";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Lasanha Tracker" },
      { name: "description", content: "Seus clássicos favoritos salvos para acompanhar." },
    ],
  }),
  component: FavoritosPage,
});

function FavoritosPage() {
  const { favorites } = useFavorites();
  const [todos, setTodos] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiget<ApiAnuncio[] | { results: ApiAnuncio[] }>("/anuncios/")
      .then((data) => {
        if (!alive) return;
        const items = Array.isArray(data) ? data : data.results;
        setTodos(items.map(mapAnuncioToListing));
      })
      .finally(() => { if (alive) setIsLoading(false); });
    return () => { alive = false; };
  }, []);

  const favoriteCars = todos.filter((car) => favorites.includes(car.id));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
        <div className="text-center">
          <Heart className="mx-auto h-14 w-14 text-primary" strokeWidth={1.5} />
          <h1 className="mt-4 font-serif text-3xl font-bold">Seus favoritos</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Seus carros favoritos ficam salvos aqui. Você pode remover a qualquer momento.
          </p>
        </div>

        {isLoading ? (
          <p className="mt-12 text-center text-muted-foreground">Carregando...</p>
        ) : favoriteCars.length === 0 ? (
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <p className="text-lg text-muted-foreground">
              Você ainda não salvou nenhum carro. Explore os anúncios e clique no coração para
              guardar seus clássicos preferidos.
            </p>
            <Link
              to="/busca"
              className="mt-8 inline-block rounded bg-accent px-6 py-3 text-base font-semibold text-accent-foreground hover:opacity-90"
            >
              Buscar carros
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-3">
            {favoriteCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
