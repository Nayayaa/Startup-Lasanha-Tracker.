import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { apipost } from "@/routes/api";
import { saveAuth, type AuthUser } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [aba, setAba] = useState<"entrar" | "cadastrar">("entrar");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card shadow-sm">
            {/* Abas */}
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => setAba("entrar")}
                className={`flex-1 py-3 text-sm font-semibold transition ${
                  aba === "entrar"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setAba("cadastrar")}
                className={`flex-1 py-3 text-sm font-semibold transition ${
                  aba === "cadastrar"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Criar conta
              </button>
            </div>

            <div className="p-6">
              {aba === "entrar" ? <FormLogin /> : <FormCadastro onCadastrado={() => setAba("entrar")} />}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function FormLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const data = await apipost<{ access: string; refresh: string }>(
        "/token/",
        { username, password }
      );
      const me = await fetch(
        `${import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api"}/users/me/`,
        { headers: { Authorization: `Bearer ${data.access}` } }
      );
      const user: AuthUser = await me.json();
      saveAuth(data.access, user);
      navigate({ to: "/" });
    } catch {
      setErro("Usuário ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-serif text-2xl font-bold">Bem-vindo de volta</h2>

      <div>
        <label className="mb-1 block text-sm font-medium">Usuário</label>
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Senha</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

function FormCadastro({ onCadastrado }: { onCadastrado: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await apipost("/users/", { username, email, password });
      onCadastrado();
    } catch (err: unknown) {
      try {
        const msg = JSON.parse((err as Error).message);
        const primeiro = Object.values(msg)[0];
        setErro(Array.isArray(primeiro) ? primeiro[0] : String(primeiro));
      } catch {
        setErro("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-serif text-2xl font-bold">Criar conta</h2>

      <div>
        <label className="mb-1 block text-sm font-medium">Usuário</label>
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Senha</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? "Criando conta..." : "Criar conta"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Já tem conta?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Entre aqui
        </Link>
      </p>
    </form>
  );
}
