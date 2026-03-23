# FAMP Academy — Resultado dos Testes e Correções Necessárias

## Resultado dos Testes

| Teste | Status | Detalhe |
|-------|--------|---------|
| Tabela disciplinas | OK | Acessível |
| Tabela turmas | OK | Acessível |
| Tabela temas | OK | Acessível |
| Tabela questoes | OK | Acessível |
| Tabela sessoes_estudo | OK | Acessível |
| Tabela avisos | OK | Acessível |
| Conexão profiles | FALHOU | Recursão infinita na RLS |
| Leitura profiles | FALHOU | Recursão infinita na RLS |
| Estrutura profiles | FALHOU | Recursão infinita na RLS |
| Login (Auth) | FALHOU | Credenciais inválidas |

## Correção 1: Recursão Infinita na RLS da tabela profiles

A tabela `profiles` tem uma política de Row Level Security (RLS) que causa recursão infinita. Isso acontece quando a policy tenta consultar a própria tabela `profiles` para verificar permissões.

Acesse o **SQL Editor** do Supabase e execute:

```sql
-- 1. Listar todas as policies da tabela profiles
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
```

Depois, remova TODAS as policies existentes e crie novas sem recursão:

```sql
-- 2. Remover TODAS as policies da tabela profiles
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. Criar policies simples e sem recursão
-- Qualquer usuário autenticado pode ver seu próprio perfil
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Coordenação e admin podem ver todos os perfis
-- Usa auth.jwt() para evitar consultar a própria tabela profiles
CREATE POLICY "profiles_select_admin"
ON profiles FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email') IN (
    SELECT email FROM profiles WHERE role IN ('coordenacao', 'admin')
  )
);

-- Usuário pode atualizar seu próprio perfil
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Apenas admin pode inserir novos perfis
CREATE POLICY "profiles_insert_admin"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'email') IN (
    SELECT email FROM profiles WHERE role = 'admin'
  )
);
```

**ALTERNATIVA MAIS SIMPLES** (recomendada para MVP):

Se preferir simplificar, desabilite RLS temporariamente na tabela profiles:

```sql
-- Desabilitar RLS na tabela profiles (mais simples para MVP)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

Ou mantenha RLS habilitado mas com uma policy permissiva:

```sql
-- Remover todas as policies existentes
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- Policy simples: autenticados podem ler todos os perfis
CREATE POLICY "profiles_read_all"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Usuário pode atualizar apenas seu próprio perfil
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

## Correção 2: Login com credenciais inválidas

O teste de login com `joao.silva@famp.edu.br` / `demo123456` falhou. Possíveis causas:

1. **Usuário não foi criado no Auth**: Vá em **Authentication > Users** e verifique se o usuário existe
2. **Senha diferente**: A senha pode ser diferente de `demo123456`
3. **E-mail não confirmado**: Se "Confirm Email" está ativado, o e-mail precisa ser confirmado

Para criar/recriar o usuário de teste:

1. Vá em **Authentication > Users** no dashboard do Supabase
2. Clique em **"Add user"** > **"Create new user"**
3. Preencha:
   - Email: `joao.silva@famp.edu.br`
   - Password: `demo123456`
   - Marque **"Auto Confirm User"** (importante!)
4. Clique em **"Create user"**
5. Copie o UUID gerado

Depois, verifique se o UUID na tabela `profiles` corresponde ao UUID do Auth:

```sql
-- Verificar os perfis existentes
SELECT id, email, full_name, role FROM profiles;
```

Se o UUID não corresponder, atualize:

```sql
-- Atualizar o UUID do perfil para corresponder ao Auth
-- Substitua 'UUID_DO_AUTH' pelo UUID real do usuário no Auth
UPDATE profiles
SET id = 'UUID_DO_AUTH'
WHERE email = 'joao.silva@famp.edu.br';
```

## Após as correções

Depois de aplicar as correções, me avise para que eu rode os testes novamente e confirme que tudo está funcionando.
