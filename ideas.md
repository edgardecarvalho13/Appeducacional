# FAMP Academy — Brainstorm de Design

## Contexto
Plataforma institucional de educação médica (LMS) para a Faculdade Morgana Potrich. Paleta definida: Navy Blue `#0D1B2A` (fundo dark) e Teal `#20B2AA` (detalhes/acentos). Público: alunos de medicina, professores e coordenação.

---

<response>
## Ideia 1: "Clinical Precision" — Neo-Brutalismo Médico Refinado

<probability>0.07</probability>

<text>

### Design Movement
Neo-Brutalismo suavizado com influências de interfaces médicas de alta precisão (como monitores de UTI e dashboards de diagnóstico por imagem).

### Core Principles
1. **Contraste Cirúrgico** — Hierarquia visual extremamente clara, como um prontuário bem organizado
2. **Dados como Protagonistas** — Números, gráficos e métricas são o centro visual, não decoração
3. **Bordas Definidas** — Elementos com bordas visíveis e sólidas, sem blur ou sombras difusas
4. **Monocromático com Pulso** — Base navy quase total, com teal aparecendo como "pulso vital" nos dados ativos

### Color Philosophy
Navy `#0D1B2A` como fundo absoluto. Teal `#20B2AA` usado exclusivamente para dados ativos, progresso e CTAs. Cinza `#1B2838` para cards. Branco `#E8EAED` para texto principal. Vermelho `#FF6B6B` para alertas/erros.

### Layout Paradigm
Grid rígido de 12 colunas com sidebar fixa à esquerda (60px colapsada, 240px expandida). Conteúdo principal em blocos retangulares com bordas de 1px. Sem cantos arredondados — tudo é angular e preciso.

### Signature Elements
- Linha de "heartbeat" animada no header como indicador de atividade
- Cards com borda esquerda colorida indicando status (teal=ativo, cinza=inativo)
- Tipografia monospace para dados numéricos

### Interaction Philosophy
Transições instantâneas (< 100ms). Hover revela borda teal. Clique produz flash sutil. Sem animações decorativas.

### Animation
Mínima. Barras de progresso com fill linear. Números que contam (count-up). Sidebar com slide instantâneo.

### Typography System
- Display: Space Grotesk Bold (títulos)
- Body: IBM Plex Sans Regular (texto)
- Data: IBM Plex Mono (números e métricas)

</text>
</response>

---

<response>
## Ideia 2: "Anatomia Digital" — Glassmorphism Orgânico com Profundidade

<probability>0.05</probability>

<text>

### Design Movement
Glassmorphism evoluído com camadas de profundidade inspiradas em atlas de anatomia digital e interfaces de microscopia.

### Core Principles
1. **Camadas de Profundidade** — Interface construída em 3 planos visuais (fundo, meio, frente) como lâminas de microscópio
2. **Transparência Funcional** — Glass effects que revelam hierarquia, não apenas decoração
3. **Organicidade Controlada** — Formas levemente orgânicas em contraste com a rigidez dos dados
4. **Luminescência Teal** — O teal brilha como bioluminescência, guiando o olhar

### Color Philosophy
Navy `#0D1B2A` como fundo profundo. Gradiente sutil navy-to-darker nos planos. Teal `#20B2AA` com glow (box-shadow) para elementos interativos. Cards em `rgba(255,255,255,0.05)` com backdrop-blur. Acentos em `#14F0D5` (teal claro) para hover states.

### Layout Paradigm
Sidebar flutuante com glass effect à esquerda. Conteúdo principal em cards com backdrop-blur empilhados em Z-index. Header transparente que se solidifica no scroll. Espaçamento generoso (32px entre blocos).

### Signature Elements
- Orbs de gradiente teal/navy flutuando no background (sutis, low-opacity)
- Cards com borda de 1px gradiente (teal → transparente)
- Ícones com glow teal no hover

### Interaction Philosophy
Hover eleva o card (translateY + shadow increase). Transições suaves de 300ms ease-out. Elementos surgem com fade-in + slide-up ao entrar no viewport.

### Animation
Orbs no background com movimento lento (60s loop). Cards com entrance animation staggered. Progress bars com shimmer effect. Sidebar items com slide-in sequencial.

### Typography System
- Display: Plus Jakarta Sans Bold (títulos — geométrica mas humana)
- Body: Plus Jakarta Sans Regular (texto corrido)
- Accent: Plus Jakarta Sans Medium (labels e badges)

</text>
</response>

---

<response>
## Ideia 3: "Command Center" — Dashboard Operacional Militar-Médico

<probability>0.08</probability>

<text>

### Design Movement
Inspirado em centros de comando militar e painéis de controle de missão (NASA/SpaceX), adaptado para contexto médico-acadêmico. Estética "dark ops" com eficiência informacional máxima.

### Core Principles
1. **Densidade Informacional Elegante** — Máximo de dados úteis por pixel, sem parecer cluttered
2. **Status Always-On** — Tudo tem um indicador de estado visual (ativo, pendente, concluído, alerta)
3. **Hierarquia por Luminosidade** — Elementos mais importantes são mais brilhantes
4. **Grid Modular** — Widgets reposicionáveis mentalmente, cada um autossuficiente

### Color Philosophy
Navy `#0D1B2A` base. Teal `#20B2AA` para status ativo e progresso. `#0F2942` para cards (navy levemente mais claro). `#64FFDA` (mint) para highlights de alta prioridade. `#FF8A65` (coral) para alertas. `#A0AEC0` para texto secundário. Branco `#F7FAFC` para texto primário.

### Layout Paradigm
Sidebar compacta (56px ícones, expansível a 220px) com ícones e tooltips. Área principal dividida em grid de widgets (2-3 colunas). Header fino com breadcrumb, busca e notificações. Footer com status bar mostrando conexão e última sincronização.

### Signature Elements
- Status bar inferior estilo terminal (última sync, conexão, versão)
- Mini-gráficos sparkline inline nos cards de métricas
- Dot indicators (verde/amarelo/vermelho) para status de módulos

### Interaction Philosophy
Hover revela tooltip com dados extras. Click expande widget para full-view. Transições de 200ms com easing preciso. Keyboard shortcuts visíveis.

### Animation
Números com count-up animation. Gráficos com draw-in progressivo. Cards com fade-in staggered (50ms delay entre cada). Sidebar com micro-bounce nos ícones ativos. Loading states com skeleton pulse.

### Typography System
- Display: Inter Tight Bold (títulos — compacta e moderna)
- Body: Inter Regular (texto — máxima legibilidade)
- Data: JetBrains Mono (números, códigos, métricas)

</text>
</response>
