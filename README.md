# TMRD · Tarefa de Maior Risco do Dia

App (PWA) para os supervisores lançarem a tarefa de maior risco do dia pelo celular.
Os lançamentos aparecem na hora no painel da TV, da sala de operações e da gerência.

## Telas
- `#lancar` – formulário do celular (abre por padrão no celular)
- `#painel` – grade Tópico × Dias (tópico na coluna A; hoje e os próximos 2 dias nas colunas), setas para ver outros dias e exportação no mesmo formato (abre por padrão no computador)
- `#indicadores` – adesão das áreas, tarefas por dia, tópicos mais frequentes e % sem controle
- `#tv` – painel em tela cheia para a televisão, sem botões de edição, tela não apaga

## 1. Supabase (já configurado)
O banco está no projeto **recebimento-bobinas**, na tabela `tmrd_registros` (separada das tabelas das bobinas).
`config.js` já está com a URL e a chave pública. O script `supabase/schema.sql` fica de referência.

## 2. GitHub Pages
1. Crie um repositório e suba todos os arquivos desta pasta (mantendo a pasta `icons/`).
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `root` → Save.
3. O link fica `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## 3. Acesso pelo QR Code (sem instalar)
O painel mostra um QR Code que abre direto a tela de lançar. Clique nele para ampliar, copiar o link ou imprimir e colar nas áreas.
Instalar o app é opcional: quem preferir tem o atalho na tela inicial (abaixo).

## 4. Instalar nos celulares (opcional)
- **Android (Chrome):** abrir o link → botão "Instalar app" no topo (ou menu ⋮ → Instalar app).
- **iPhone (Safari):** abrir o link → Compartilhar → Adicionar à Tela de Início.
- **TV:** abrir `.../#tv` no navegador da TV ou do PC ligado nela.

## Responsáveis
A lista de supervisores e gerentes fica em `RESPONSAVEIS`, no início do `app.js`. Para incluir ou tirar alguém, edite a lista e publique (troque a versão, abaixo). Quem não está na lista pode escolher "Outro" e digitar o nome.

## Atualizar versão
Ao subir mudanças, troque `VERSION` em `sw.js` (ex.: `tmrd-v12`) e o `?v=` de `app.js`/`config.js` no `index.html`. TV, notebook e celulares conferem a cada 5 min (e ao voltar para o app) e recarregam sozinhos quando há versão nova.

## Planilha / Power BI
A view `tmrd_planilha` já entrega as colunas em português. No Excel/Power BI, conecte via
PostgreSQL (Supabase → Project Settings → Database → Connection string) e selecione `tmrd_planilha`.

## Segurança
A versão inicial deixa lançar quem tiver o link (o banco já bloqueia lançar em datas passadas). Para exigir login, ative Auth no Supabase e troque `anon`
por `authenticated` nas políticas do `schema.sql`.

## Áreas
A lista de áreas (linhas do painel) fica em `config.js` → `AREAS`. Área digitada diferente da lista aparece como linha extra no painel.

## Sem sinal
Se o celular estiver sem internet ao enviar, o lançamento fica guardado no aparelho e é enviado
sozinho quando o sinal voltar.

## Importar histórico
A tabela tem a coluna `origem` (`app` / `importacao`) para separar registros antigos importados.
