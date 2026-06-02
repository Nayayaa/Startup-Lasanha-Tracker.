export type Listing = {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  type: "venda" | "aluguel";
  city: string;
  state: string;
  km: number;
  image: string;
  description: string;
  seller: string;
};

export const brands: string[] = [];

export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}