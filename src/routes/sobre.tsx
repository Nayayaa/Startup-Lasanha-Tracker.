import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Lasanha Tracker" },
      { name: "description", content: "Conheça a Lasanha Tracker, o marketplace dedicado a colecionadores de carros antigos." },
      { property: "og:title", content: "Sobre a Lasanha Tracker" },
      { property: "og:description", content: "Marketplace para entusiastas de automóveis clássicos." },
    ],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-14">
          <h1 className="font-serif text-4xl font-bold">Sobre a Lasanha Tracker</h1>
          <p className="mt-6 text-lg leading-relaxed text-foreground/90">
            Somos um marketplace dedicado exclusivamente a automóveis antigos. Conectamos colecionadores,
            compradores e entusiastas que valorizam a história de cada veículo — dos majestosos sedans dos
            anos 50 aos esportivos brasileiros dos anos 70.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-foreground/90">
            Aqui você encontra anúncios verificados, documentação conferida e atendimento humano de quem
            entende do assunto.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-6 text-center">
      <div className="font-serif text-3xl font-bold text-primary">{n}</div>
      <div className="mt-1 text-sm text-muted-foreground">{l}</div>
    </div>
  );
}