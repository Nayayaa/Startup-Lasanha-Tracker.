import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader, SiteFooter, BrandMark } from "@/components/SiteHeader";
import { CarCard } from "@/components/CarCard";
import { type Listing } from "@/data/cars";
import { apiget } from "@/routes/api";
import { mapAnuncioToListing, type ApiAnuncio } from "@/lib/anuncios-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lasanha Tracker — Compre, venda e alugue carros antigos" },
      {
        name: "description",
        content:
          "Marketplace para colecionadores e entusiastas: compre, venda e alugue automóveis clássicos das décadas de 50, 60, 70 e 80.",
      },
      { property: "og:title", content: "Lasanha Tracker — Carros antigos" },
      { property: "og:description", content: "Compra, venda e aluguel de clássicos." },
    ],
  }),
  component: Index,
});

function Index() {
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    const loadFeatured = async () => {
      try {
        const data = await apiget<ApiAnuncio[] | { results: ApiAnuncio[] }>("/anuncios/");
        const items = Array.isArray(data) ? data : data.results;
        const mapped = items.map(mapAnuncioToListing).slice(0, 4);
        if (alive) setFeatured(mapped);
      } catch (error) {
        const msg =
          error instanceof TypeError && error.message === "Failed to fetch"
            ? "Servidor indisponível. Inicie o backend Django com: cd backend && python manage.py runserver"
            : error instanceof Error
            ? error.message
            : "Erro ao carregar anúncios";
        if (alive) setLoadError(msg);
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    loadFeatured();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-14 pb-10">
          <BrandMark size="lg" />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/busca", search: { q: q || undefined } as any });
            }}
            className="mt-10 flex w-full max-w-xl items-center gap-2 rounded-full border-2 border-border bg-card px-5 py-3 shadow-sm focus-within:border-primary"
          >
            <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar modelo (Ex: Fusca)..."
              aria-label="Pesquisar modelo"
              className="w-full bg-transparent text-lg outline-none placeholder:text-muted-foreground"
            />
          </form>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando anúncios...</p>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((c) => (
                <CarCard key={c.id} car={c} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
