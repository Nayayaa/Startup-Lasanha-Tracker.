import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ImagePlus, X, Trash2, Save } from "lucide-react";
import { apiget, apipatch, apiupload, apidelete } from "@/routes/api";
import { type ApiAnuncio, type ApiFoto } from "@/lib/anuncios-api";

export const Route = createFileRoute("/editar_anuncio/$id")({
  component: EditarAnuncio,
});

type FormState = {
  marca_nome: string;
  modelo: string;
  ano: string;
  cor: string;
  quilometragem: string;
  combustivel: string;
  cambio: string;
  placa_preta: boolean;
  tipo: string;
  preco: string;
  descricao: string;
  nome_contato: string;
  telefone: string;
  email: string;
};

type PreviewFoto = { file: File; url: string };

function numInt(v: string): number {
  const digits = v.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function EditarAnuncio() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState | null>(null);
  const [existingFotos, setExistingFotos] = useState<ApiFoto[]>([]);
  const [newFotos, setNewFotos] = useState<PreviewFoto[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiget<ApiAnuncio>(`/anuncios/${id}/`)
      .then((data) => {
        const precoRaw =
          typeof data.preco === "string"
            ? data.preco.replace(/\.00$/, "").replace(/,00$/, "")
            : String(Math.round(Number(data.preco)));

        setForm({
          marca_nome:    data.marca_nome ?? "",
          modelo:        data.modelo ?? "",
          ano:           String(data.ano ?? ""),
          cor:           data.cor ?? "",
          quilometragem: data.quilometragem ? String(data.quilometragem) : "",
          combustivel:   data.combustivel ?? "",
          cambio:        data.cambio ?? "",
          placa_preta:   data.placa_preta ?? false,
          tipo:          data.dados_externos?.tipo ?? "venda",
          preco:         precoRaw,
          descricao:     data.descricao ?? "",
          nome_contato:  data.dados_externos?.nome_contato ?? "",
          telefone:      data.dados_externos?.telefone ?? "",
          email:         data.dados_externos?.email ?? "",
        });
        setExistingFotos(data.fotos ?? []);
      })
      .catch(() => setPageError(true))
      .finally(() => setPageLoading(false));
  }, [id]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function addFotos(files: FileList | null) {
    if (!files) return;
    const slots = 10 - existingFotos.length - newFotos.length;
    if (slots <= 0) return;
    const novos = Array.from(files)
      .slice(0, slots)
      .map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setNewFotos((prev) => [...prev, ...novos]);
  }

  function removeNewFoto(index: number) {
    setNewFotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function deleteFoto(fotoId: number) {
    await apidelete(`/fotos/${fotoId}/`).catch(() => {});
    setExistingFotos((prev) => prev.filter((f) => f.id !== fotoId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    const ano = numInt(form.ano);
    const preco = numInt(form.preco);

    if (ano < 1900 || ano > 1995) {
      setError("Ano inválido. Insira um valor entre 1900 e 1995.");
      return;
    }
    if (preco < 1) {
      setError("Valor inválido. O preço deve ser maior que zero.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const anuncio = await apipatch<ApiAnuncio>(`/anuncios/${id}/`, {
        nome_contato:  form.nome_contato,
        telefone:      form.telefone,
        email:         form.email,
        marca_nome:    form.marca_nome,
        modelo:        form.modelo,
        ano,
        preco,
        cor:           form.cor,
        quilometragem: form.quilometragem ? numInt(form.quilometragem) : null,
        combustivel:   form.combustivel,
        cambio:        form.cambio,
        placa_preta:   form.placa_preta,
        descricao:     form.descricao,
        tipo:          form.tipo,
      });

      for (let i = 0; i < newFotos.length; i++) {
        const fd = new FormData();
        fd.append("imagem", newFotos[i].file);
        fd.append("ordem", String(existingFotos.length + i));
        await apiupload(`/anuncios/${anuncio.id}/fotos/`, fd).catch(() => {});
      }

      navigate({ to: "/carro/$id", params: { id } });
    } catch (err) {
      let msg = "Erro ao salvar o anúncio.";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          msg = Object.entries(parsed)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join(" | ");
        } catch {
          msg = err.message.includes("Failed to fetch")
            ? "Servidor indisponível. Verifique se o backend está rodando."
            : err.message;
        }
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (pageLoading) {
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

  if (pageError || !form) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center p-10 text-center">
          <div>
            <h1 className="font-serif text-2xl font-bold">Anúncio não encontrado</h1>
            <Link to="/busca" className="mt-4 inline-block text-primary hover:underline">
              Voltar para a busca
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const totalFotos = existingFotos.length + newFotos.length;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">

        <section className="bg-secondary py-8 text-secondary-foreground">
          <div className="mx-auto max-w-3xl px-4">
            <Link
              to="/carro/$id"
              params={{ id }}
              className="text-sm opacity-80 hover:opacity-100"
            >
              ← Voltar ao anúncio
            </Link>
            <h1 className="mt-2 font-serif text-3xl font-bold">Editar anúncio</h1>
            <p className="mt-1 opacity-80 text-sm">#{id}</p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-10">
          <form onSubmit={handleSubmit} className="grid gap-8">

            {/* Contato */}
            <fieldset className="grid gap-4 rounded-md border border-border bg-card p-6">
              <legend className="px-1 font-serif text-lg font-bold">Dados de contato</legend>
              <Field label="Nome completo *">
                <input
                  required
                  className="input"
                  value={form.nome_contato}
                  onChange={(e) => setField("nome_contato", e.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Telefone / WhatsApp *">
                  <input
                    required
                    className="input"
                    value={form.telefone}
                    onChange={(e) => setField("telefone", e.target.value)}
                  />
                </Field>
                <Field label="E-mail *">
                  <input
                    required
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </Field>
              </div>
            </fieldset>

            {/* Veículo */}
            <fieldset className="grid gap-4 rounded-md border border-border bg-card p-6">
              <legend className="px-1 font-serif text-lg font-bold">Dados do veículo</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Marca *">
                  <input
                    required
                    className="input"
                    value={form.marca_nome}
                    onChange={(e) => setField("marca_nome", e.target.value)}
                  />
                </Field>
                <Field label="Modelo *">
                  <input
                    required
                    className="input"
                    value={form.modelo}
                    onChange={(e) => setField("modelo", e.target.value)}
                  />
                </Field>
                <Field label="Ano *">
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    className="input"
                    value={form.ano}
                    onChange={(e) => setField("ano", e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cor">
                  <input
                    className="input"
                    value={form.cor}
                    onChange={(e) => setField("cor", e.target.value)}
                  />
                </Field>
                <Field label="Quilometragem">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input"
                    value={form.quilometragem}
                    onChange={(e) => setField("quilometragem", e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Combustível">
                  <select
                    className="input"
                    value={form.combustivel}
                    onChange={(e) => setField("combustivel", e.target.value)}
                  >
                    <option value="">Não informado</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Álcool">Álcool</option>
                    <option value="Flex">Flex</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </Field>
                <Field label="Câmbio">
                  <select
                    className="input"
                    value={form.cambio}
                    onChange={(e) => setField("cambio", e.target.value)}
                  >
                    <option value="">Não informado</option>
                    <option value="Manual">Manual</option>
                    <option value="Automático">Automático</option>
                    <option value="CVT">CVT</option>
                  </select>
                </Field>
              </div>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.placa_preta}
                  onChange={(e) => setField("placa_preta", e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm font-medium">
                  Placa Preta — veículo de colecionador (mais de 30 anos, original)
                </span>
              </label>
            </fieldset>

            {/* Anúncio */}
            <fieldset className="grid gap-4 rounded-md border border-border bg-card p-6">
              <legend className="px-1 font-serif text-lg font-bold">Detalhes do anúncio</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo *">
                  <select
                    required
                    className="input"
                    value={form.tipo}
                    onChange={(e) => setField("tipo", e.target.value)}
                  >
                    <option value="venda">À venda</option>
                    <option value="aluguel">Para aluguel (por dia)</option>
                  </select>
                </Field>
                <Field label="Valor (R$) *">
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    className="input"
                    value={form.preco}
                    onChange={(e) => setField("preco", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Descrição *">
                <textarea
                  required
                  rows={5}
                  className="input resize-none"
                  value={form.descricao}
                  onChange={(e) => setField("descricao", e.target.value)}
                />
              </Field>
            </fieldset>

            {/* Fotos */}
            <fieldset className="grid gap-4 rounded-md border border-border bg-card p-6">
              <legend className="px-1 font-serif text-lg font-bold">
                Fotos ({totalFotos}/10)
              </legend>

              {existingFotos.length > 0 && (
                <div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Fotos salvas — clique no vermelho para remover
                  </p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {existingFotos.map((foto, i) => (
                      <div
                        key={foto.id}
                        className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
                      >
                        <img
                          src={foto.imagem_url ?? foto.imagem ?? ""}
                          alt={`Foto ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {i === 0 && (
                          <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                            Capa
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => foto.id != null && deleteFoto(foto.id)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white hover:bg-destructive/80"
                          title="Remover foto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalFotos < 10 && (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/40 py-6 hover:bg-muted/70 transition">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Adicionar fotos</span>
                  <span className="text-xs text-muted-foreground">
                    {10 - totalFotos} vaga{10 - totalFotos !== 1 ? "s" : ""} restante{10 - totalFotos !== 1 ? "s" : ""}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => addFotos(e.target.files)}
                  />
                </label>
              )}

              {newFotos.length > 0 && (
                <div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Novas fotos (serão salvas ao confirmar)
                  </p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {newFotos.map((f, i) => (
                      <div
                        key={i}
                        className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
                      >
                        <img
                          src={f.url}
                          alt={`Nova foto ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewFoto(i)}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </fieldset>

            {error && (
              <p className="rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
              <Link
                to="/carro/$id"
                params={{ id }}
                className="flex items-center rounded border border-input px-6 py-3 font-semibold hover:bg-muted"
              >
                Cancelar
              </Link>
            </div>

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
