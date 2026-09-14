# REDESOCIOLOCAL — Arquitetura de Vídeos, Cache e Controle de Consumo

**Documento-base para o aplicativo e para o uso futuro do ecossistema Neural-iA.**

- **Projeto:** `detiillimichel-max/REDE-SOCIOLOCAL`
- **Publicação:** `https://detiillimichel-max.github.io/REDE-SOCIOLOCAL/?v6`
- **Supabase de referência futura:** Neural-iA
- **URL informada do Supabase:** `https://svqocghixhrpqaxucubn.supabase.co/`
- **OIO TOC CORE:** fora do escopo deste documento.
- **Status geral:** planejamento arquitetural; a integração ainda será realizada de forma incremental.

## Legenda de status

- ✔️ Já existente ou confirmado.
- 🔳 Planejado; ainda precisa ser implementado ou validado.
- ⚠️ Depende de auditoria, decisão técnica, credenciais ou confirmação externa.

## Estado atual e limites de escopo

- ✔️ Repositório atual identificado como `REDE-SOCIOLOCAL`.
- ✔️ Aplicativo publicado no GitHub Pages.
- ✔️ Documento de arquitetura registrado neste repositório.
- ✔️ Neural-iA definido como possível projeto Supabase de referência futura.
- ✔️ URL do Supabase registrada para integração futura.
- ✔️ OIO TOC CORE excluído desta arquitetura.
- 🔳 Supabase ainda será integrado ao aplicativo.
- 🔳 Estrutura final de tabelas e colunas ainda não definida.
- 🔳 Edge Functions específicas ainda não integradas ao aplicativo.
- 🔳 Mux ainda não integrado.
- 🔳 Cache de conteúdo ainda não implementado.
- 🔳 Rate limit ainda não implementado.
- ⚠️ Nenhuma funcionalidade deve ser marcada como concluída apenas por estar descrita neste documento.

## 1. Objetivo

Criar uma arquitetura híbrida para oferecer uma experiência de feed praticamente ilimitada, sem encher o banco de dados com arquivos de vídeo e sem consumir rapidamente os limites das APIs externas.

O projeto Supabase responsável pela camada de dados e pelas Edge Functions desta proposta será o **Neural-iA**, caso a integração seja possível, segura e tecnicamente adequada.

## 2. Regra de duração dos vídeos

Será definido um limite central `X` de duração. Exemplo inicial: `X = 2 minutos`.

- 🔳 Definir e validar o valor oficial de `X`.
- 🔳 Vídeos com duração igual ou inferior a `X` seguirão o fluxo normal de vídeos curtos.
- 🔳 Vídeos com duração superior a `X` serão enviados para a Mux.
- 🔳 O banco não armazenará vídeos longos como Base64, blob ou arquivo bruto.
- 🔳 O banco armazenará somente metadados e identificadores de reprodução.
- 🔳 O valor `X` ficará em uma configuração central para permitir ajustes futuros.

## 3. Fluxo de publicação com Mux

1. 🔳 O usuário seleciona ou grava um vídeo.
2. 🔳 O aplicativo identifica a duração antes de finalizar o envio.
3. 🔳 Se o vídeo estiver dentro do limite `X`, seguirá o fluxo de vídeo curto.
4. 🔳 Se ultrapassar `X`, o frontend solicitará uma URL de upload direto por meio de uma Edge Function do Neural-iA.
5. 🔳 O arquivo será enviado diretamente para a Mux, sem atravessar o banco.
6. 🔳 A Mux processará o vídeo.
7. 🔳 Um webhook ou Edge Function atualizará os metadados no banco.
8. 🔳 O feed utilizará o playback ID ou a URL autorizada de reprodução da Mux.

## 4. Dados armazenados no Neural-iA

O banco deverá armazenar principalmente:

- 🔳 ID da mídia e ID do usuário/autor;
- 🔳 tipo de mídia: vídeo curto, vídeo Mux, imagem com áudio ou conteúdo externo;
- 🔳 título, descrição, categoria e duração;
- 🔳 origem do conteúdo;
- 🔳 URL de origem e thumbnail;
- 🔳 Mux asset ID e playback ID, quando aplicável;
- 🔳 status: aguardando, processando, pronto, falhou ou removido;
- 🔳 datas de criação, atualização e expiração do cache.

Os nomes finais das tabelas e colunas deverão ser definidos após auditoria do Neural-iA, sem criar estruturas duplicadas ou alterar dados existentes sem autorização.

## 5. Controle de consumo do banco — margem operacional de 25%

A meta de 25% representa uma margem operacional conservadora para o consumo do banco e da infraestrutura. Não significa simplesmente permitir 25 chamadas. O cálculo deverá considerar armazenamento, leituras, escritas, largura de banda, consultas simultâneas e limites do plano.

- 🔳 Limitar leituras repetidas por usuário e sessão.
- 🔳 Usar cache antes de consultar novamente o banco.
- 🔳 Evitar salvar o mesmo conteúdo externo várias vezes.
- 🔳 Usar paginação e quantidade máxima por consulta.
- 🔳 Selecionar somente as colunas necessárias.
- 🔳 Agrupar eventos de visualização quando possível.
- 🔳 Interromper ou reduzir consultas não essenciais ao atingir o orçamento.
- 🔳 Gerar alertas quando o consumo se aproximar do limite definido.

## 6. Edge Function de proteção do Neural-iA

Uma Edge Function deverá atuar como gateway entre o aplicativo, o banco e as APIs externas.

- 🔳 Validar autenticação e permissões.
- 🔳 Aplicar rate limit por usuário, sessão e origem, quando necessário.
- 🔳 Aplicar rate limit global por API.
- 🔳 Consultar o cache antes de chamar uma API.
- 🔳 Impedir consultas ilimitadas vindas do frontend.
- 🔳 Retornar cache válido quando a API estiver bloqueada ou indisponível.
- 🔳 Registrar métricas essenciais sem armazenar dados sensíveis desnecessários.
- 🔳 Responder com bloqueio temporário quando o limite for excedido.
- ⚠️ Avaliar mecanismo persistente para contadores distribuídos, como Redis/Upstash ou solução equivalente. Contadores apenas em memória não garantem controle consistente em funções serverless.

## 7. Modo Cinema — conceito de cache

O Modo Cinema deverá apresentar uma biblioteca contínua de conteúdos sem realizar uma chamada externa a cada rolagem ou abertura de card.

- 🔳 Consultar as fontes autorizadas somente quando houver orçamento disponível.
- 🔳 Buscar aproximadamente 100 vídeos ou itens por ciclo.
- 🔳 Salvar no cache apenas metadados, thumbnails, identificadores e URLs de origem.
- 🔳 Exibir os itens já armazenados no cache.
- 🔳 Enquanto houver conteúdo válido, não repetir a consulta da mesma fonte.
- 🔳 Quando o cache estiver próximo de acabar, aguardar a renovação do rate limit.
- 🔳 Se uma fonte estiver bloqueada, utilizar cache anterior válido ou alternar para outra fonte.

O número 100 é uma referência inicial e poderá variar por fonte, categoria, espaço e comportamento real do aplicativo.

## 8. APIs públicas — teto operacional de 70%

As APIs públicas terão como objetivo operacional utilizar no máximo aproximadamente 70% do limite permitido pela API ou pelo plano.

- 🔳 Internet Archive
- 🔳 Open Library
- 🔳 Gutendex
- 🔳 Wikipedia
- 🔳 Wikimedia Commons
- 🔳 NASA
- 🔳 Crossref
- 🔳 OpenAlex

O percentual deverá ser convertido para um número real por fonte. Cada API possui limites, políticas e formas de renovação diferentes.

## 9. APIs privadas ou restritas — teto operacional de 15%

As APIs privadas, restritas ou de maior sensibilidade terão uma utilização inicial conservadora de aproximadamente 15% do limite disponível.

- 🔳 YouTube
- 🔳 PeerTube, conforme a instância
- 🔳 Dailymotion
- 🔳 Vimeo

Essas fontes poderão alimentar cards de filmes, séries, desenhos, esportes, música e conteúdo audiovisual. A reprodução deverá respeitar o embed, a URL autorizada, os termos e as limitações do provedor.

Depois de atingir o orçamento da fonte, novas consultas ficarão pausadas até a renovação do rate limit. O aplicativo continuará usando o cache.

## 10. Modelo de janela e renovação

O controle deverá registrar:

- 🔳 limite oficial conhecido da fonte;
- 🔳 percentual operacional permitido;
- 🔳 quantidade calculada por janela;
- 🔳 quantidade consumida;
- 🔳 início e fim da janela;
- 🔳 data/hora de renovação;
- 🔳 tempo mínimo entre chamadas;
- 🔳 status: disponível, próximo do limite ou bloqueado temporariamente.

### Exemplo do ciclo

- API pública: até 70% → coleta → cache → pausa até a renovação.
- API privada: até 15% → coleta controlada → cache → pausa até a renovação.
- Durante a pausa, o feed não ficará vazio: utilizará itens já armazenados e outras fontes disponíveis.

## 11. Cards e experiência do usuário

- 🔳 Cards externos exibirão thumbnail, título, categoria, duração e origem.
- 🔳 Ao tocar no card, o aplicativo abrirá o conteúdo por embed, player autorizado ou página de origem.
- 🔳 O sistema aceitará que alguns conteúdos expirem, sejam removidos ou exijam abertura no provedor.
- 🔳 Quando não houver vídeo, o feed poderá apresentar imagem com áudio pré-selecionado.
- 🔳 Uma biblioteca de aproximadamente 15 áudios próprios poderá ser associada a imagens sem chamadas constantes às APIs.
- 🔳 O usuário deverá perceber continuidade, mesmo quando as APIs estiverem em pausa.

## 12. Ordem de preenchimento do feed

1. 🔳 Publicações próprias já existentes.
2. 🔳 Vídeos próprios curtos.
3. 🔳 Vídeos longos processados pela Mux.
4. 🔳 Conteúdos válidos do cache.
5. 🔳 Conteúdos externos recém-consultados, somente quando houver orçamento.
6. 🔳 Imagem com áudio próprio.
7. 🔳 Imagem estática como último fallback.

## 13. Cache e deduplicação

- 🔳 Usar o identificador externo como chave de deduplicação.
- 🔳 Não inserir novamente o mesmo item a cada renovação.
- 🔳 Guardar data de coleta, última exibição e expiração.
- 🔳 Separar cache de descoberta do histórico de interação.
- 🔳 Aplicar TTL diferente por fonte.
- 🔳 Não baixar o arquivo original quando thumbnail, metadados e URL forem suficientes.
- 🔳 Definir limite máximo de itens por fonte.

## 14. Relação com o Neural-iA

O Neural-iA é o projeto Supabase de referência desta arquitetura. Suas Edge Functions poderão funcionar como camada de integração, segurança, cache, rate limit e comunicação com a Mux e com as APIs externas.

- ✔️ OIO TOC CORE está explicitamente fora do escopo.
- 🔳 Auditar o Neural-iA antes de qualquer alteração.
- 🔳 Confirmar tabelas, schemas, secrets, RLS e Edge Functions disponíveis.
- 🔳 Não alterar tabelas, schemas, secrets ou Edge Functions do Neural-iA sem auditoria e autorização específica.
- 🔳 Implementar de forma incremental e preservar o que já funciona.

## 15. Segurança

- 🔳 Manter chaves da Mux e das APIs nos secrets das Edge Functions.
- 🔳 Nunca expor service role key ou chaves secretas no frontend.
- 🔳 Validar JWT e permissões nas funções que gravam dados.
- 🔳 Manter RLS nas tabelas acessíveis ao cliente.
- 🔳 Validar tipo, tamanho e duração dos arquivos.
- 🔳 Validar webhooks da Mux.
- 🔳 Não permitir que o frontend consulte diretamente todas as APIs sem controle.

## 16. Fases de implementação

1. 🔳 Auditar o repositório atual e identificar publicação, feed, player, cache e integrações existentes.
2. 🔳 Auditar as tabelas e Edge Functions do Neural-iA.
3. 🔳 Definir o valor `X` de duração.
4. 🔳 Implementar a detecção de duração no frontend.
5. 🔳 Criar ou adaptar o upload direto para a Mux.
6. 🔳 Implementar webhook e atualização de status.
7. 🔳 Criar o gateway de descoberta e cache.
8. 🔳 Implementar rate limit por fonte, usuário, sessão e janela conforme a necessidade real.
9. 🔳 Implementar primeiro as APIs públicas.
10. 🔳 Adicionar APIs privadas com orçamento inicial de 15%.
11. 🔳 Implementar o Modo Cinema.
12. 🔳 Adicionar cards externos e fallback de imagem com áudio.
13. 🔳 Testar consumo, renovação, falhas e comportamento offline.

## 17. Regras fundamentais

- 🔳 Vídeos longos não devem ser armazenados diretamente no banco.
- 🔳 O frontend não deve chamar APIs externas a cada rolagem.
- 🔳 O cache deve ser consultado antes de novas chamadas.
- 🔳 Os limites de 15%, 25% e 70% devem ser convertidos em números reais.
- 🔳 Nenhuma chave privada deve ser exposta.
- ✔️ OIO TOC CORE não faz parte desta implementação.
- ✔️ Neural-iA é o projeto Supabase de referência futura desta arquitetura.
- 🔳 Nenhuma alteração destrutiva deve ser feita no Neural-iA.
- 🔳 O feed deve continuar funcionando mesmo quando uma API estiver bloqueada.

## 18. Resultado esperado

O resultado será um aplicativo com sensação de conteúdo contínuo, mas com consumo governado. O Neural-iA ficará responsável por metadados, autenticação, controle, cache e Edge Functions; a Mux ficará responsável pelo processamento e entrega dos vídeos longos; e as APIs externas fornecerão descoberta de conteúdo dentro de janelas controladas.

## 19. Como funcionará o sistema de cache

### 19.1 O app consulta as APIs

A Edge Function do Neural-iA consultará as fontes externas conforme as regras:

- APIs privadas: aproximadamente 15% do limite disponível;
- APIs públicas: aproximadamente 70% do limite disponível;
- banco/infraestrutura: aproximadamente 25% de margem operacional reservada.

### 19.2 O app monta o cache

Exemplo de ciclo:

1. Consultar APIs públicas.
2. Buscar até aproximadamente 100 vídeos ou itens.
3. Salvar somente metadados, thumbnails, IDs e URLs.
4. Marcar a data de renovação.
5. Parar de consultar aquela fonte quando atingir a cota da janela.

### 19.3 Os usuários consomem somente o cache

O usuário:

- não consulta diretamente YouTube, Vimeo, Dailymotion ou outras APIs;
- não aumenta o consumo das APIs a cada visualização;
- não dispara novas consultas externas a cada card;
- apenas recebe os itens que o aplicativo já colocou no cache.

Assim, 100 usuários ou 10 mil usuários poderão consumir os mesmos itens armazenados, sem multiplicar proporcionalmente as chamadas às APIs externas. O consumo do banco ainda deverá ser otimizado por paginação, cache local, consultas agrupadas e seleção de colunas.

## 20. Matriz inicial de rate limit

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

Esses percentuais serão transformados em números concretos conforme o limite real, o plano, a política e a janela de cada API.

## 21. Comportamento quando o cache acabar

Se o cache acabar antes da renovação, o aplicativo poderá:

- 🔳 mostrar conteúdos ainda válidos;
- 🔳 usar outra fonte disponível;
- 🔳 exibir publicações próprias;
- 🔳 mostrar imagem com áudio;
- 🔳 aguardar a próxima renovação sem bombardear as APIs.

## 22. Estimativa de implementação

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

- 🔳 MVP funcional: aproximadamente 10 a 15 dias de trabalho.
- 🔳 Versão mais refinada e testada: aproximadamente 3 a 4 semanas.

As estimativas são aproximadas e dependem da auditoria, dos limites reais das APIs, do plano do Supabase, da conta Mux e do estado do frontend.

## 23. Ordem recomendada de execução

1. 🔳 Auditoria do repositório atual.
2. 🔳 Auditoria do Neural-iA, sem alterações destrutivas.
3. 🔳 Definição do limite `X`.
4. 🔳 Desenho da estrutura de metadados e cache.
5. 🔳 Integração mínima e segura do Supabase.
6. 🔳 Implementação do cache por aplicativo.
7. 🔳 Implementação do controle de renovação e rate limit.
8. 🔳 Integração da Mux para vídeos acima de `X`.
9. 🔳 Integração das APIs públicas.
10. 🔳 Integração das APIs privadas.
11. 🔳 Implementação do Modo Cinema e dos fallbacks.
12. 🔳 Testes finais de consumo, falhas, renovação e funcionamento offline.

## Nota final

Este documento é uma especificação conceitual e um roteiro de execução. Antes da programação, será necessário confirmar os limites reais de cada API, o plano e o consumo do Neural-iA, a capacidade da conta Mux e a estrutura atual do repositório.

Nenhuma integração, tabela, Edge Function, segredo ou configuração será considerada concluída sem implementação e verificação real.