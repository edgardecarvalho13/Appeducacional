# FAMP Academy — Guia de Configuração do Supabase

Este guia detalha como configurar o Supabase, executar o schema SQL do FAMP Academy e integrar a autenticação real com o frontend.

---

## Parte 1: Criar Projeto no Supabase

### Passo 1.1: Acessar Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em **"Sign In"** (ou crie uma conta se for a primeira vez)
3. Faça login com sua conta Google, GitHub ou e-mail

### Passo 1.2: Criar um Novo Projeto

1. No dashboard, clique em **"New Project"** (ou **"Create a new project"**)
2. Preencha os dados:
   - **Name**: `famp-academy` (ou qualquer nome)
   - **Database Password**: Crie uma senha forte (guarde bem!)
   - **Region**: Escolha a região mais próxima (ex: `South America - São Paulo` para Brasil)
   - **Pricing Plan**: Escolha **"Free"** para começar

3. Clique em **"Create new project"**
4. Aguarde 2-3 minutos enquanto o Supabase provisiona o banco de dados

### Passo 1.3: Copiar as Credenciais

Após o projeto ser criado:

1. Vá para **Settings** → **API** (no menu esquerdo)
2. Copie e guarde em um lugar seguro:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (chave pública)
   - **service_role secret**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (chave privada — NUNCA compartilhe!)

Você usará essas credenciais para conectar o frontend ao Supabase.

---

## Parte 2: Executar o Schema SQL

### Passo 2.1: Acessar o SQL Editor

1. No dashboard do Supabase, clique em **"SQL Editor"** (no menu esquerdo)
2. Clique em **"New Query"**

### Passo 2.2: Copiar e Executar o Schema

1. Abra o arquivo `database-schema.sql` do FAMP Academy (localizado em `/home/ubuntu/famp-academy/database-schema.sql`)
2. Copie TODO o conteúdo do arquivo
3. Cole no editor SQL do Supabase
4. Clique em **"Run"** (botão azul no canto inferior direito)

**Aguarde a execução completar.** Você verá mensagens de sucesso para cada tabela criada.

### Passo 2.3: Verificar as Tabelas

1. Vá para **"Table Editor"** (no menu esquerdo)
2. Você deve ver as seguintes tabelas:
   - `profiles`
   - `disciplinas`
   - `turmas`
   - `turma_alunos`
   - `temas`
   - `questoes`
   - `alternativas`
   - `respostas`
   - `caderno_erros`
   - `sessoes_estudo`
   - `conteudos`
   - `progresso_conteudo`
   - `avisos`
   - `avisos_lidos`
   - `tutor_conversas`
   - `tutor_mensagens`
   - `analytics_eventos`
   - `flashcards`
   - `badges`
   - `aluno_badges`

Se todas estiverem presentes, o schema foi executado com sucesso!

---

## Parte 3: Configurar Autenticação no Supabase

### Passo 3.1: Habilitar E-mail/Senha

1. Vá para **"Authentication"** → **"Providers"** (no menu esquerdo)
2. Procure por **"Email"** e certifique-se de que está **"Enabled"**
3. Clique em **"Email"** para expandir as opções
4. Verifique se as opções estão assim:
   - **Enable Email Signup**: ✓ (ativado)
   - **Enable Email Confirmations**: ✓ (ativado)
   - **Confirm Email**: Escolha **"Double confirm change"** para segurança

### Passo 3.2: Configurar URLs de Redirecionamento

1. Em **"Authentication"** → **"URL Configuration"**
2. Em **"Redirect URLs"**, adicione:
   - `http://localhost:3000/dashboard` (para desenvolvimento local)
   - `https://seu-dominio.vercel.app/dashboard` (para produção — adicione depois)
3. Clique em **"Save"**

### Passo 3.3: Criar Usuários de Teste

1. Vá para **"Authentication"** → **"Users"**
2. Clique em **"Add user"** e crie os usuários demo:

| E-mail | Senha | Período |
|--------|-------|---------|
| joao.silva@famp.edu.br | demo123456 | 5 |
| maria.santos@famp.edu.br | demo123456 | - |
| coord@famp.edu.br | demo123456 | - |
| admin@famp.edu.br | demo123456 | - |

3. Após criar cada usuário, você verá um UUID gerado automaticamente. **Guarde esses UUIDs!**

### Passo 3.4: Inserir Perfis dos Usuários

Agora você precisa inserir os perfis correspondentes na tabela `profiles`:

1. Volte para **"SQL Editor"**
2. Clique em **"New Query"**
3. Cole o seguinte SQL (substitua os UUIDs pelos que você copiou acima):

```sql
INSERT INTO profiles (id, email, full_name, role, periodo, matricula, is_active)
VALUES
  ('UUID_JOAO_AQUI', 'joao.silva@famp.edu.br', 'João Pedro Silva', 'aluno', 5, '2023001', true),
  ('UUID_MARIA_AQUI', 'maria.santos@famp.edu.br', 'Dra. Maria Santos', 'professor', NULL, NULL, true),
  ('UUID_COORD_AQUI', 'coord@famp.edu.br', 'Dr. Carlos Oliveira', 'coordenacao', NULL, NULL, true),
  ('UUID_ADMIN_AQUI', 'admin@famp.edu.br', 'Admin Sistema', 'admin', NULL, NULL, true);
```

4. Clique em **"Run"**

Exemplo com UUIDs reais:
```sql
INSERT INTO profiles (id, email, full_name, role, periodo, matricula, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'joao.silva@famp.edu.br', 'João Pedro Silva', 'aluno', 5, '2023001', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'maria.santos@famp.edu.br', 'Dra. Maria Santos', 'professor', NULL, NULL, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'coord@famp.edu.br', 'Dr. Carlos Oliveira', 'coordenacao', NULL, NULL, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'admin@famp.edu.br', 'Admin Sistema', 'admin', NULL, NULL, true);
```

---

## Parte 4: Integrar Supabase com o Frontend

### Passo 4.1: Instalar a SDK do Supabase

No terminal, dentro da pasta do projeto:

```bash
cd /home/ubuntu/famp-academy
npm install @supabase/supabase-js
```

### Passo 4.2: Criar Arquivo de Configuração

Crie o arquivo `client/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not configured. Using mock data.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Passo 4.3: Configurar Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Substitua pelos valores reais que você copiou no Passo 1.3.

### Passo 4.4: Atualizar o AuthContext

Abra `client/src/contexts/AuthContext.tsx` e substitua a função `login` para usar Supabase:

```typescript
const login = useCallback(async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Buscar o perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        return { success: false, error: 'Perfil não encontrado' };
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setState({ user: profile, isLoading: false, isAuthenticated: true });
      return { success: true };
    }

    return { success: false, error: 'Erro desconhecido' };
  } catch (err) {
    return { success: false, error: 'Erro ao conectar com o servidor' };
  }
}, []);
```

### Passo 4.5: Reiniciar o Servidor

```bash
npm run dev
```

Agora o FAMP Academy está conectado ao Supabase real!

---

## Parte 5: Testar a Integração

1. Acesse `http://localhost:3000/login`
2. Faça login com uma das contas que você criou:
   - E-mail: `joao.silva@famp.edu.br`
   - Senha: `demo123456`
3. Você deve ser redirecionado para o Dashboard
4. Verifique se os dados do perfil (nome, período, role) aparecem corretamente

---

## Troubleshooting

### Erro: "Invalid credentials"
- Verifique se o e-mail e senha estão corretos
- Certifique-se de que o usuário foi criado em **Authentication → Users**

### Erro: "Profile not found"
- Verifique se você inseriu os dados em `profiles` usando o UUID correto
- Confirme que o UUID do usuário em `auth.users` corresponde ao UUID em `profiles`

### Erro: "CORS error"
- Verifique se a URL do seu frontend está adicionada em **Authentication → URL Configuration**

### Erro: "Connection refused"
- Verifique se o `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretos no `.env.local`
- Reinicie o servidor com `npm run dev`

---

## Próximos Passos

Após a integração estar funcionando:

1. **Substituir dados mock**: Remova os dados mockados de `mock-data.ts` e busque dados reais do Supabase
2. **Implementar FAMP Quest**: Desenvolva o motor de questões com queries ao banco de dados
3. **Configurar Google Calendar API**: Para sincronização do FAMP Planner
4. **Integrar LLM API**: Para o FAMP Tutor IA (OpenAI/Anthropic)

---

## Referências

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
