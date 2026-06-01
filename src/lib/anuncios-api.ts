import { type Listing } from "@/data/cars";

export type ApiFoto = {
  id: number;
  imagem?: string | null;
  imagem_url?: string | null;
  ordem?: number | null;
};

export type ApiAnuncio = {
  id: number;
  titulo: string;
  descricao?: string | null;
  preco: number | string;
  ano: number;
  modelo: string;
  marca_nome?: string | null;
  categoria_nome?: string | null;
  portal_nome?: string | null;
  fotos?: ApiFoto[] | null;
  quilometragem?: number | null;
  cor?: string | null;
  combustivel?: string | null;
  cambio?: string | null;
  placa_preta?: boolean | null;
  anunciante?: string | number | null;
  status?: string | null;
  dados_externos?: Record<string, string> | null;
};

export function mapAnuncioToListing(anuncio: ApiAnuncio): Listing {
  const foto = (anuncio.fotos ?? [])[0];
  const image = foto?.imagem_url ?? foto?.imagem ?? "";
  const price = typeof anuncio.preco === "string" ? Number(anuncio.preco) : anuncio.preco;

  return {
    id: String(anuncio.id),
    title: anuncio.titulo,
    brand: anuncio.marca_nome ?? "",
    model: anuncio.modelo,
    year: anuncio.ano,
    price: Number.isFinite(price) ? price : 0,
    type: "venda",
    city: "",
    state: "",
    km: anuncio.quilometragem ?? 0,
    image,
    description: anuncio.descricao ?? "",
    seller: anuncio.anunciante ? String(anuncio.anunciante) : "Anunciante",
  };
}
