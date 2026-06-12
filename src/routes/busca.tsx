import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { SearchBar } from "@/components/SearchBar";
import { CarCard } from "@/components/CarCard";
import { type Listing } from "@/data/cars";
import { apiget } from "@/routes/api";
import { mapAnuncioToListing, type ApiAnuncio } from "@/lib/anuncios-api";

type MlItem = {
  titulo: string | null;
  preco: number | null;
  ano: string | null;
  imagem: string | null;
  link_origem: string | null;
  localizacao: string | null;
};

type MlResponse = {
  query: string;
  total: number;
  resultados: MlItem[];
};

const searchSchema = z.object({
  q: z.string().optional(),
  brand: z.string().optional(),
  type: z.enum(["venda", "aluguel"]).optional(),
  minYear: z.number().optional(),
  maxYear: z.number().optional(),
  blackPlate: z.preprocess((value) => {
    if (value === "true" || value === true) return true;
    if (value === "false") return false;
    return undefined;
  }, z.boolean()).optional(),
});

export const Route = createFileRoute("/busca")({
  validateSearch: (input: Record<string, unknown>) => searchSchema.parse(input),
  head: () => ({
    meta: [
      { title: "Buscar carros antigos — Garagem Clássica" },
      { name: "description", content: "Encontre clássicos para comprar ou alugar. Filtre por marca, ano e tipo." },
      { property: "og:title", content: "Buscar carros antigos" },
      { property: "og:description", content: "Filtre clássicos por marca, ano e cidade." },
    ],
  }),
  component: BuscaPage,
});

function BuscaPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [sort, setSort] = useState<"recentes" | "menor" | "maior" | "antigos">("recentes");
  const [items, setItems] = useState<Listing[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [mlItems, setMlItems] = useState<MlItem[]>([]);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);
  const [mlQueried, setMlQueried] = useState(false);

  useEffect(() => {
    let alive = true;

    const loadAnuncios = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (search.q) params.set("search", search.q);
        if (search.brand) params.set("marca", search.brand);
        const query = params.toString();
        const path = query ? `/anuncios/?${query}` : "/anuncios/";
        const data = await apiget<ApiAnuncio[] | { results: ApiAnuncio[] }>(path);
        const list = Array.isArray(data) ? data : data.results;
        if (alive) setItems(list.map(mapAnuncioToListing));
        if (alive) setLoadError(null);
      } catch (error) {
        if (alive) setLoadError(error instanceof Error ? error.message : "Erro ao carregar anúncios");
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    loadAnuncios();
    // Reset ML results when search changes
    setMlItems([]);
    setMlQueried(false);
    setMlError(null);
    return () => { alive = false; };
  }, [search.q, search.brand]);

  const results = useMemo(() => {
    let list = items.slice();
    if (search.q) {
      const q = search.q.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.brand.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q),
      );
    }
    if (search.brand) list = list.filter((c) => c.brand === search.brand);
    if (search.type) list = list.filter((c) => c.type === search.type);
    if (search.minYear) list = list.filter((c) => c.year >= search.minYear!);
    if (search.maxYear) list = list.filter((c) => c.year <= search.maxYear!);
    if (search.blackPlate) list = list.filter((c) => c.blackPlate);
    if (sort === "menor") list.sort((a, b) => a.price - b.price);
    if (sort === "maior") list.sort((a, b) => b.price - a.price);
    if (sort === "antigos") list.sort((a, b) => a.year - b.year);
    return list;
  }, [items, search, sort]);

  async function buscarNoML() {
    const q = search.q || "carro classico";
    setMlLoading(true);
    setMlError(null);
    setMlQueried(true);
    try {
      const data = await apiget<MlResponse>(`/anuncios/buscar-ml/?q=${encodeURIComponent(q)}`);
      setMlItems(data.resultados);
    } catch {
      setMlError("Não foi possível buscar no Mercado Livre. Tente novamente.");
    } finally {
      setMlLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-secondary py-8 text-secondary-foreground">
          <div className="mx-auto max-w-6xl px-4">
            <h1 className="font-serif text-3xl font-bold">Buscar carros</h1>
            <p className="mt-1 opacity-90">Filtre entre os clássicos disponíveis</p>
            <div className="mt-6">
              <SearchBar
                initialQ={search.q ?? ""}
                initialBrand={search.brand ?? ""}
                initialType={search.type ?? ""}
                initialBlackPlate={search.blackPlate ?? false}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span>{" "}
              {results.length === 1 ? "anúncio encontrado" : "anúncios encontrados"}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-muted-foreground">Ordenar por:</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="recentes">Mais recentes</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
                <option value="antigos">Ano mais antigo</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded border border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">Carregando anúncios...</p>
            </div>
          ) : loadError ? (
            <div className="rounded border border-border bg-card p-10 text-center">
              <p className="text-sm text-destructive">{loadError}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded border border-border bg-card p-10 text-center">
              <p className="font-serif text-xl">Nenhum carro encontrado</p>
              <p className="mt-2 text-sm text-muted-foreground">Tente ajustar os filtros da sua busca.</p>
              <button
                onClick={() => navigate({ to: "/busca", search: {} })}
                className="mt-4 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
              {results.map((c) => (
                <CarCard key={c.id} car={c} />
              ))}
            </div>
          )}
        </section>

        {/* Seção Mercado Livre */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="border-t border-border pt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold">Mercado Livre</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Veja também anúncios externos de carros clássicos
                </p>
              </div>
              {!mlQueried && (
                <button
                  onClick={buscarNoML}
                  disabled={mlLoading}
                  className="rounded bg-[#FFE600] px-5 py-2.5 text-sm font-bold text-[#333] hover:opacity-90 disabled:opacity-50"
                >
                  {mlLoading ? "Buscando..." : "Buscar no Mercado Livre"}
                </button>
              )}
            </div>

            {mlLoading && (
              <p className="mt-6 text-sm text-muted-foreground">Buscando no Mercado Livre...</p>
            )}

            {mlError && (
              <p className="mt-6 text-sm text-destructive">{mlError}</p>
            )}

            {mlQueried && !mlLoading && mlItems.length === 0 && !mlError && (
              <p className="mt-6 text-sm text-muted-foreground">Nenhum resultado encontrado no Mercado Livre.</p>
            )}

            {mlItems.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {mlItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:shadow-md"
                  >
                    {item.imagem ? (
                      <div className="aspect-[4/3] overflow-hidden bg-muted">
                        <img
                          src={item.imagem}
                          alt={item.titulo ?? ""}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-muted" />
                    )}
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <p className="text-xs text-muted-foreground">
                        {[item.localizacao, item.ano].filter(Boolean).join(" · ")}
                      </p>
                      <h3 className="text-sm font-semibold leading-snug line-clamp-2">{item.titulo}</h3>
                      {item.preco != null && (
                        <div className="font-serif text-lg font-bold">
                          {item.preco.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      )}
                      {item.link_origem && (
                        <a
                          href={item.link_origem}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto inline-flex items-center justify-center rounded bg-[#FFE600] px-3 py-2 text-xs font-bold text-[#333] hover:opacity-90"
                        >
                          Ver no Mercado Livre ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
