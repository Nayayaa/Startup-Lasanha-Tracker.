import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { formatPrice } from "@/data/cars";
import { MapPin, Gauge, Calendar, Phone, Mail } from "lucide-react";
import { apiget } from "@/routes/api";
import { mapAnuncioToListing, type ApiAnuncio } from "@/lib/anuncios-api";
import { type Listing } from "@/data/cars";

export const Route = createFileRoute("/carro/$id")({
  component: CarPage,
});

function CarPage() {
  const { id } = Route.useParams();
  const [car, setCar] = useState<Listing | null>(null);
  const [raw, setRaw] = useState<ApiAnuncio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fotoAtual, setFotoAtual] = useState(0);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    setNotFound(false);

    apiget<ApiAnuncio>(`/anuncios/${id}/`)
      .then((data) => {
        if (!alive) return;
        setCar(mapAnuncioToListing(data));
        setRaw(data);
      })
      .catch(() => {
        if (alive) setNotFound(true);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => { alive = false; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Carregando anúncio...</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (notFound || !car || !raw) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center p-10 text-center">
          <div>
            <h1 className="font-serif text-3xl font-bold">Anúncio não encontrado</h1>
            <p className="mt-2 text-muted-foreground">O anúncio pode ter sido removido ou o link está incorreto.</p>
            <Link to="/busca" className="mt-4 inline-block text-primary hover:underline">
              Voltar para a busca
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const tipo = raw.dados_externos?.tipo ?? "venda";
  const telefone = raw.dados_externos?.telefone;
  const email = raw.dados_externos?.email;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <nav className="text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Início</Link> ·{" "}
            <Link to="/busca" className="hover:text-primary">Buscar</Link> ·{" "}
            <span className="text-foreground">{car.title}</span>
          </nav>
        </div>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="relative overflow-hidden rounded-md border border-border bg-card">
              {(raw.fotos ?? []).length > 0 ? (
                <>
                  <img
                    src={raw.fotos![fotoAtual].imagem_url ?? raw.fotos![fotoAtual].imagem ?? ""}
                    alt={`${car.title} — foto ${fotoAtual + 1}`}
                    className="aspect-4/3 w-full object-cover"
                  />
                  {raw.fotos!.length > 1 && (
                    <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3">
                      <button
                        onClick={() => setFotoAtual((f) => Math.max(0, f - 1))}
                        disabled={fotoAtual === 0}
                        className="rounded-full bg-black/60 px-3 py-1 text-white disabled:opacity-30"
                      >
                        ‹
                      </button>
                      <span className="text-xs text-white bg-black/50 rounded px-2 py-0.5">
                        {fotoAtual + 1} / {raw.fotos!.length}
                      </span>
                      <button
                        onClick={() => setFotoAtual((f) => Math.min(raw.fotos!.length - 1, f + 1))}
                        disabled={fotoAtual === raw.fotos!.length - 1}
                        className="rounded-full bg-black/60 px-3 py-1 text-white disabled:opacity-30"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-4/3 flex items-center justify-center bg-muted text-muted-foreground text-sm">
                  Sem foto disponível
                </div>
              )}
            </div>

            <div className="mt-8 rounded-md border border-border bg-card p-6">
              <h2 className="font-serif text-2xl font-bold">Descrição</h2>
              <p className="mt-3 leading-relaxed text-foreground/90">
                {car.description || "Sem descrição disponível."}
              </p>

              <h3 className="mt-6 font-serif text-xl font-bold">Especificações</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {car.brand && <Spec label="Marca" value={car.brand} />}
                <Spec label="Modelo" value={car.model} />
                <Spec label="Ano" value={String(car.year)} />
                {car.km > 0 && <Spec label="Quilometragem" value={`${car.km.toLocaleString("pt-BR")} km`} />}
                <Spec label="Tipo" value={tipo === "aluguel" ? "Aluguel" : "À venda"} />
                {raw.cor && <Spec label="Cor" value={raw.cor} />}
                {raw.combustivel && <Spec label="Combustível" value={raw.combustivel} />}
                {raw.cambio && <Spec label="Câmbio" value={raw.cambio} />}
                {raw.placa_preta && <Spec label="Placa Preta" value="Sim — veículo de colecionador" />}
              </dl>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-md border border-border bg-card p-6">
              <span className="inline-block rounded bg-primary px-2 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
                {tipo === "aluguel" ? "Para aluguel" : "À venda"}
              </span>
              <h1 className="mt-3 font-serif text-3xl font-bold leading-tight">{car.title}</h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{car.year}</span>
                {car.km > 0 && (
                  <span className="flex items-center gap-1"><Gauge className="h-4 w-4" />{car.km.toLocaleString("pt-BR")} km</span>
                )}
                {(car.city || car.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />{[car.city, car.state].filter(Boolean).join("/")}
                  </span>
                )}
              </div>
              <div className="mt-5 border-t border-border pt-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {tipo === "aluguel" ? "Diária a partir de" : "Valor"}
                </div>
                <div className="font-serif text-4xl font-bold text-primary">
                  {formatPrice(car.price)}
                  {tipo === "aluguel" && (
                    <span className="text-base font-normal text-muted-foreground"> /dia</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Anunciante</div>
              <div className="mt-1 font-serif text-xl font-bold">
                {raw.dados_externos?.nome_contato || car.seller}
              </div>

              {telefone ? (
                <a
                  href={`tel:${telefone.replace(/\D/g, "")}`}
                  className="mt-4 flex items-center justify-center gap-2 rounded bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Phone className="h-4 w-4" /> {telefone}
                </a>
              ) : (
                <div className="mt-4 flex items-center justify-center gap-2 rounded border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" /> Telefone não informado
                </div>
              )}

              {email && (
                <a
                  href={`mailto:${email}?subject=Interesse em ${encodeURIComponent(car.title)}`}
                  className="mt-3 flex items-center justify-center gap-2 rounded border border-input bg-background px-4 py-3 font-semibold hover:bg-muted"
                >
                  <Mail className="h-4 w-4" /> Enviar e-mail
                </a>
              )}
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-background p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
