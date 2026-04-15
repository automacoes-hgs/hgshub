-- ── Tabela de empresas ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_admin_all" ON public.companies
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- ── Tabela de metas por empresa ───────────────────────────────────────────────
-- tipo_receita: MRR (receita recorrente mensal) | MRU (receita única)
-- mes: número 1–12

CREATE TABLE IF NOT EXISTS public.company_goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Filtros / agrupadores
  unidade        TEXT,                             -- filial / unidade
  tipo_receita   TEXT CHECK (tipo_receita IN ('MRR', 'MRU')),
  ano            INTEGER NOT NULL,
  mes            INTEGER CHECK (mes BETWEEN 1 AND 12),
  categoria      TEXT,                             -- produto / categoria de venda

  -- Valores financeiros
  valor_meta     NUMERIC(15, 2) NOT NULL DEFAULT 0,
  resultado      NUMERIC(15, 2) NOT NULL DEFAULT 0,

  -- Opcionais
  meta_clientes  INTEGER,                          -- quantidade de clientes alvo
  ticket_medio   NUMERIC(15, 2),                   -- ticket médio esperado
  observacoes    TEXT,

  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.company_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_goals_admin_all" ON public.company_goals
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- ── Trigger updated_at automático ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS companies_updated_at ON public.companies;
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS company_goals_updated_at ON public.company_goals;
CREATE TRIGGER company_goals_updated_at
  BEFORE UPDATE ON public.company_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
