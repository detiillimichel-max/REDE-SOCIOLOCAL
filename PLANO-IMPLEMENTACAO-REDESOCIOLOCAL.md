# REDE-SOCIOLOCAL — Roadmap de Vídeos, Cache e Controle de Consumo de APIs

> **Documento-base oficial para a construção do aplicativo REDE-SOCIOLOCAL.**
>
> Versão conceitual: **1.1 — Correção de identificação do projeto**
>
> Este documento descreve a arquitetura planejada para um feed dinâmico de conteúdos, com experiência semelhante ao Shorts do YouTube, aproveitando a base já existente no aplicativo e a estrutura do projeto Supabase Neural-iA.

## 1. Identificação correta dos projetos

- **Repositório oficial deste trabalho:** `detiillimichel-max/REDE-SOCIOLOCAL`
- **Aplicação:** `https://detiillimichel-max.github.io/REDE-SOCIOLOCAL/?v6`
- **Projeto Supabase de referência:** `Neural-iA`
- **URL informada do Supabase:** `https://svqocghixhrpqaxucubn.supabase.co/`
- **Repositório que já possui um projeto funcional:** `detiillimichel-max.github.io/-Neural-iA/?v1`
- **Regra de proteção:** o repositório `-Neural-iA` não será alterado neste trabalho.
- **Fora do escopo:** o projeto OIO TOC CORE não faz parte desta arquitetura e não deverá ser alterado.

O REDE-SOCIOLOCAL utilizará, de forma controlada e após auditoria, aquilo que for produtivo da estrutura Supabase identificada como Neural-iA. A integração ainda deverá ser confirmada no código e no projeto correto antes de ser considerada concluída.

## 2. Legenda de status

- ✔️ **Já existente ou confirmado no aplicativo.**
- 🔳 **A fazer, implementar ou validar.**
- ⚠️ **Depende de auditoria, decisão técnica, credenciais ou confirmação externa.**

## 3. Estado atual do aplicativo

- ✔️ PWA publicado no GitHub Pages.
- ✔️ Feed local de fotos e vídeos.
- ✔️ Seleção de mídia pela galeria.
- ✔️ Captura de foto e vídeo pela câmera.
- ✔️ Cards de mídia no feed.
- ✔️ Reprodução de vídeos locais.
- ✔️ Ícones Lucide.
- ✔️ Módulo de engajamento separado.
- ✔️ Manifest e Service Worker.
- ✔️ Estrutura modular de CSS e JavaScript.
- 🔳 Auditar a publicação, o feed, o player, o cache e as integrações existentes sem reconstruir o aplicativo.
- 🔳 Auditar o Supabase Neural-iA antes de utilizar suas tabelas, schemas, secrets ou Edge Functions.
- 🔳 Confirmar quais recursos do Neural-iA podem ser consumidos pelo REDE-SOCIOLOCAL.

## 4. Objetivo da arquitetura

Criar uma arquitetura híbrida para oferecer uma experiência de feed praticamente ilimitada, sem armazenar arquivos de vídeo diretamente no banco de dados e sem consumir rapidamente os limites das APIs externas.

A proposta combina:

- aplicativo frontend/PWA;
- Supabase Neural-iA como camada de dados e Edge Functions;
- cache centralizado de metadados e conteúdos descobertos;
- controle de consumo e rate limit;
- Mux para processamento e entrega de vídeos longos;
- APIs públicas e privadas consultadas dentro de cotas controladas;
- fallback com publicações próprias, imagens e áudios.

## 5. Regra de duração dos vídeos

Será definido um limite central `X` de duração. O exemplo inicial é `X = 2 minutos`, mas o valor definitivo dependerá da auditoria e dos testes.

- 🔳 Definir e validar o valor oficial de `X`.
- 🔳 Vídeos com duração igual ou inferior a `X` seguirão o fluxo normal de vídeos curtos.
- 🔳 Vídeos com duração superior a `X` serão enviados para a Mux.
- 🔳 O banco não armazenará vídeos longos como Base64, blob ou arquivo bruto.
- 🔳 O banco armazenará somente metadados e identificadores de reprodução.
- 🔳 O valor `X` ficará em configuração central para permitir ajustes futuros.

## 6. Fluxo de publicação com Mux

1. 🔳 O usuário seleciona ou grava um vídeo.
2. 🔳 O aplicativo identifica a duração antes de finalizar o envio.
3. 🔳 Se estiver dentro do limite `X`, o vídeo seguirá o fluxo de vídeo curto.
4. 🔳 Se ultrapassar `X`, o frontend solicitará uma URL de upload direto por meio de uma Edge Function do Neural-iA.
5. 🔳 O arquivo será enviado diretamente para a Mux, sem atravessar o banco.
6. 🔳 A Mux processará o vídeo.
7. 🔳 Um webhook ou Edge Function atualizará os metadados no banco.
8. 🔳 O feed utilizará o playback ID ou a URL autorizada de reprodução da Mux.

## 7. Dados armazenados no Neural-iA

O banco deverá armazenar principalmente:

- 🔳 ID da mídia e ID do usuário/autor;
- 🔳 tipo de mídia: vídeo curto, vídeo Mux, imagem com áudio ou conteúdo externo;
- 🔳 título, descrição, categoria e duração;
- 🔳 origem do conteúdo;
- 🔳 URL de origem e thumbnail;
- 🔳 Mux asset ID e playback ID, quando aplicável;
- 🔳 status: aguardando, processando, pronto, falhou ou removido;
- 🔳 datas de criação, atualização e expiração do cache.

Os nomes finais das tabelas e colunas serão definidos após auditoria do Neural-iA. Não deverão ser criadas estruturas duplicadas nem alterados dados existentes sem autorização específica.

## 8. Controle de consumo do banco — margem operacional de 25%

A meta de 25% representa uma margem operacional conservadora para banco e infraestrutura. Não significa simplesmente permitir 25 chamadas. O cálculo deverá considerar armazenamento, leituras, escritas, largura de banda, consultas simultâneas e limites do plano.

- 🔳 Limitar leituras repetidas por usuário e sessão.
- 🔳 Usar cache antes de consultar novamente o banco.
- 🔳 Evitar salvar o mesmo conteúdo externo várias vezes.
- 🔳 Usar paginação e quantidade máxima por consulta.
- 🔳 Selecionar somente as colunas necessárias.
- 🔳 Agrupar eventos de visualização quando possível.
- 🔳 Interromper ou reduzir consultas não essenciais ao atingir o orçamento.
- 🔳 Gerar alertas quando o consumo se aproximar do limite definido.

## 9. Edge Function de proteção do Neural-iA

Uma Edge Function deverá atuar como gateway entre o aplicativo, o banco e as APIs externas.

- 🔳 Validar autenticação e permissões.
- 🔳 Aplicar rate limit por usuário, sessão e origem, quando necessário.
- 🔳 Aplicar rate limit global por API.
- 🔳 Consultar o cache antes de chamar uma API.
- 🔳 Impedir consultas ilimitadas vindas do frontend.
- 🔳 Retornar cache válido quando a API estiver bloqueada ou indisponível.
- 🔳 Registrar métricas essenciais sem armazenar dados sensíveis desnecessários.
- 🔳 Responder com bloqueio temporário quando o limite for excedido.
- ⚠️ Avaliar Redis/Upstash ou solução equivalente para contadores distribuídos. Contadores apenas em memória não garantem controle consistente em funções serverless.

## 10. Modo Cinema — conceito de cache

O Modo Cinema deverá apresentar uma biblioteca contínua de conteúdos sem realizar uma chamada externa a cada rolagem ou abertura de card.

- 🔳 Consultar as fontes autorizadas somente quando houver orçamento disponível.
- 🔳 Buscar aproximadamente 100 vídeos ou itens por ciclo.
- 🔳 Salvar no cache apenas metadados, thumbnails, identificadores e URLs de origem.
- 🔳 Exibir os itens já armazenados no cache.
- 🔳 Enquanto houver conteúdo válido, não repetir a consulta da mesma fonte.
- 🔳 Quando o cache estiver próximo de acabar, aguardar a renovação do rate limit.
- 🔳 Se uma fonte estiver bloqueada, utilizar cache anterior válido ou alternar para outra fonte.

O número 100 é uma referência inicial e poderá variar por fonte, categoria, espaço disponível e comportamento real do aplicativo.

## 11. APIs públicas — teto operacional de 70%

As APIs públicas terão como objetivo operacional utilizar no máximo aproximadamente 70% do limite permitido pela API ou pelo plano.

- 🔳 Internet Archive
- 🔳 Open Library
- 🔳 Gutendex
- 🔳 Wikipedia
- 🔳 Wikimedia Commons
- 🔳 NASA
- 🔳 Crossref
- 🔳 OpenAlex

O percentual deverá ser convertido em número real por fonte. Cada API possui limites, políticas e formas de renovação diferentes.

## 12. APIs privadas ou restritas — teto operacional de 15%

As APIs privadas, restritas ou de maior sensibilidade terão utilização inicial conservadora de aproximadamente 15% do limite disponível.

- 🔳 YouTube
- 🔳 PeerTube, conforme a instância
- 🔳 Dailymotion
- 🔳 Vimeo

Essas fontes poderão alimentar cards de filmes, séries, desenhos, esportes, música e conteúdo audiovisual. A reprodução deverá respeitar embed, URL autorizada, termos e limitações do provedor.

Depois de atingir o orçamento da fonte, novas consultas ficarão pausadas até a renovação do rate limit. O aplicativo continuará utilizando o cache.

## 13. Modelo de janela e renovação

O controle deverá registrar:

- 🔳 limite oficial conhecido da fonte;
- 🔳 percentual operacional permitido;
- 🔳 quantidade calculada por janela;
- 🔳 quantidade consumida;
- 🔳 início e fim da janela;
- 🔳 data e hora de renovação;
- 🔳 tempo mínimo entre chamadas;
- 🔳 status: disponível, próximo do limite ou bloqueado temporariamente.

### Matriz operacional inicial

| Fonte | Limite operacional | Ação |
|---|---:|---|
| YouTube | 15% | Consulta controlada e depois pausa |
| Vimeo | 15% | Consulta controlada e depois pausa |
| Dailymotion | 15% | Consulta controlada e depois pausa |
| PeerTube | 15% | Consulta controlada e depois pausa |
| Internet Archive | 70% | Consulta até preencher o cache |
| Open Library | 70% | Consulta até preencher o cache |
| Wikipedia | 70% | Consulta até preencher o cache |
| Wikimedia Commons | 70% | Consulta até preencher o cache |
| NASA | 70% | Consulta até preencher o cache |
| Crossref/OpenAlex | 70% | Consulta até preencher o cache |

Esses percentuais serão transformados em números concretos conforme o limite real de cada API.

### Exemplo do ciclo

- API pública: até 70% → coleta → cache → pausa até a renovação.
- API privada: até 15% → coleta controlada → cache → pausa até a renovação.
- Durante a pausa, o feed não ficará vazio: utilizará itens já armazenados e outras fontes disponíveis.

## 14. Cards e experiência do usuário

- 🔳 Cards externos exibirão thumbnail, título, categoria, duração e origem.
- 🔳 Ao tocar no card, o aplicativo abrirá o conteúdo por embed, player autorizado ou página de origem.
- 🔳 O sistema aceitará que alguns conteúdos expirem, sejam removidos ou exijam abertura no provedor.
- 🔳 Quando não houver vídeo, o feed poderá apresentar imagem com áudio pré-selecionado.
- 🔳 Uma biblioteca de aproximadamente 15 áudios próprios poderá ser associada a imagens sem chamadas constantes às APIs.
- 🔳 O usuário deverá perceber continuidade, mesmo quando as APIs estiverem em pausa.

## 15. Ordem de preenchimento do feed

1. 🔳 Publicações próprias já existentes.
2. 🔳 Vídeos próprios curtos.
3. 🔳 Vídeos longos processados pela Mux.
4. 🔳 Conteúdos válidos do cache.
5. 🔳 Conteúdos externos recém-consultados, somente quando houver orçamento.
6. 🔳 Imagem com áudio próprio.
7. 🔳 Imagem estática como último fallback.

## 16. Cache e deduplicação

- 🔳 Usar o identificador externo como chave de deduplicação.
- 🔳 Não inserir novamente o mesmo item a cada renovação.
- 🔳 Guardar data de coleta, última exibição e expiração.
- 🔳 Separar cache de descoberta do histórico de interação.
- 🔳 Aplicar TTL diferente por fonte.
- 🔳 Não baixar o arquivo original quando thumbnail, metadados e URL forem suficientes.
- 🔳 Definir limite máximo de itens por fonte.

## 17. Como o sistema funcionará na prática

### 17.1 O app consulta as APIs

A Edge Function do Neural-iA consultará as fontes externas conforme as regras:

- APIs privadas: aproximadamente 15% do limite disponível;
- APIs públicas: aproximadamente 70% do limite disponível;
- banco e infraestrutura: aproximadamente 25% de margem operacional reservada.

### 17.2 O app monta o cache

Exemplo:

1. Consultar APIs públicas.
2. Buscar até aproximadamente 100 vídeos ou itens.
3. Salvar somente metadados, thumbnails, IDs e URLs.
4. Marcar a data de renovação.
5. Parar de consultar aquela fonte quando atingir a cota da janela.

### 17.3 Os usuários consomem somente o cache

O usuário:

- não consulta diretamente YouTube, Vimeo, Dailymotion ou outras APIs;
- não aumenta o consumo das APIs a cada visualização;
- não dispara novas consultas externas a cada card;
- apenas recebe os itens que o aplicativo já colocou no cache.

Assim, 100 usuários ou 10 mil usuários poderão consumir os mesmos itens em cache sem multiplicar proporcionalmente as chamadas às APIs externas. O rate limit é controlado pelo aplicativo, por meio da Edge Function e do cache, e não pelo usuário.

### 17.4 Se o cache acabar antes da renovação

O aplicativo poderá:

- mostrar conteúdos ainda válidos;
- usar outra fonte disponível;
- exibir publicações próprias;
- mostrar imagem com áudio;
- aguardar a próxima renovação sem bombardear as APIs.

## 18. Relação com o Neural-iA

O Neural-iA é o projeto Supabase de referência desta arquitetura. Suas Edge Functions poderão funcionar como camada de integração, segurança, cache, rate limit e comunicação com a Mux e com as APIs externas.

- ✔️ OIO TOC CORE está fora do escopo.
- 🔳 Auditar o Neural-iA antes de qualquer alteração.
- 🔳 Confirmar tabelas, schemas, secrets, RLS e Edge Functions disponíveis.
- 🔳 Não alterar tabelas, schemas, secrets ou Edge Functions do Neural-iA sem auditoria e autorização específica.
- 🔳 Implementar de forma incremental e preservar o que já funciona.

## 19. Segurança

- 🔳 Manter chaves da Mux e das APIs nos secrets das Edge Functions.
- 🔳 Nunca expor service role key ou chaves secretas no frontend.
- 🔳 Validar JWT e permissões nas funções que gravam dados.
- 🔳 Manter RLS nas tabelas acessíveis ao cliente.
- 🔳 Validar tipo, tamanho e duração dos arquivos.
- 🔳 Validar webhooks da Mux.
- 🔳 Não permitir que o frontend consulte diretamente todas as APIs sem controle.

## 20. Fases de implementação

1. 🔳 Auditar o repositório atual e identificar publicação, feed, player, cache e integrações existentes.
2. 🔳 Auditar as tabelas e Edge Functions do Neural-iA.
3. 🔳 Definir o valor `X` de duração.
4. 🔳 Implementar a detecção de duração no frontend.
5. 🔳 Criar ou adaptar o upload direto para a Mux.
6. 🔳 Implementar webhook e atualização de status.
7. 🔳 Criar o gateway de descoberta e cache.
8. 🔳 Implementar rate limit por fonte, usuário, sessão e janela.
9. 🔳 Implementar primeiro as APIs públicas.
10. 🔳 Adicionar APIs privadas com orçamento inicial de 15%.
11. 🔳 Implementar o Modo Cinema.
12. 🔳 Adicionar cards externos e fallback de imagem com áudio.
13. 🔳 Testar consumo, renovação, falhas e comportamento offline.

## 21. Regras fundamentais

- 🔳 Vídeos longos não devem ser armazenados diretamente no banco.
- 🔳 O frontend não deve chamar APIs externas a cada rolagem.
- 🔳 O cache deve ser consultado antes de novas chamadas.
- 🔳 Os limites de 15%, 25% e 70% devem ser convertidos em números reais.
- 🔳 Nenhuma chave privada deve ser exposta.
- ✔️ OIO TOC CORE não faz parte desta implementação.
- ✔️ Neural-iA é o projeto Supabase de referência desta arquitetura.
- 🔳 Nenhuma alteração destrutiva deve ser feita no Neural-iA.
- 🔳 O feed deve continuar funcionando mesmo quando uma API estiver bloqueada.

## 22. Estimativa de execução

| Etapa | Tempo aproximado |
|---|---:|
| Auditoria do repositório e do fluxo atual | 1 a 2 dias |
| Definição do limite X e fluxo Mux | 1 dia |
| Implementação do cache por aplicativo | 2 a 4 dias |
| Edge Function de controle de cota | 1 a 3 dias |
| Integração com APIs públicas | 2 a 4 dias |
| Integração com APIs privadas | 2 a 4 dias |
| Cards do Modo Cinema e fallback de imagem/áudio | 2 a 4 dias |
| Testes de renovação, cache e falhas | 2 a 3 dias |

### Estimativa geral

- **MVP funcional:** aproximadamente 10 a 15 dias de trabalho.
- **Versão mais refinada e testada:** aproximadamente 3 a 4 semanas.

A implementação será incremental. Não será necessário esperar tudo ficar pronto para testar.

## 23. Ordem recomendada para começar

1. 🔳 Auditar o frontend real do REDE-SOCIOLOCAL.
2. 🔳 Auditar o Supabase Neural-iA e suas Edge Functions.
3. 🔳 Confirmar o valor `X`.
4. 🔳 Definir os metadados e o modelo de cache.
5. 🔳 Fazer a integração mínima e segura com o Supabase, somente após aprovação.
6. 🔳 Implementar o cache centralizado.
7. 🔳 Implementar o rate limit por fonte e janela.
8. 🔳 Integrar a Mux para vídeos acima de `X`.
9. 🔳 Integrar primeiro as APIs públicas.
10. 🔳 Integrar APIs privadas dentro do teto inicial de 15%.
11. 🔳 Implementar o Modo Cinema e os fallbacks.
12. 🔳 Testar consumo, renovação, falhas e funcionamento offline.

## 24. Resultado esperado

O resultado será um aplicativo com sensação de conteúdo contínuo, mas com consumo governado.

- O **Neural-iA** ficará responsável por metadados, autenticação, controle, cache e Edge Functions.
- A **Mux** ficará responsável pelo processamento e entrega dos vídeos longos.
- As **APIs externas** fornecerão descoberta de conteúdo dentro de janelas controladas.
- O **frontend** consumirá o cache e manterá a continuidade do feed sem bombardear as APIs.

> Este documento é uma especificação conceitual. Antes da programação, será necessário confirmar os limites reais de cada API, o plano e o consumo do Neural-iA, a capacidade da conta Mux e a estrutura atual do repositório. Nenhuma funcionalidade será considerada existente ou concluída apenas por estar descrita neste documento.
