# Padrao Tecnico de Telas Administrativas

Este documento define, de forma prescritiva, como novas telas administrativas do frontend novo devem ser implementadas.
O modulo de referencia atual e `Controle de Acesso`, seguido por `Permissoes` e `Logs`.

O objetivo nao e apenas manter consistencia visual. O objetivo e garantir:

- mesma arquitetura de estado
- mesma distribuicao de responsabilidade entre `page.tsx` e `components/`
- mesma forma de gating por permissao e tela
- mesma ergonomia de tabela, filtros, modais, estados vazios e erros
- mesmo contrato de texto, copy e traducao
- mesma semantica responsiva

Se houver conflito entre este documento e uma implementacao antiga, a implementacao antiga deve ser corrigida para seguir este padrao.

---

## 1. Escopo do Padrao

Este documento vale para modulos administrativos com uma ou mais dessas caracteristicas:

- CRUD
- listagem com busca
- tabelas com acoes por linha
- formularios em modal
- modais de detalhes
- tabs administrativas
- filtros
- relatorios
- historicos

Exemplos de referencia no projeto:

- `src/app/(dashboard)/access-control/page.tsx`
- `src/app/(dashboard)/access-control/components/*`
- `src/app/(dashboard)/logs/page.tsx`
- `src/app/(dashboard)/permissions/page.tsx`

---

## 2. Arquitetura Obrigatoria

### 2.1 Estrutura de diretorios

Todo modulo administrativo novo deve seguir a estrutura abaixo:

```text
src/
├── app/(dashboard)/[modulo]/
│   ├── components/
│   │   ├── [tab-ou-recurso]-tab.tsx
│   │   ├── [recurso]-form-dialog.tsx
│   │   ├── [recurso]-details-dialog.tsx
│   │   ├── stat-cards.tsx
│   │   ├── table-pagination-footer.tsx
│   │   ├── table-loading-overlay.tsx
│   │   ├── status-badges.tsx
│   │   ├── utils.ts
│   │   └── componentes auxiliares especificos
│   └── page.tsx
├── services/[modulo].service.ts
└── types/[modulo].ts
```

### 2.2 Ownership de estado

Separacao obrigatoria:

- `page.tsx`
  - ownership de contexto global da tela
  - carregamento compartilhado entre tabs
  - orquestracao de dados comuns
  - composicao estrutural da pagina
- `components/[tab]-tab.tsx`
  - ownership da listagem da propria aba
  - filtro local
  - paginacao local
  - modais da propria aba
  - mutacoes da propria aba
- `services/[modulo].service.ts`
  - toda comunicacao HTTP do modulo
- `types/[modulo].ts`
  - contrato de tipos do transporte

Nao centralizar tudo em `page.tsx`.
Nao criar componentes de tab que dependem de estado implcito do pai para operacoes basicas de CRUD, exceto quando o dado e realmente compartilhado entre tabs, como a lista global de usuarios.

### 2.3 Cobertura real da analise

Este documento foi revisado com base nas telas reais hoje migradas e operacionais no frontend novo, especialmente:

- `Users`
- `Permissions`
- `Access Control`
- `Logs`
- `Backup`
- `UI Settings`
- `Account Settings`
- shell principal do dashboard, incluindo `AppSidebar`, `CommandSearch` e `NavUser`

Tambem foram observados os componentes globais que afetam todas as telas:

- `src/lib/i18n/*`
- `src/lib/navigation.ts`
- `src/lib/notifications/*`
- `src/components/ui/tabs.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/shared/*`

Paginas de demo ou modulos ainda nao migrados completamente, como `Mail`, `Chat`, `Calendar`, `Tasks`, `FAQs` e `Pricing`, nao redefinem este padrao.
Quando houver divergencia entre essas telas e os modulos migrados, o padrao continua sendo o dos modulos migrados.

---

## 3. Tokens Globais de Layout e Borda

### 3.1 Principio obrigatorio

No frontend novo, a casca visual do sistema e centralizada.
Isso significa que raio, cores-base, sombras, superficie, estados e parte da semantica estrutural nao devem ser decididos localmente em cada modulo.

O modulo consome o design system.
O modulo nao redefine o design system.

### 3.2 Fonte de verdade dos tokens

Os tokens globais estao centralizados principalmente em:

- `src/app/globals.css`
- `src/hooks/use-theme-manager.ts`
- `src/components/theme-customizer/*`
- `src/components/ui/*`

Pontos tecnicos relevantes:

- `--radius` e a fonte primaria de raio global
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` derivam de `--radius`
- `--background`, `--card`, `--popover`, `--border`, `--input`, `--ring` e correlatos definem a casca visual global
- `useThemeManager().applyRadius(radius)` altera `--radius` em runtime
- o painel de tema/customizacao consegue propagar mudancas globais sem editar modulo a modulo

### 3.3 Consequencia pratica

Se um modulo usar:

- `rounded-[14px]`
- `border-gray-200`
- `bg-white`
- `shadow-[...]`
- `max-w-[...]` arbitrario para imitar container do sistema

ele esta quebrando a customizacao centralizada.

### 3.4 Regra de implementacao

A regra e esta:

1. primeiro usar componentes `ui/*`
2. se nao houver componente pronto, usar classes semanticas do sistema
3. nunca usar valores arbitrarios para substituir token global sem necessidade real

### 3.5 Camadas semanticas de raio aprovadas

O sistema hoje usa quatro niveis semanticos principais de borda, todos derivados dos tokens globais:

- `rounded-md`
  - controles e superficies compactas
  - exemplos: `Input`, `Button`, `SelectTrigger`, `DropdownMenuContent`, wrappers de tabela simples
- `rounded-lg`
  - modais, tabs list, cards de estado vazio, switches em bloco, superficies operacionais intermediarias
- `rounded-xl`
  - `Card`, blocos de resumo visuais, mapas, paineis de destaque, pre/code blocks densos
- `rounded-sm`
  - itens internos menores, como `SelectItem`, elementos de menu e micro-superficies

Regra:

- nao escolher o raio pela preferencia visual do autor
- escolher o raio pela categoria semantica da superficie

### 3.6 Matriz de uso por componente

Use esta matriz como contrato:

#### Controles de formulario

- `Button`
  - usar o componente base
  - raio herdado do `buttonVariants`
  - nao adicionar `rounded-*` localmente, exceto excecao extremamente justificada
- `Input`
  - usar o componente base
  - raio herdado do `Input`
- `Textarea`
  - usar o componente base
- `SelectTrigger`
  - usar o componente base
  - preferir `w-full` e `cursor-pointer`
  - nao sobrescrever raio

Exemplo correto:

```tsx
<SelectTrigger className="w-full cursor-pointer" />
```

Exemplo incorreto:

```tsx
<SelectTrigger className="w-full rounded-[14px] border-zinc-200" />
```

#### Superficies de dados

- tabela/listagem simples
  - `rounded-md border bg-card`
- card de KPI
  - usar `Card`
- estado vazio/importante
  - `rounded-lg border-2 border-dashed bg-muted/30`
- mapa ou painel denso
  - `rounded-2xl` so quando a composicao exigir bloco de destaque maior e ja houver precedente no sistema
  - preferencialmente limitado a mapas, historicos ricos e paineis visuais especiais

#### Overlays e containers flutuantes

- `DialogContent`
  - usar componente base
  - o raio base vem do proprio `DialogContent`
- `DropdownMenuContent`
  - usar componente base
- `PopoverContent`
  - usar componente base

### 3.7 Regra para wrappers customizados

Quando for inevitavel criar uma superficie customizada, usar apenas combinacoes aprovadas.

Combos aprovados:

```tsx
className="rounded-md border bg-card"
className="rounded-lg border bg-muted/30"
className="rounded-xl border bg-muted/20 p-4"
className="rounded-lg border-2 border-dashed bg-muted/30"
```

Combos proibidos por default:

```tsx
className="rounded-[12px] border-[#E5E7EB] bg-white"
className="rounded-[18px] shadow-[0_10px_30px_rgba(...)]"
className="rounded-3xl"
className="border-gray-300"
className="bg-zinc-50"
```

### 3.8 Regra para layout macro

O layout de pagina tambem e centralizado.

Toda pagina administrativa deve usar o container estrutural padrao:

```tsx
<div className="flex flex-col gap-4">
  <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
    ...
  </div>
</div>
```

Regras:

- nao criar wrappers paralelos para espacamento global
- nao trocar `px-4 lg:px-6` por paddings arbitrarios locais
- nao centralizar a pagina via `max-w-* mx-auto` sem o sistema pedir isso explicitamente
- a largura de conteudo deve permanecer governada pelo layout do dashboard e futuras configuracoes globais de `contentWidth`

### 3.9 Regra para futuras configuracoes globais

O sistema ja expoe e/ou prepara configuracoes globais como:

- tema
- radius
- `sidebarWidth`

### 3.10 Tags semanticas de dados

Tags exibidas em listas, tabelas, modais de detalhes, resumos operacionais e blocos de metadata devem seguir um contrato unico.

Este contrato existe para centralizar:

- cor
- espacamento
- altura
- peso tipografico
- semantica de tom
- modo escuro

#### Fonte de verdade

Para tags semanticas de dados, a fonte de verdade e:

- `src/components/shared/data-tag.tsx`

`Badge` continua existindo no sistema, mas passa a ter dois papeis distintos:

- `Badge`
  - uso decorativo, editorial ou promocional
  - exemplos: landing, hero, selo visual, contador de item em UI generica
- `DataTag`
  - uso semantico e operacional
  - exemplos: status, origem, metodo HTTP, codigo HTTP, grupo, situacao, tipo de acao

Regra:

- em telas administrativas e operacionais, nao usar `Badge` crua para representar estado de dominio
- usar `DataTag`

#### Contrato visual obrigatorio

`DataTag` deve manter este contrato base:

- altura fixa de `h-6`
- `rounded-md`
- `px-2.5`
- `py-0`
- `text-[11px]`
- `font-medium`
- `leading-none`
- sem borda visual contextual local

Motivacao:

- evitar tags altas demais dentro de celulas de tabela
- evitar variacao arbitraria de padding entre modulos
- manter leitura rapida em linhas densas

#### Tons semanticos aprovados

Os tons aprovados para `DataTag` sao:

- `neutral`
  - categorias neutras, fallback, estado desconhecido, grupo textual
- `success`
  - sucesso, ativo, concluido, permitido, valido
- `info`
  - origem web, POST, estados informativos
- `warning`
  - atencao, bloqueio, pendencia, falha 4xx, processo em andamento
- `danger`
  - erro, falha, 5xx, exclusao destrutiva quando exibida como estado
- `accent`
  - categoria secundaria relevante sem conotacao de erro, como `PATCH` ou `Agendado`

Nao inventar novas combinacoes locais de `bg-* text-*`.
Se um novo tom for realmente necessario, ele deve ser adicionado ao contrato central do `DataTag`.

#### Ownership de texto e cor

A implementacao correta tem duas camadas:

1. `DataTag`
   - controla casca, espacamento e palette base
2. `status-badges.tsx` ou arquivo equivalente do modulo
   - controla o mapa de dominio `valor -> { label, tone }`

Isso significa:

- o modulo nao decide `className` de cor diretamente na tabela
- o modulo declara um mapa de configuracao semantica
- texto e tom ficam configuraveis no mesmo lugar

Exemplo correto:

```tsx
const methodTagMap = {
  get: { label: "GET", tone: "success" },
  post: { label: "POST", tone: "info" },
  put: { label: "PUT", tone: "warning" },
  patch: { label: "PATCH", tone: "accent" },
  delete: { label: "DELETE", tone: "danger" },
} as const

const tag = resolveDataTagDefinition(method, methodTagMap, {
  label: String(method || "-").toUpperCase(),
  tone: "neutral",
})

return <DataTag tone={tag.tone}>{tag.label}</DataTag>
```

Exemplo incorreto:

```tsx
<Badge
  variant="secondary"
  className={method === "GET" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}
>
  {method}
</Badge>
```

#### Regra para valores numericos

Tags com conteudo numerico ou semi-numerico devem usar `monospace` quando a leitura se beneficia de alinhamento tabular.

Exemplos:

- codigo HTTP
- numeros curtos de versao
- contadores compactos

Exemplo:

```tsx
<DataTag tone="warning" monospace>
  404
</DataTag>
```

#### Regra de uso em lista e modal

Se uma tag existe na tabela e reaparece no modal de detalhes para o mesmo atributo, a tag deve ser exatamente a mesma implementacao.

Exemplo correto:

- `LogLevelBadge` usado na listagem e no modal de detalhes
- `OriginBadge` usado na listagem e no modal de detalhes

Nao duplicar uma variante textual na tabela e uma `Badge` diferente no modal.
- `contentWidth`

Logo, qualquer modulo novo deve ser escrito de forma compativel com estas mudancas.

Isso implica:

- evitar largura fixa desnecessaria
- evitar raio arbitrario
- evitar cores hardcoded
- preferir `bg-card`, `bg-muted`, `border`, `text-muted-foreground`, `focus-visible:ring-*`

### 3.11 Grupos expansíveis com seleção em massa

Alguns modulos administrativos precisam agrupar entidades em blocos expansíveis com:

- acao de expandir/recolher
- checkbox de selecao em massa do grupo
- contador `selecionados de total`
- lista interna de itens com checkbox por linha

Exemplos reais no sistema:

- `Permissoes > Atribuicao (API)`
- `Permissoes > Telas (Frontend)`

#### Contrato estrutural obrigatorio

O header do grupo deve ser dividido em duas areas irmas:

1. controle de selecao do grupo
2. area expansivel clicavel

Regra obrigatoria:

- o checkbox do grupo nunca pode ficar dentro de `AccordionTrigger`
- `AccordionTrigger` do Radix renderiza `button`
- `Checkbox` do sistema tambem renderiza `button`
- portanto, `Checkbox` dentro de `AccordionTrigger` gera HTML invalido e hydration warning

Anti-padrao proibido:

```tsx
<AccordionTrigger>
  <Checkbox />
  <span>Grupo</span>
</AccordionTrigger>
```

Isto e proibido porque produz `button` dentro de `button`.

#### Comportamento exigido

O header inteiro do grupo deve continuar clicavel para expandir ou recolher.

Isso significa:

- o usuario pode clicar em qualquer ponto horizontal da linha
- o checkbox continua tendo comportamento proprio de selecionar/desselecionar o grupo
- clicar no checkbox nao deve disparar a abertura do accordion por propagacao acidental

#### Padrao tecnico aprovado

Quando houver checkbox de grupo no header, o accordion deve ser controlado localmente e o header visual deve ser um container clicavel proprio do modulo.

Padrao recomendado:

- `Accordion` controlado via `value` e `onValueChange`
- `div` do header com `role="button"` e `tabIndex={0}`
- toggle manual por `onClick`
- suporte de teclado com `Enter` e `Space`
- checkbox como sibling dentro do mesmo header, com `stopPropagation`
- icone de chevron controlado manualmente a partir do estado `isOpen`

Exemplo aprovado:

```tsx
const [isOpen, setIsOpen] = useState(false)

<Accordion
  type="single"
  collapsible
  value={isOpen ? groupName : undefined}
  onValueChange={(value) => setIsOpen(value === groupName)}
>
  <AccordionItem value={groupName}>
    <div
      role="button"
      tabIndex={0}
      onClick={() => setIsOpen((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          setIsOpen((current) => !current)
        }
      }}
      className="flex cursor-pointer items-center gap-4 px-4 py-3"
    >
      <div onClick={(event) => event.stopPropagation()}>
        <Checkbox ... />
      </div>

      <div className="flex flex-1 items-center gap-2">
        <span>Grupo</span>
      </div>

      <div className="text-xs text-muted-foreground">2 de 3</div>
      <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
    </div>

    <AccordionContent>...</AccordionContent>
  </AccordionItem>
</Accordion>
```

#### Regra de acessibilidade

Se o header inteiro for clicavel fora de `AccordionTrigger`, ele deve obrigatoriamente ter:

- `role="button"`
- `tabIndex={0}`
- suporte de teclado para `Enter`
- suporte de teclado para `Space`

Nao implementar um `div` clicavel sem semantica.

#### Regra de layout visual

O header do grupo deve seguir esta composicao:

- `px-4 py-3`
- `flex items-center gap-4`
- hover unico em toda a linha com `hover:bg-muted/50`
- contador do grupo no extremo direito, antes do chevron
- chevron no extremo direito com `transition-transform duration-200`

O bloco expandido deve manter:

- `border-t`
- `bg-muted/20`
- `px-4 pb-4 pt-2`

#### Quando usar `AccordionTrigger` diretamente

Se o header nao possui outro controle interativo interno, o componente deve continuar usando `AccordionTrigger` normalmente.

Ou seja:

- FAQ simples: usar `AccordionTrigger`
- grupo administrativo com checkbox no header: nao usar `AccordionTrigger` como wrapper do header

### 3.12 Exemplos tecnicos de uso correto

#### Exemplo A: tabela administrativa

```tsx
<div className="relative rounded-md border bg-card">
  {isLoading ? <TableLoadingOverlay /> : null}
  <Table>...</Table>
</div>
```

Motivo:

- `rounded-md` e superficie operacional compacta
- `border` usa token global
- `bg-card` usa token global

#### Exemplo B: card de KPI

```tsx
<Card>
  <CardHeader />
  <CardContent />
</Card>
```

Motivo:

- `Card` ja centraliza `rounded-xl`, `bg-card`, `border` e `shadow-sm`

#### Exemplo C: modal de formulario

```tsx
<DialogContent className="sm:max-w-xl">
```

Motivo:

- o raio e a casca sao do componente base
- o modulo so define largura contextual

#### Exemplo D: bloco booleano

```tsx
<FormItem className="flex items-center justify-between rounded-lg border p-4">
```

Motivo:

- `rounded-lg` para superficie intermediaria, coerente com bloco de configuracao

#### Exemplo E: estado vazio de aba

```tsx
<div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 px-6 py-12 text-center">
```

Motivo:

- bloco semantico de ausencia/indisponibilidade
- usa tokens globais, nao cores/raios arbitrarios

### 3.13 Exemplos tecnicos de uso incorreto

#### Errado: hardcode de raio

```tsx
<div className="rounded-[15px] border bg-card" />
```

Problema:

- ignora `--radius`
- nao acompanha painel global de radius

#### Errado: hardcode de cor de borda

```tsx
<div className="rounded-md border border-gray-200 bg-white" />
```

Problema:

- quebra tema
- ignora tokens de `border` e `card`

#### Errado: layout isolado do sistema

```tsx
<div className="mx-auto max-w-7xl px-8 py-10">
```

Problema:

- cria outra fonte de verdade para largura e padding
- dificulta controle global de `contentWidth`

---

## 4. Contrato da Pagina Mestre

### 4.1 Guard de tela

Toda pagina administrativa deve ser embrulhada por `ScreenGuard`.

Exemplo:

```tsx
<ScreenGuard screenKey="admin.access_control">
  <PageContent />
</ScreenGuard>
```

Regra:

- `screenKey` deve refletir a policy do backend
- nenhuma tela administrativa deve renderizar sem esse guard

### 4.2 Estrutura visual base

Estrutura obrigatoria:

```tsx
<div className="flex flex-col gap-4">
  <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
    <h2 className="mb-2 text-3xl font-bold tracking-tight">Titulo</h2>
    <p className="mb-6 text-muted-foreground">Subtitulo opcional</p>

    <StatCards />

    <Tabs className="mt-8 w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
      </TabsList>

      <TabsContent value="tab-1" className="mt-4">
        <TabComponent />
      </TabsContent>
    </Tabs>
  </div>
</div>
```

Regras:

- titulo sempre antes das tabs
- subtitulo, quando existir, vem imediatamente abaixo do titulo
- `StatCards`, se existirem, ficam acima das tabs e dentro do mesmo container
- `TabsList` deve ser compacto e horizontal
- proibido esticar tabs com grids artificiais, `w-full` distribuido manualmente ou layouts de botoes tipo navbar

### 4.3 Dados compartilhados

Quando duas ou mais tabs dependem do mesmo dataset, o fetch deve ocorrer no `page.tsx`.

Exemplo real:

- `Controle de Acesso` carrega usuarios uma vez no `page.tsx`
- `UserIpRulesTab`, `UserScheduleRulesTab` e `LocationRequirementsTab` recebem `users` por props

Padrao:

```tsx
const [users, setUsers] = useState<User[]>([])

const loadUsers = useCallback(async () => {
  try {
    const data = await service.findUsers()
    setUsers(data || [])
  } catch (error) {
    notificationService.apiError(error, "Erro ao carregar usuarios.")
    setUsers([])
  }
}, [])
```

Regras:

- usar `useCallback`
- fallback explicito para array vazio
- erro sempre tratado com `notificationService.apiError`

---

## 5. Services e Types

### 5.1 Tipos

Todo modulo deve ter um arquivo de tipos dedicado.

Regras:

- datas como `string` no transporte
- payloads separados de entidades
- enums modelados com union types quando possivel
- tipos nomeados por contexto de dominio, nao por nome de componente

Exemplo:

```ts
export interface AccessRegionRule {
  id: number
  action: "allow" | "block"
  code: string
  description?: string
  active: boolean
  createdAt: string
  updatedAt: string
}
```

### 5.2 Service

Todo acesso HTTP deve passar pelo service do modulo.

Regras:

- service exportado como objeto literal
- sem chamadas diretas de `api.get/post/...` em `page.tsx` ou tabs
- nomes de metodos orientados a dominio
- retorno de `response.data`

Exemplo:

```ts
export const accessControlService = {
  findRegionRules: async () => {
    const { data } = await api.get<AccessRegionRule[]>("/access-control/region-rules")
    return data
  },
}
```

### 5.3 Texto e Traducao

Texto visivel ao usuario e parte do contrato tecnico da tela.
No frontend novo, copy, traducao, navegacao traduzivel e mensagens operacionais seguem um padrao unico.

#### 5.3.1 Fonte de verdade

A fonte de verdade para traducao no frontend novo e:

- `src/lib/i18n/domain/ports/translator.ts`
- `src/lib/i18n/index.ts`
- `src/lib/i18n/infrastructure/adapters/next-intl-client.ts`
- `src/lib/i18n/infrastructure/adapters/next-intl-server.ts`
- `messages/pt-BR.json`
- `messages/en-US.json`

Regra:

- nao usar `next-intl` diretamente em telas do sistema
- modulos do app consomem apenas `useTranslator()` ou `getServerTranslator()`

#### 5.3.2 Contrato do tradutor

O tradutor do sistema e chamavel.
O padrao aprovado e:

```ts
const t = useTranslator("users.table")
t("delete_dialog.title")
```

`ITranslator` tambem expoe:

- `t.getLocale()`

Compatibilidade:

- `t.t(...)` ainda existe apenas como camada legada
- implementacao nova nao deve usar `t.t(...)`

#### 5.3.3 Server x Client

Padrao:

- Server Component: `const t = await getServerTranslator("dashboard")`
- Client Component: `const t = useTranslator("users.table")`

Regra:

- `page.tsx` server-side deve preferir `getServerTranslator()` quando o componente for server
- componentes client-side devem usar `useTranslator()`
- nao misturar `useTranslations()` ou `getTranslations()` diretamente dentro dos modulos

#### 5.3.4 Namespace por dominio

Cada modulo deve ter namespaces semanticamente separados por responsabilidade.

Exemplos reais aprovados:

- `users`
- `users.stats`
- `users.table`
- `users.form`
- `users.details`
- `permissions`
- `permissions.roles_tab`
- `permissions.permissions_tab`
- `permissions.assignment_tab`
- `permissions.screens_tab`
- `access_control`
- `access_control.ip_blocks_tab`
- `access_control.user_schedule_rule_form`
- `backup.history_tab`
- `backup.settings_tab`
- `backup.utils`
- `ui_settings`
- `ui_settings.theme`
- `ui_settings.layout`
- `account_profile`
- `shared.confirm_dialog`
- `navigation`
- `search`
- `user`

Regra:

- o namespace do componente deve refletir o ownership do proprio componente
- texto da tabela fica em `.table`
- texto de formulario fica em `.form` ou `[recurso]_form`
- texto de dialog de detalhes fica em `.details` ou `[recurso]_dialog`
- textos compartilhados de shell ficam em namespaces globais (`navigation`, `search`, `user`, `shared.confirm_dialog`)

Anti-padrao:

- componente de tabela buscando chaves em `users` quando elas existem em `users.table`
- formulario lendo labels de `users` quando o contrato correto esta em `users.form`

#### 5.3.5 Texto estatico e proibicoes

Todo texto estatico visivel na UI deve sair do catalogo de mensagens.

Inclui:

- titulo da pagina
- subtitulo
- tabs
- labels de formulario
- placeholders
- estados vazios
- textos de `ConfirmDialog`
- labels de dropdown
- botoes
- cabeçalhos de tabela
- textos de `StatCards`
- textos do `CommandSearch`
- labels da navegacao

Excecoes aceitaveis:

- valores vindos do backend ou do dominio, como nome de usuario, email, codigo ISO e ids
- siglas curtas de interface mapeadas tecnicamente, como `PT` e `US`

#### 5.3.6 Navegacao traduzivel

A navegacao do sistema nao deve armazenar texto humanizado.

O contrato aprovado em `src/lib/navigation.ts` usa:

- `labelKey`
- `titleKey`

Regra:

- sidebar resolve `labelKey/titleKey` via namespace `navigation`
- `CommandSearch` resolve `titleKey/groupKey` via namespace `navigation`
- rotas ocultas do sidebar, mas pesquisaveis, continuam sendo definidas na mesma arvore de navegacao
- sidebar e `CommandSearch` devem consumir a mesma fonte central ja filtrada por `allowedScreens`
- nenhuma tela deve manter lista manual paralela de rotas pesquisaveis

Exemplo correto:

```ts
{
  labelKey: "settings",
  items: [
    {
      titleKey: "logs",
      url: "/logs",
      screenKey: "admin.logs",
    },
  ],
}
```

Exemplo incorreto:

```ts
{
  label: "Configurações",
  items: [{ title: "Logs" }],
}
```

#### 5.3.7 Regras para hooks, memo e schema

Strings traduzidas usadas dentro de `useMemo`, `useCallback`, `useEffect` e schemas `zod` devem ser derivadas antes e dependidas por valor.

Padrao correto:

```ts
const validationNameMin = t("val_name_min")

const schema = useMemo(
  () => z.object({
    name: z.string().min(2, validationNameMin),
  }),
  [validationNameMin],
)
```

Regra:

- nao usar o objeto `t` inteiro como dependencia de `useEffect`, `useCallback` ou `useMemo` quando o objetivo real e uma ou poucas strings
- derivar mensagens em constantes nomeadas e depender dessas constantes
- isso reduz rerender desnecessario e previne loops com adapters de traducao

#### 5.3.8 Hooks de traducao

`useTranslator()` segue as mesmas regras de qualquer hook React.

Proibicoes:

- nao chamar `useTranslator()` dentro de JSX
- nao chamar `useTranslator()` dentro de `.map()`
- nao chamar `useTranslator()` dentro de callback de evento
- nao chamar `useTranslator()` dentro de render inline de componente

Exemplo incorreto:

```tsx
<SelectItem value="active">{useTranslator("users.table")("status_active")}</SelectItem>
```

Exemplo correto:

```tsx
const tTable = useTranslator("users.table")
<SelectItem value="active">{tTable("status_active")}</SelectItem>
```

#### 5.3.9 Mensagens faltantes e validacao

Os adapters de i18n fazem fallback para a propria chave e `console.warn` em desenvolvimento.
Isso evita quebrar a UI inteira durante migracao, mas nao substitui a correção do catalogo.

Regra:

- fallback do adapter e protecao de runtime
- qualidade final exige catalogos sincronizados

Comando obrigatorio de validacao:

```bash
npm run i18n:check
```

Este script deve garantir que `pt-BR.json` e `en-US.json` possuem exatamente as mesmas chaves.

#### 5.3.10 Copy operacional

Mensagens operacionais tambem devem vir de traducao:

- `notificationService.success(...)`
- `notificationService.apiError(...)`
- mensagens de `TabStateCard`
- mensagens de `ConfirmDialog`
- textos de erro de leitura e mutacao

Padrao:

```ts
toast.apiError(error, t("error_load"))
toast.success(t("success_edit"))
```

Nao hardcodar copy operacional dentro de handlers.

#### 5.3.11 Seletor de idioma e mini menus

No shell principal, o seletor de idioma dentro do mini menu do usuario deve seguir o padrao de tabs compactas do sistema.

Regra:

- o seletor usa `Tabs`, `TabsList` e `TabsTrigger`
- a linha de idioma fica entre separadores do menu
- nao usar submenu para idioma
- nao criar caixa secundaria com borda propria dentro do mini menu
- manter apenas pequeno `padding` da linha
- labels curtas do seletor podem usar siglas tecnicas (`PT`, `US`) combinadas com bandeira

---

## 6. Gating de Permissao

### 6.1 Nivel de tela

- feito com `ScreenGuard`

### 6.2 Nivel de aba

Cada aba deve derivar booleans explicitos a partir de `useHasPermission()`.

Exemplo:

```tsx
const canRead = hasPermission("listar_bloqueios_ip")
const canCreate = hasPermission("criar_bloqueio_ip")
const canUpdate = hasPermission("atualizar_bloqueio_ip")
const canDelete = hasPermission("deletar_bloqueio_ip")
```

### 6.3 Comportamento obrigatorio

- se `canRead === false`, a aba nao tenta carregar dados
- a aba renderiza `TabStateCard` com mensagem de acesso negado
- acoes de criar, editar, excluir e mutacoes auxiliares so aparecem se a permissao existir
- nao esconder a tabela inteira se o usuario so nao puder mutar

### 6.4 Estado sem permissao

Componente padrao:

```tsx
<TabStateCard
  icon={ShieldBan}
  title="Sem permissao para listar..."
  description="Seu perfil nao possui a permissao necessaria..."
/>
```

Esse card tambem pode ser usado para:

- modulo indisponivel
- dependencia ausente
- recurso ainda nao habilitado

---

## 7. Stat Cards

### 7.1 Funcao

Cards de topo resumem o estado operacional do modulo.

### 7.2 Padrao estrutural

Implementacao em componente proprio, tipicamente `stat-cards.tsx`.

Regras:

- carregar dados em paralelo quando fizer sentido
- usar `Promise.allSettled` quando uma falha nao deve derrubar todos os cards
- mostrar `--` quando o card nao puder ser calculado
- mostrar spinner inline quando o bloco estiver carregando

### 7.3 Grid

Padrao:

```tsx
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
```

Regras:

- minimo de 2 colunas em `md`
- quantidade de colunas em `xl` proporcional ao numero de cards
- nao usar cards de largura desigual sem motivo funcional

### 7.4 Conteudo interno

- titulo curto
- icone contextual no canto superior direito
- valor em `text-2xl font-bold`
- descricao em `text-xs text-muted-foreground`

---

## 8. Contrato das Tabs Administrativas

Cada tab administrativa do tipo listagem deve seguir a sequencia abaixo:

1. derivacao de permissoes
2. estados locais
3. `loadItems` em `useCallback`
4. `useEffect` para carga inicial
5. `useEffect` para reset de pagina ao mudar busca
6. `filteredItems` em `useMemo`
7. `paginatedItems` em `useMemo`
8. handlers de criar/editar/excluir/ver
9. renderizacao:
   - barra superior
   - tabela
   - footer de paginacao
   - modais

Exemplo de estados minimos:

```tsx
const [items, setItems] = useState<ItemType[]>([])
const [isLoading, setIsLoading] = useState(false)
const [searchTerm, setSearchTerm] = useState("")
const [page, setPage] = useState(1)
const [pageSize, setPageSize] = useState(10)
const [isFormOpen, setIsFormOpen] = useState(false)
const [selectedItem, setSelectedItem] = useState<ItemType | undefined>()
const [detailsItem, setDetailsItem] = useState<ItemType | null>(null)
const [itemToDelete, setItemToDelete] = useState<ItemType | null>(null)
const [isDeleting, setIsDeleting] = useState(false)
```

Regra adicional:

- labels de tabs, textos de estado vazio, placeholders e acoes da aba devem sair do namespace de traducao do proprio modulo

---

## 9. Barra Superior da Aba

### 9.1 Busca

Padrao base:

```tsx
<div className="relative w-full max-w-sm">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <Input className="pl-9" placeholder={t("search")} />
</div>
```

### 9.2 Acoes primarias

- o botao principal da aba fica na direita em `sm+`
- no mobile, a barra pode empilhar
- texto do botao deve ser orientado a dominio

Exemplo:

```tsx
<Button onClick={handleCreate} className="cursor-pointer">
  <Plus className="mr-2 h-4 w-4" />
  {t("new_block")}
</Button>
```

### 9.3 Layout padrao da barra

```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
```

Regras:

- nao usar muitos controles de filtro soltos nessa barra quando o modulo e CRUD simples
- para filtros avancados, usar um card proprio abaixo, como em `Logs`
- placeholder de busca e label de acao primaria devem ser traduzidos, nunca hardcoded

---

## 10. Tabela Administrativa

### 10.1 Container

Padrao:

```tsx
<div className="relative rounded-md border bg-card">
  {isLoading ? <TableLoadingOverlay /> : null}
  <Table>...</Table>
</div>
```

Regras:

- tabela sempre dentro de container com borda
- `relative` obrigatorio quando houver overlay
- `bg-card` obrigatorio

### 10.2 Overlay de loading

Componente compartilhado:

```tsx
export function TableLoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
```

Regras:

- nao usar skeleton branco por cima da tabela existente
- overlay deve preservar contexto da tabela ao fundo

### 10.3 Colunas

Regra mais importante:

- a primeira coluna deve carregar o contexto principal do registro

Padrao de primeira coluna:

```tsx
<TableCell>
  <div className="space-y-1">
    <div className="font-medium">{titulo}</div>
    <div className="text-xs text-muted-foreground">{subtitulo}</div>
  </div>
</TableCell>
```

Regras:

- titulo principal em `font-medium`
- informacao secundaria em `text-xs text-muted-foreground`
- usar `truncate` apenas quando o conteudo puder explodir a largura

### 10.4 Colunas responsivas

Padrao:

- colunas secundarias podem ser ocultadas com `hidden lg:table-cell`
- acoes ficam sempre visiveis
- data de atualizacao e um bom candidato para ficar oculta em telas menores

### 10.5 Estado vazio

Padrao:

```tsx
<TableRow>
  <TableCell colSpan={N} className="h-24 text-center text-muted-foreground">
    Nenhum resultado encontrado.
  </TableCell>
</TableRow>
```

Regras:

- usar `colSpan` igual ao numero real de colunas
- mensagem deve ser especifica ao recurso quando isso melhorar clareza

---

## 11. Footer de Paginacao

### 11.1 Componente

Usar o footer compartilhado do modulo ou um equivalente identico.

Contrato:

- esquerda: label `Exibir` + select de page size
- centro: `Total: X registros`
- direita: `Pagina X de Y` + botoes `Anterior` e `Proxima`

### 11.2 Comportamento

- trocar `pageSize` sempre reseta pagina para 1
- total de paginas minimo = 1
- botoes respeitam disabled corretamente

### 11.3 Implementacao de referencia

Arquivo de referencia:

- `src/app/(dashboard)/access-control/components/table-pagination-footer.tsx`

---

## 12. Dropdown de Acoes por Linha

### 12.1 Estrutura

Padrao obrigatorio:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="cursor-pointer">
      <EllipsisVertical className="h-4 w-4" />
      <span className="sr-only">Abrir acoes</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem className="cursor-pointer">
      <Eye className="mr-2 h-4 w-4" />
      Ver detalhes
    </DropdownMenuItem>
    <DropdownMenuItem className="cursor-pointer">
      <Pencil className="mr-2 h-4 w-4" />
      Editar
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
      <Trash2 className="mr-2 h-4 w-4" />
      Excluir
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 12.2 Iconografia obrigatoria

Todo item de `DropdownMenuItem` que represente acao deve ter icone.

Regra:

- icone sempre antes do label
- tamanho padrao `h-4 w-4`
- espacamento padrao `mr-2`
- o icone deve refletir a semantica da acao, nao apenas decorar

Mapa semantico base do sistema:

- `Eye` para visualizar detalhes, historico ou leitura
- `Pencil` para editar
- `Trash2` para excluir
- icones de dominio apenas quando a acao for contextual
  - exemplo: `MapPinned` para historico de localizacao
  - exemplo: `ShieldCheck` / `ShieldBan` para ativar ou desativar requisito

Proibido:

- misturar itens com e sem icone no mesmo menu
- usar icone decorativo sem relacao com a acao
- colocar o item destrutivo sem iconografia semantica

### 12.3 Ordem

Ordem padrao:

1. ver
2. editar
3. separador
4. excluir

Excecao:

- quando a entidade nao tem `editar` nem `excluir`, manter apenas acoes permitidas
- quando a tab e operacional e nao CRUD puro, usar acoes contextuais no mesmo menu, mantendo a acao de leitura primeiro

### 12.4 Padrao visual

Regras:

- `DropdownMenuTrigger` usa `Button variant="ghost" size="icon"`
- `DropdownMenuContent` usa alinhamento `align="end"`
- todos os itens interativos usam `className="cursor-pointer"`
- item destrutivo fica no final, apos `DropdownMenuSeparator`, com `text-destructive focus:text-destructive`

---

## 13. Badges e Semantica Visual

### 13.1 Status booleano

Padrao:

- `true`: verde ou esmeralda suave
- `false`: slate ou cinza suave

Exemplo:

```tsx
<Badge
  variant="secondary"
  className={active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}
>
  {label}
</Badge>
```

### 13.2 Acoes de dominio

Quando houver semantica tipo `allow/block`:

- `allow`: esmeralda
- `block`: ambar

Nao usar vermelho saturado por padrao para badges informativas.

---

## 14. Formularios em Modal

### 14.1 Stack obrigatoria

- `react-hook-form`
- `zod`
- `zodResolver`
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`

### 14.2 Casca global do modal

No sistema atual, a casca do modal e centralizada em:

- `src/components/ui/dialog.tsx`

Contratos tecnicos da implementacao base:

- `DialogContent` ja define `rounded-lg`
- `DialogContent` ja define `border`
- `DialogContent` ja define `shadow-lg`
- `DialogContent` ja define animacao de entrada e saida
- a duracao atual da saida e `duration-200`

Consequencia pratica:

- o modulo nao deve redesenhar a casca do modal
- o modulo so pode ajustar largura, overflow e, quando estritamente necessario, layout interno
- raio, overlay, sombra e animacao sao responsabilidades globais do design system

Permitido:

```tsx
<DialogContent className="sm:max-w-xl">
<DialogContent className="sm:max-w-2xl">
<DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-5xl">
```

Proibido por default:

```tsx
<DialogContent className="rounded-2xl border-gray-200 bg-white shadow-2xl">
<DialogContent className="mx-auto max-w-6xl px-8 py-8">
```

### 14.3 Ownership de estado do modal

Padrao obrigatorio para modais que dependem de entidade selecionada:

- `open` e um estado proprio
- `selectedEntity` e outro estado proprio
- o modal nao deve derivar seu ciclo de vida diretamente de `selectedEntity`

Forma correta no componente pai:

```tsx
const [isDetailsOpen, setIsDetailsOpen] = useState(false)
const [selectedItem, setSelectedItem] = useState<Item | null>(null)

const handleOpenDetails = (item: Item) => {
  setSelectedItem(item)
  setIsDetailsOpen(true)
}
```

Forma proibida:

```tsx
const [selectedItem, setSelectedItem] = useState<Item | null>(null)

<DetailsDialog
  open={!!selectedItem}
  onOpenChange={(open) => setSelectedItem(open ? selectedItem : null)}
/>
```

Problema tecnico da forma proibida:

- quando `onOpenChange(false)` dispara, o payload e zerado imediatamente
- `DialogContent` ainda esta no DOM durante a animacao `data-[state=closed]`
- o corpo do modal perde contexto antes do fim da saida
- o usuario percebe isso como piscada, bugada ou flicker no fechamento

### 14.4 Regra de limpeza de payload

Se o modal carrega dados da entidade selecionada, a limpeza do payload deve acontecer apenas apos a saida visual ter terminado.

Como `DialogContent` usa `duration-200`, a limpeza deve acontecer depois de pelo menos `200ms`.

Padrao recomendado:

```tsx
const MODAL_EXIT_DURATION_MS = 200

useEffect(() => {
  if (isDetailsOpen) return

  const timeout = window.setTimeout(() => {
    setSelectedItem(null)
  }, MODAL_EXIT_DURATION_MS)

  return () => window.clearTimeout(timeout)
}, [isDetailsOpen])
```

Regra:

- fechar primeiro com `setIsDetailsOpen(false)`
- limpar payload depois da animacao
- o conteudo deve permanecer estavel durante `closing`

Observacao:

- se o projeto evoluir a duracao no `ui/dialog.tsx`, este delay deve acompanhar a fonte global

### 14.5 Regra para `return null`

`if (!item) return null` so e permitido quando:

- o `open` e controlado separadamente
- o payload nao e limpo antes do fim da animacao

Isto e valido:

```tsx
export function DetailsDialog({ item, open, onOpenChange }: Props) {
  if (!item) return null

  return <Dialog open={open} onOpenChange={onOpenChange}>...</Dialog>
}
```

Isto nao e valido se o pai limpa `item` no mesmo tick do fechamento.

### 14.6 Reset

Ao abrir:

- se criacao, resetar para default values
- se edicao, hidratar com os dados da entidade

Padrao:

```tsx
useEffect(() => {
  if (!open) return

  form.reset({
    ...
  })
}, [open, item, form])
```

Regra adicional:

- `form.reset` e uma operacao de entrada
- nao resetar o formulario na transicao de saida
- nao mudar o modo `edit/create` enquanto o modal esta fechando

### 14.7 Submit

Padrao:

- `setIsSubmitting(true)` antes da chamada
- `try/catch/finally`
- `notificationService.success` no sucesso
- `notificationService.apiError(...)` na falha
- `await onSuccess()` apos mutacao
- fechar modal apenas apos sucesso

### 14.8 Larguras

- `sm:max-w-xl` para formularios simples
- `sm:max-w-2xl` para formulários com grid, dias da semana, blocos booleanos ou varios campos
- `sm:max-w-5xl` para historicos densos e mapas

### 14.9 Grid tecnico

Regras:

- usar `items-start` quando qualquer coluna da linha tiver descricao ou mensagem maior
- se um campo tiver `FormDescription` e o vizinho nao tiver, usar descricao invisivel no vizinho para preservar alinhamento

Padrao:

```tsx
<div className="grid items-start gap-4 md:grid-cols-3">
```

### 14.10 Selects

Regras:

- `SelectTrigger` com `cursor-pointer`
- placeholder claro
- largura previsivel
- mesma altura dos inputs adjacentes

### 14.11 Switches booleanos

Padrao:

```tsx
<FormItem className="flex items-center justify-between rounded-lg border p-4">
```

Regras:

- bloco com borda
- label e descricao na esquerda
- switch na direita

### 14.12 Campo de horario

Padrao oficial do sistema:

- nao usar `input type="time"`
- usar componente textual dedicado
- `inputMode="numeric"`
- mascara `HH:mm`
- icone discreto na direita
- `font-medium tabular-nums`

Referencia:

- `src/app/(dashboard)/access-control/components/time-input.tsx`

### 14.13 Intervalo de datas em filtros

Padrao oficial:

- nao usar `Data inicial` + `Data final` como dois campos independentes quando o objetivo e filtrar por periodo
- usar um unico trigger com `Popover + Calendar` em modo `range`

---

## 15. Modais de Detalhes

### 15.1 Modal simples de detalhes

Para entidades tabulares simples, usar modal de leitura com pares label/valor.

Padrao:

- `DialogContent className="sm:max-w-xl"`
- lista vertical com `Separator` entre itens
- label em `text-sm font-medium text-muted-foreground`
- valor em `text-sm`
- `open` controlado por estado proprio
- entidade selecionada preservada durante o fechamento

Implementacao recomendada no pai:

```tsx
const [isDetailsOpen, setIsDetailsOpen] = useState(false)
const [detailsItem, setDetailsItem] = useState<Item | null>(null)

const handleView = (item: Item) => {
  setDetailsItem(item)
  setIsDetailsOpen(true)
}

useEffect(() => {
  if (isDetailsOpen) return

  const timeout = window.setTimeout(() => {
    setDetailsItem(null)
  }, 200)

  return () => window.clearTimeout(timeout)
}, [isDetailsOpen])

<DetailsDialog
  open={isDetailsOpen}
  onOpenChange={setIsDetailsOpen}
  item={detailsItem}
/>
```

Referencia:

- `rule-details-dialog.tsx`

### 15.2 Modal rico de historico

Para historicos, logs, trilhas e localizacao:

- modal largo
- cabecalho com contexto da entidade
- area principal visual
- painel secundario com timeline, tabela ou metadata

Exemplo real:

- `location-report-dialog.tsx`

Contratos obrigatorios quando houver coordenadas:

- mapa real, nao apenas tabela
- destaque visual do ponto selecionado
- timeline clicavel ou tabela clicavel
- busca local no historico
- cards resumo auxiliares
- mesma regra de preservacao de payload durante `close`

### 15.3 Confirm dialogs

`ConfirmDialog` segue o mesmo ciclo de vida dos demais modais.

Regra obrigatoria:

- `isOpen` nao deve ser derivado diretamente de `itemToDelete`
- `itemToDelete` nao deve ser limpo no mesmo callback que inicia o fechamento

Forma proibida:

```tsx
<ConfirmDialog
  isOpen={!!itemToDelete}
  onOpenChange={(open) => setItemToDelete(open ? itemToDelete : null)}
/>
```

Forma correta:

```tsx
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
```

Abrir:

```tsx
setItemToDelete(item)
setIsDeleteDialogOpen(true)
```

Fechar:

```tsx
setIsDeleteDialogOpen(false)
```

Limpar payload apos saida:

```tsx
useEffect(() => {
  if (isDeleteDialogOpen) return

  const timeout = window.setTimeout(() => {
    setItemToDelete(null)
  }, 200)

  return () => window.clearTimeout(timeout)
}, [isDeleteDialogOpen])
```

### 15.4 Anti-flicker checklist de modal

Antes de considerar um modal correto, validar:

- o payload continua disponivel durante a animacao de saida
- o `DialogContent` nao troca titulo, descricao ou corpo no fechamento
- `open` nao e derivado de `!!entity`
- `onOpenChange(false)` nao limpa entidade imediatamente
- `form.reset` nao roda na saida
- largura e overflow sao as unicas customizacoes aplicadas em `DialogContent`

---

## 16. Tratamento de Erros

### 16.1 Padrao

Sempre usar:

```ts
notificationService.apiError(error, t("error_load"))
```

Regra:

- nao importar `toast` diretamente de `sonner` em modulos do sistema
- modulos devem depender da facade `notificationService` ou do hook `useNotification()`
- `getApiErrorMessage()` permanece apenas como compat layer utilitaria, nao como canal final de UX
- fallback textual deve vir do namespace de traducao do modulo

### 16.1.1 Erro de permissao

Quando a API retornar:

```ts
{
  statusCode: 403,
  code: "missing_permissions",
  requiredPermissions: string[],
}
```

o frontend deve usar `notificationService.apiError(...)`.

O canal de notificacao e responsavel por:

- exibir variante visual de permissao
- mostrar as permissoes requeridas
- renderizar botao `Copiar permissão` ou `Copiar permissões`
- copiar a chave tecnica exata para a area de transferencia

Regra:

- nao montar esse botao manualmente em cada tela
- a UX de permissao insuficiente e centralizada no adaptador de notificacao

### 16.2 Fallbacks

Toda carga deve definir fallback explicito:

- arrays -> `[]`
- item selecionado -> `null`
- resumo -> `null` ou `--`

### 16.4 Notificacao transient

O sistema usa um canal transient unificado baseado em port/adaptor.

Contratos base:

- `NotificationPort`
- `notificationService`
- `useNotification()`

Metodos operacionais aprovados:

- `notificationService.success(message, options?)`
- `notificationService.error(message, options?)`
- `notificationService.warning(message, options?)`
- `notificationService.info(message, options?)`
- `notificationService.permissionError(payload, options?)`
- `notificationService.apiError(error, fallback?, options?)`

Regra:

- sucesso de mutacao deve usar `success`
- erro vindo de request deve usar `apiError`
- erro local de validacao operacional fora da API pode usar `error`

Exemplo:

```ts
try {
  await service.remove(id)
  notificationService.success("Registro removido com sucesso.")
} catch (error) {
  notificationService.apiError(error, "Erro ao remover registro.")
}
```

### 16.3 Falhas parciais

Quando uma tela possui multiplas fontes independentes, preferir `Promise.allSettled`.

Exemplo:

- `StatCards` de `Controle de Acesso`

---

## 17. Busca, Filtro e Paginacao

### 17.1 Busca local

Padrao dominante no sistema atual:

- carregar dataset da aba
- filtrar localmente com `useMemo`
- paginar localmente com `slice`

Padrao:

```tsx
const filteredItems = useMemo(() => { ... }, [items, searchTerm])
const paginatedItems = useMemo(() => {
  const startIndex = (page - 1) * pageSize
  return filteredItems.slice(startIndex, startIndex + pageSize)
}, [filteredItems, page, pageSize])
```

### 17.2 Reset de pagina

Toda alteracao de busca deve resetar pagina para 1.

Padrao:

```tsx
useEffect(() => {
  setPage(1)
}, [searchTerm])
```

### 17.3 Filtros avancados

Quando o modulo exigir filtros mais ricos:

- busca principal em destaque
- filtros complementares em grupo coeso
- segunda linha equilibrada para campos textuais/periodo
- responsivo sem sobreposicao

Referencia:

- `src/app/(dashboard)/logs/components/logs-filters.tsx`

---

## 18. Responsividade

### 18.1 Regras gerais

- layouts de topo e barra de acoes devem empilhar em mobile
- tabelas nao devem quebrar sem controle
- colunas secundarias devem sumir em breakpoints menores
- grupos de filtros compactos devem encolher sem sobrepor

### 18.2 Breakpoints praticos

Usar preferencialmente:

- `sm:` para empilhar/desempilhar barra superior
- `md:` para grids de formularios em 2 colunas
- `lg:` para revelar colunas secundarias de tabela
- `xl:` para layouts densos de filtros, cards ou mapas

### 18.3 Proibicoes

- nao deixar `SelectTrigger` sobrepor o vizinho
- nao fixar quatro colunas em area estreita sem `min-w-0`
- nao usar `w-fit` em conteudos que precisam preencher a celula

---

## 19. Regras Visuais

- todo elemento interativo deve ter `cursor-pointer`, exceto botoes informativos deliberadamente estaticos
- titulo principal em `text-3xl font-bold tracking-tight`
- subtitulo em `text-muted-foreground`
- conteudo administrativo usa `bg-card`, bordas suaves e cantos arredondados
- placeholder sempre orientado a tarefa
- nao usar UI nativa do browser quando houver componente do sistema que represente melhor a experiencia

---

## 20. Padrao para Configuracoes Globais de Sistema

Telas que alteram comportamento estrutural global do frontend, como `Layout e Tema`, seguem as mesmas regras base de uma tela administrativa, com contratos adicionais.

Exemplos:

- `src/app/(dashboard)/ui-settings/page.tsx`
- `src/contexts/ui-settings-context.tsx`

### 20.1 Fonte de verdade

Regra obrigatoria:

- a configuracao persistida vem da API
- a aplicacao em runtime e centralizada por provider global
- a tela administrativa nunca aplica CSS ou layout diretamente fora desse provider

Contrato:

- API
  - `GET /ui-settings`
  - `PUT /ui-settings`
- frontend
  - `services/ui-settings.service.ts`
  - `contexts/ui-settings-context.tsx`
  - `page.tsx` apenas orquestra `draft`, `saved` e a mutacao

### 20.2 Preview local com persistencia explicita

Telas de configuracao global devem operar com tres estados conceituais:

- `settings` do provider
  - configuracao atualmente aplicada no runtime
- `savedSettings`
  - ultimo snapshot persistido vindo da API
- `draftSettings`
  - alteracoes locais ainda nao persistidas

Padrao obrigatorio:

- cada interacao atualiza `draftSettings`
- `draftSettings` e aplicado no provider por efeito dedicado de preview, nunca dentro do updater de estado
- a persistencia acontece apenas ao clicar em `Salvar`
- ao desmontar a tela com `draft` sujo, o provider deve ser revertido para `savedSettings`

Exemplo tecnico:

```tsx
const handleDraftChange = (updater: (prev: UiSettings) => UiSettings) => {
  setDraftSettings((current) => (current ? updater(current) : current))
}
```

Preview obrigatorio:

```tsx
const applySettingsRef = useRef(applySettings)

useEffect(() => {
  applySettingsRef.current = applySettings
}, [applySettings])

useEffect(() => {
  if (!draftSettings) return
  applySettingsRef.current(draftSettings)
}, [draftSettings])
```

Cleanup obrigatorio:

```tsx
useEffect(() => {
  return () => {
    const saved = savedSettingsRef.current
    const draft = draftSettingsRef.current

    if (!saved || !draft) return

    if (JSON.stringify(toUpdatePayload(saved)) !== JSON.stringify(toUpdatePayload(draft))) {
      applySettings(saved)
    }
  }
}, [])
```

Regra:

- nunca chamar `applySettings(...)`, `setTheme(...)` ou outro update global dentro do updater de `setState`
- preview global deve acontecer apenas em `useEffect`

### 20.3 Barra de acoes da tela

No header da pagina, usar:

- status tag de sincronizacao
- `Restaurar salvo`
- acao opcional de reset para padrao base
- `Salvar alteracoes`

Regras:

- `Salvar` so habilita com `isDirty === true`
- acoes de mutacao devem respeitar permissao de negocio especifica
- usuario sem permissao de mutacao pode visualizar a tela, mas ve estado `Somente leitura`

### 20.4 Edicao de tema

Configuracoes de tema global devem obedecer:

- modo (`light` ou `dark`) como estado explicito
- fonte do tema (`shadcn`, `tweakcn`, `imported`) como selecao unica
- preset especifico controlado por `Select` quando a fonte exigir
- `radius` como token global, nunca por classe local em modulo
- overrides de cor apenas em variaveis semanticas aprovadas (`--primary`, `--secondary`, etc.)

Regra de ownership:

- o painel administrativo define o `modo padrao do sistema`
- a preferencia individual de `light/dark` pertence ao usuario autenticado
- essa preferencia individual nao deve ser salva em `ui_settings`
- a troca individual deve acontecer pelo toggle do header e persistir em `me`
- o modo efetivo em runtime deve ser resolvido como:
  - `user.themeModePreference ?? uiSettings.themeMode`

### 20.5 Importacao de tema

Importacao por CSS deve:

- ocorrer em modal proprio
- aceitar apenas contrato com `:root` e `.dark`
- parsear variaveis para `light` e `dark`
- aplicar apenas no preview ate o usuario salvar
- reportar erro via sistema de notificacoes, nunca via `console.error` como UX final

### 20.6 Configuracao estrutural de layout

Quando a tela alterar layout estrutural, como sidebar:

- a selecao deve ser totalmente clicavel
- o componente visual de opcao deve usar card seletor, nao radio nativo cru
- a mudanca deve ser aplicada pelo provider global de layout
- a tela nao deve mexer diretamente no DOM nem em classes fora desse provider

### 20.7 Navegacao e legado

Ao mover um editor flutuante, drawer ou pagina antiga para uma tela administrativa oficial:

- remover o entrypoint antigo do shell principal
- manter rota antiga apenas como redirect, quando necessario
- registrar a nova tela no menu oficial do sistema
- sincronizar busca rapida e `screenKey`

---

## 21. Anti-padroes Proibidos

- `window.confirm`
- `input type="time"` como UX principal
- dois campos soltos para periodo quando o caso e range
- chamadas HTTP diretas dentro da view sem passar pelo service
- `useTranslations()` ou `getTranslations()` diretamente em telas do sistema
- `t.t(...)` em codigo novo
- labels hardcoded em `navigation.ts`
- texto estatico hardcoded em `page.tsx`, tabs, dropdowns, placeholders e notificacoes
- `useTranslator()` dentro de JSX, `.map()`, callback inline ou handler
- usar o objeto `t` inteiro como dependencia de schema, `useMemo`, `useEffect` ou `useCallback` quando o codigo depende de strings derivadas
- manter lista manual separada para `CommandSearch` quando a rota ja existe em `src/lib/navigation.ts`
- manter labels de menu/search fora do catalogo de mensagens
- aplicar preview global de tema/layout dentro do updater de `setState`
- tabs esticadas artificialmente
- `open={!!entity}` como controle principal de modal de detalhes/confirmacao
- limpar `selectedEntity` dentro do mesmo `onOpenChange(false)`
- trocar titulo/corpo de modal durante `data-[state=closed]`
- esconder a aba inteira quando o usuario so nao pode mutar
- usar estado separado por input em formularios complexos
- tabelas sem footer de paginacao
- acoes destrutivas como CTA principal fora de dropdown ou confirm dialog
- deixar sobreposicao de filtros ou selects em breakpoints intermediarios

---

## 22. Checklist de Implementacao

Antes de considerar uma tela administrativa pronta, validar:

- [ ] existe `types/[modulo].ts`
- [ ] existe `services/[modulo].service.ts`
- [ ] namespace de traducao do modulo foi definido corretamente
- [ ] nenhum texto estatico de UI ficou hardcoded
- [ ] `useTranslator()`/`getServerTranslator()` sao o unico ponto de acesso a traducao
- [ ] nao existe `t.t(...)` no codigo novo
- [ ] schemas, memos e callbacks dependem de strings traduzidas derivadas, nao do objeto `t`
- [ ] `npm run i18n:check` passa
- [ ] labels de menu/search do modulo saem de `src/lib/navigation.ts` quando a tela participa da navegacao global
- [ ] sidebar e `CommandSearch` nao mantem fonte de verdade duplicada para a rota
- [ ] `page.tsx` usa `ScreenGuard`
- [ ] titulo, subtitulo, stat cards e tabs seguem a estrutura padrao
- [ ] permissoes de leitura e mutacao foram separadas
- [ ] estados vazios usam `TabStateCard` ou linha vazia apropriada
- [ ] tabela usa `TableLoadingOverlay`
- [ ] primeira coluna carrega o contexto principal
- [ ] acoes de linha usam `DropdownMenu`
- [ ] exclusao usa `ConfirmDialog`
- [ ] formularios usam `react-hook-form + zod`
- [ ] modal usa `open` separado de `selectedEntity`
- [ ] payload do modal so e limpo apos a animacao de saida
- [ ] grids de formulario usam `items-start` quando necessario
- [ ] campos de horario usam o componente textual padrao
- [ ] periodo usa range picker unico quando aplicavel
- [ ] footer de paginacao existe
- [ ] layout e legivel e sem sobreposicao em mobile, tablet e desktop
- [ ] `npx tsc --noEmit` passa

---

## 23. Componentes de Referencia

Arquivos de referencia tecnica no projeto:

- `src/app/(dashboard)/access-control/page.tsx`
- `src/app/(dashboard)/access-control/components/ip-blocks-tab.tsx`
- `src/app/(dashboard)/access-control/components/region-rule-form-dialog.tsx`
- `src/app/(dashboard)/access-control/components/user-schedule-rule-form-dialog.tsx`
- `src/app/(dashboard)/access-control/components/location-report-dialog.tsx`
- `src/app/(dashboard)/access-control/components/table-pagination-footer.tsx`
- `src/app/(dashboard)/access-control/components/table-loading-overlay.tsx`
- `src/app/(dashboard)/access-control/components/tab-state-card.tsx`
- `src/app/(dashboard)/logs/components/logs-filters.tsx`
- `src/app/(dashboard)/ui-settings/page.tsx`
- `src/app/(dashboard)/ui-settings/components/theme-settings-tab.tsx`
- `src/app/(dashboard)/ui-settings/components/layout-settings-tab.tsx`
- `src/app/(dashboard)/settings/account/page.tsx`
- `src/app/(dashboard)/settings/account/components/account-profile-form.tsx`
- `src/lib/i18n/domain/ports/translator.ts`
- `src/lib/i18n/infrastructure/adapters/next-intl-client.ts`
- `src/lib/i18n/infrastructure/adapters/next-intl-server.ts`
- `src/lib/navigation.ts`
- `src/components/app-sidebar.tsx`
- `src/components/command-search.tsx`
- `src/components/nav-user.tsx`

Quando houver duvida, copiar a composicao desses arquivos e adaptar o dominio, nao reinventar.
