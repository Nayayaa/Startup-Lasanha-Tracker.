import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { CheckCircle2, ImagePlus, X } from "lucide-react";
import { apipost, apiupload } from "@/routes/api";
import { type ApiAnuncio } from "@/lib/anuncios-api";

export const Route = createFileRoute("/anunciar")({
  head: () => ({
    meta: [
      { title: "Anuncie seu carro antigo — Garagem Clássica" },
      { name: "description", content: "Anuncie gratuitamente seu carro clássico para colecionadores em todo o Brasil." },
      { property: "og:title", content: "Anuncie seu clássico" },
    ],
  }),
  component: Anunciar,
});

type PreviewFoto = { file: File; url: string };

function Anunciar() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fotos, setFotos] = useState<PreviewFoto[]>([]);

  function addFotos(files: FileList | null) {
    if (!files) return;
    const novos = Array.from(files).map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setFotos((prev) => [...prev, ...novos].slice(0, 10)); // máximo 10 fotos
  }

  function removeFoto(index: number) {
    setFotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  // Remove separadores de milhar (ponto e vírgula), fica só dígitos
  function numInt(v: FormDataEntryValue | null): number {
    const digits = String(v ?? "").replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const ano = numInt(fd.get("ano"));
    const preco = numInt(fd.get("preco"));
    const kmRaw = String(fd.get("quilometragem") ?? "").replace(/\D/g, "");
    const quilometragem = kmRaw ? parseInt(kmRaw, 10) : null;

    if (ano < 1900 || ano > 1995) {
      setError("Ano inválido. Insira um ano entre 1900 e 1995.");
      setLoading(false);
      return;
    }
    if (preco < 1) {
      setError("Valor inválido. O preço deve ser maior que zero.");
      setLoading(false);
      return;
    }

    try {
      // 1. Criar o anúncio
      const anuncio = await apipost<ApiAnuncio>("/anuncios/", {
        nome_contato:  fd.get("nome_contato"),
        telefone:      fd.get("telefone"),
        email:         fd.get("email"),
        marca_nome:    fd.get("marca_nome"),
        modelo:        fd.get("modelo"),
        ano,
        preco,
        cor:           fd.get("cor") || "",
        quilometragem,
        combustivel:   fd.get("combustivel") || "",
        cambio:        fd.get("cambio") || "",
        placa_preta:   fd.get("placa_preta") === "on",
        descricao:     fd.get("descricao"),
        tipo:          fd.get("tipo"),
      });

      // 2. Fazer upload das fotos (uma por uma)
      for (let i = 0; i < fotos.length; i++) {
        const fotoData = new FormData();
        fotoData.append("imagem", fotos[i].file);
        fotoData.append("ordem", String(i));
        await apiupload(`/anuncios/${anuncio.id}/fotos/`, fotoData).catch(() => {
          // ignora falhas individuais de foto — o anúncio já foi criado
        });
      }

      setSent(true);
    } catch (err) {
      let msg = "Não foi possível publicar o anúncio.";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          msg = Object.entries(parsed)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join(" | ");
        } catch {
          msg = err.message.includes("Failed to fetch")
            ? "Servidor indisponível. Verifique se o backend Django está rodando."
            : err.message;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md w-full rounded-md border border-border bg-card p-10 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h2 className="mt-4 font-serif text-2xl font-bold">Anúncio publicado!</h2>
            <p className="mt-2 text-muted-foreground">
              Seu carro já aparece nas buscas da Garagem Clássica.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/busca" className="rounded bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Ver anúncios
              </Link>
              <button
                onClick={() => { setSent(false); setFotos([]); }}
                className="rounded border border-input px-5 py-2 text-sm font-semibold hover:bg-muted"
              >
                Novo anúncio
              </button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-secondary py-10 text-secondary-foreground">
          <div className="mx-auto max-w-3xl px-4">
            <h1 className="font-serif text-3xl font-bold md:text-4xl">Anuncie seu clássico</h1>
            <p className="mt-2 opacity-90">Cadastro gratuito. Seu anúncio fica disponível imediatamente.</p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-10">
          <form onSubmit={handleSubmit} className="grid gap-8">

            {/* Contato */}
            <fieldset className="grid gap-4 rounded-md border border-border bg-card p-6">
              <legend className="px-1 font-serif text-lg font-bold float-left w-full">Seus dados de contato</legend>
              <Field label="Nome completo *">
                <input required name="nome_contato" className="input" placeholder="Ex: João Silva" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Telefone / WhatsApp *">
                  <input required name="telefone" className="input" placeholder="(11) 99999-9999" />
                </Field>
                <Field label="E-mail *">
                  <input required name="email" type="email" className="input" placeholder="seu@email.com" />
                </Field>
              </div>
            </fieldset>

            {/* Veículo */}
            <fieldset className="grid gap-4 rounded-md border border-border bg-card p-6">
              <legend className="px-1 font-serif text-lg font-bold float-left w-full">Dados do veículo</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Marca *">
                  <input required name="marca_nome" className="input" placeholder="Ex: Volkswagen" />
                </Field>
                <Field label="Modelo *">
                  <input required name="modelo" className="input" placeholder="Ex: Fusca" />
                </Field>
                <Field label="Ano *">
                  <input required name="ano" type="text" inputMode="numeric" className="input" placeholder="Ex: 1972" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cor">
                  <input name="cor" className="input" placeholder="Ex: Azul Báltico" />
                </Field>
                <Field label="Quilometragem">
                  <input name="quilometragem" type="text" inputMode="numeric" className="input" placeholder="Ex: 85000" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Combustível">
                  <select name="combustivel" className="input">
                    <option value="">Não informado</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Álcool">Álcool</option>
                    <option value="Flex">Flex</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </Field>
                <Field label="Câmbio">
                  <select name="cambio" className="input">
                    <option value="">Não informado</option>
                    <option value="Manual">Manual</option>
                    <option value="Automático">Automático</option>
                    <option value="CVT">CVT</option>
                  </select>
                </Field>
              </div>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" name="placa_preta" className="h-4 w-4 rounded border-input accent-primary" />
                <span className="text-sm font-medium">
                  Placa Preta — veículo de colecionador (mais de 30 anos, original)
                </span>
              </label>
            </fieldset>

            {/* Anúncio */}
            <fieldset className="grid gap-4 rounded-md border border-border bg-card p-6">
              <legend className="px-1 font-serif text-lg font-bold float-left w-full">Detalhes do anúncio</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo *">
                  <select required name="tipo" className="input">
                    <option value="venda">À venda</option>
                    <option value="aluguel">Para aluguel (por dia)</option>
                  </select>
                </Field>
                <Field label="Valor (R$) *">
                  <input required name="preco" type="text" inputMode="numeric" className="input" placeholder="Ex: 85000" />
                </Field>
              </div>
              <Field label="Descrição *">
                <textarea
                  required
                  name="descricao"
                  rows={5}
                  className="input resize-none"
                  placeholder="Conte a história do carro: restauração, originalidade, documentação, revisões..."
                />
              </Field>
            </fieldset>

            {/* Fotos */}
            <fieldset className="grid gap-4 rounded-md border border-border bg-card p-6">
              <legend className="px-1 font-serif text-lg font-bold float-left w-full">Fotos do veículo</legend>
              <p className="text-sm text-muted-foreground">Até 10 fotos. A primeira será a foto de capa.</p>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/40 py-8 hover:bg-muted/70 transition">
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Clique para selecionar fotos</span>
                <span className="text-xs text-muted-foreground">JPG, PNG, WEBP · máx. 10 fotos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => addFotos(e.target.files)}
                />
              </label>

              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {fotos.map((f, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                      <img src={f.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                          Capa
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFoto(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </fieldset>

            {error && (
              <p className="rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Publicando anúncio..." : "Publicar anúncio gratuitamente"}
            </button>
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
