import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { brands } from "@/data/cars";

export function SearchBar({
  initialQ = "",
  initialBrand = "",
  initialType = "",
}: {
  initialQ?: string;
  initialBrand?: string;
  initialType?: string;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQ);
  const [brand, setBrand] = useState(initialBrand);
  const [type, setType] = useState(initialType);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/busca", search: { q: q || undefined, brand: brand || undefined, type: type || undefined } as any });
      }}
      className="grid grid-cols-1 gap-3 rounded-md border border-border bg-card p-4 shadow-md md:grid-cols-[1fr_180px_160px_auto]"
    >
      <div className="flex items-center gap-2 rounded border border-input bg-background px-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ex: Fusca, Opala, Maverick..."
          className="w-full bg-transparent py-3 text-base text-foreground outline-none"
        />
      </div>
      <select
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        className="rounded border border-input bg-background px-3 py-3 text-base text-foreground outline-none"
      >
        <option value="">Todas as marcas</option>
        {brands.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="rounded border border-input bg-background px-3 py-3 text-base text-foreground outline-none"
      >
        <option value="">Comprar ou alugar</option>
        <option value="venda">Comprar</option>
        <option value="aluguel">Alugar</option>
      </select>
      <button
        type="submit"
        className="rounded bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        Buscar
      </button>
    </form>
  );
}