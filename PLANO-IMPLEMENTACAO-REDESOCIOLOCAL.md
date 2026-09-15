# REDE-SOCIOLOCAL — Plano de Implementação

> Documento-base oficial para a construção do aplicativo REDE-SOCIOLOCAL.
>
> **Versão conceitual:** 1.2 — Identificação exclusiva do aplicativo
>
> **Aplicação oficial em construção:** https://detiillimichel-max.github.io/REDE-SOCIOLOCAL/?v6
>
> **Supabase de referência:** Neural-iA
>
> **URL informada do Supabase:** https://svqocghixhrpqaxucubn.supabase.co/
>
> Este documento pertence exclusivamente ao aplicativo REDE-SOCIOLOCAL e será utilizado como roteiro oficial de construção. A estrutura do Supabase será aproveitada somente após auditoria e confirmação técnica. Nenhuma integração deverá ser considerada concluída sem validação no código e no projeto correto.

## Legenda

- ✔️ **Já existente ou confirmado no aplicativo.**
- 🔳 **A fazer, implementar ou validar.**
- ⚠️ **Depende de auditoria, decisão técnica, credenciais ou confirmação externa.**

## 1. Estado atual do aplicativo

- ✔️ PWA publicado no GitHub Pages.
- ✔️ Feed local de fotos e vídeos.
- ✔️ Seleção de mídia pela galeria.
- ✔️ Captura de foto e vídeo pela câmera.
- ✔️ Cards de mídia no feed.
- ✔️ Reprodução de vídeos locais.
- ✔️ Ícones Lucide.
- ✔️ Módulo de engajamento separado.
- ✔️ Manifest e Service Worker presentes.
- ✔️ Estrutura modular de HTML, CSS e JavaScript.
- 🔳 Validar o registro efetivo do Service Worker.
- 🔳 Ajustar o manifesto para utilizar ícones locais e validar a instalação PWA.
- 🔳 Confirmar o funcionamento offline.
- 🔳 Auditar publicação, feed, player, cache e integrações sem reconstruir o aplicativo.

## 2. Objetivo

Criar uma arquitetura híbrida para oferecer uma experiência de feed praticamente contínua, semelhante ao Shorts do YouTube, sem armazenar arquivos de vídeo diretamente no banco e sem consumir rapidamente os limites das APIs públicas e privadas.

A arquitetura combinará:

- frontend/PWA do REDE-SOCIOLOCAL;
- Supabase Neural-iA como camada de dados e Edge Functions;
- cache centralizado de metadados e conteúdos descobertos;
- controle de consumo e rate limit;
- Mux para processamento e entrega de vídeos longos;
- APIs públicas e privadas consultadas dentro de cotas controladas;
- fallback com publicações próprias, imagens e áudios.

## 3. Regra de duração dos vídeos

Será definido um limite central `X`. O exemplo inicial é `X = 2 minutos`, sujeito à validação.

- 🔳 Definir e validar o valor oficial de `X`.
- 🔳 Vídeos com duração igual ou inferior a `X` seguirão o fluxo normal de vídeos curtos.
- 🔳 Vídeos com duração superior a `X` serão enviados para a Mux.
- 🔳 O banco não armazenará vídeos longos como Base64, blob ou arquivo bruto.
- 🔳 O banco armazenará somente metadados e identificadores de reprodução.
- 🔳 O valor `X` ficará em configuração central.

## 4. Fluxo de publicação com Mux

1. 🔳 O usuário seleciona ou grava um vídeo.
2. 🔳 O aplicativo identifica a duração antes do envio.
3. 🔳 Vídeos dentro de `X` seguem o fluxo de curtos.
4. 🔳 Vídeos acima de `X` solicitam uma URL de upload direto por Edge Function.
5. 🔳 O arquivo é enviado diretamente para a Mux, sem atravessar o banco.
6. 🔳 A Mux processa o vídeo.
7. 🔳 Webhook ou Edge Function atualiza os metadados.
8. 🔳 O feed utiliza playback ID ou URL autorizada de reprodução.

## 5. Dados previstos no Supabase

- 🔳 ID da mídia e ID do usuário/autor.
- 🔳 Tipo de mídia: vídeo curto, vídeo Mux, imagem com áudio ou conteúdo externo.
- 🔳 Título, descrição, categoria e duração.
- 🔳 Origem, URL de origem e thumbnail.
- 🔳 Mux asset ID e playback ID, quando aplicável.
- 🔳 Status: aguardando, processando, pronto, falhou ou removido.
- 🔳 Datas de criação, atualização e expiração do cache.

Os nomes finais de tabelas e colunas serão definidos após auditoria. Não criar estruturas duplicadas nem alterar dados existentes sem autorização.

## 6. Controle de consumo do banco — margem de 25%

A margem de 25% representa uma reserva operacional para banco e infraestrutura. Não significa simplesmente permitir 25 chamadas. O cálculo deverá considerar armazenamento, leituras, escritas, largura de banda, consultas simultâneas e limites do plano.

- 🔳 Limitar leituras repetidas por usuário e sessão.
- 🔳 Consultar cache antes de consultar novamente o banco.
- 🔳 Evitar salvar o mesmo conteúdo externo várias vezes.
- 🔳 Usar paginação e limite máximo por consulta.
- 🔳 Selecionar somente as colunas necessárias.
- 🔳 Agrupar eventos de visualização quando possível.
- 🔳 Reduzir consultas não essenciais ao atingir o orçamento.
- 🔳 Gerar alertas próximos do limite.

## 7. Edge Function de proteção

Uma Edge Function deverá atuar como gateway entre o aplicativo, o banco e as APIs externas.

- 🔳 Validar autenticação e permissões.
- 🔳 Aplicar rate limit por usuário, sessão e origem.
- 🔳 Aplicar rate limit global por API.
- 🔳 Consultar o cache antes de chamar uma API.
- 🔳 Impedir consultas ilimitadas vindas do frontend.
- 🔳 Retornar cache válido quando uma API estiver bloqueada ou indisponível.
- 🔳 Registrar métricas essenciais sem dados sensíveis desnecessários.
- 🔳 Responder com bloqueio temporário quando o limite for excedido.
- ⚠️ Avaliar Redis/Upstash ou solução equivalente para contadores distribuídos.

## 8. Modo Cinema e cache

O Modo Cinema deverá apresentar uma biblioteca contínua sem realizar uma chamada externa a cada rolagem ou abertura de card.

- 🔳 Consultar fontes autorizadas somente quando houver orçamento.
- 🔳 Buscar aproximadamente 100 vídeos ou itens por ciclo.
- 🔳 Salvar somente metadados, thumbnails, IDs e URLs de origem.
- 🔳 Exibir itens já armazenados no cache.
- 🔳 Não repetir consulta enquanto houver conteúdo válido.
- 🔳 Renovar quando o cache estiver próximo de acabar e houver cota.
- 🔳 Usar cache anterior ou outra fonte quando uma fonte estiver bloqueada.

O número 100 é uma referência inicial e poderá variar conforme fonte, categoria, espaço e comportamento real.

## 9. APIs públicas — teto operacional de 70%

- 🔳 Internet Archive.
- 🔳 Open Library.
- 🔳 Gutendex.
- 🔳 Wikipedia.
- 🔳 Wikimedia Commons.
- 🔳 NASA.
- 🔳 Crossref.
- 🔳 OpenAlex.

O percentual será convertido em número real conforme o limite e a política de cada API.

## 10. APIs privadas ou restritas — teto operacional de 15%

- 🔳 YouTube.
- 🔳 PeerTube, conforme a instância.
- 🔳 Dailymotion.
- 🔳 Vimeo.

Essas fontes poderão alimentar cards de filmes, séries, desenhos, esportes, música e outros conteúdos audiovisuais. A reprodução deverá respeitar embed, URL autorizada, termos e limitações do provedor.

Após atingir o orçamento da fonte, novas consultas serão pausadas até a renovação. O aplicativo continuará usando o cache.

## 11. Modelo de janela e renovação

O controle deverá registrar:

- 🔳 Limite oficial da fonte.
- 🔳 Percentual operacional permitido.
- 🔳 Quantidade calculada por janela.
- 🔳 Quantidade consumida.
- 🔳 Início e fim da janela.
- 🔳 Data e hora de renovação.
- 🔳 Tempo mínimo entre chamadas.
- 🔳 Status: disponível, próximo do limite ou bloqueado temporariamente.

| Fonte | Limite operacional | Ação |
|---|---:|---|
| YouTube | 15% | Consulta controlada e pausa |
| Vimeo | 15% | Consulta controlada e pausa |
| Dailymotion | 15% | Consulta controlada e pausa |
| PeerTube | 15% | Consulta controlada e pausa |
| Internet Archive | 70% | Consulta até preencher o cache |
| Open Library | 70% | Consulta até preencher o cache |
| Wikipedia | 70% | Consulta até preencher o cache |
| Wikimedia Commons | 70% | Consulta até preencher o cache |
| NASA | 70% | Consulta até preencher o cache |
| Crossref/OpenAlex | 70% | Consulta até preencher o cache |

## 12. Como o sistema funcionará

### Consulta das APIs

A Edge Function consulta as fontes conforme as cotas: aproximadamente 15% para APIs privadas, 70% para APIs públicas e 25% de margem operacional para banco e infraestrutura.

### Montagem do cache

1. Consultar uma fonte autorizada.
2. Buscar até aproximadamente 100 itens.
3. Salvar metadados, thumbnails, IDs e URLs.
4. Marcar a data de renovação.
5. Pausar novas consultas quando a cota da janela for atingida.

### Consumo pelos usuários

Os usuários consomem os itens já armazenados no cache. Não consultam diretamente as APIs a cada visualização e não multiplicam proporcionalmente as chamadas externas.

Assim, 100 usuários ou 10 mil usuários podem consumir os mesmos itens em cache sem multiplicar proporcionalmente as consultas às APIs. O rate limit é controlado pelo aplicativo por meio da Edge Function e do cache, não pelo usuário.

### Se o cache acabar

- 🔳 Mostrar conteúdos ainda válidos.
- 🔳 Usar outra fonte disponível.
- 🔳 Exibir publicações próprias.
- 🔳 Mostrar imagem com áudio.
- 🔳 Aguardar a próxima renovação sem bombardear as APIs.

## 13. Cards e experiência do usuário

- 🔳 Cards externos com thumbnail, título, categoria, duração e origem.
- 🔳 Abertura por embed, player autorizado ou página de origem.
- 🔳 Tratamento de conteúdos expirados, removidos ou bloqueados pelo provedor.
- 🔳 Imagem com áudio pré-selecionado quando não houver vídeo.
- 🔳 Biblioteca inicial de aproximadamente 15 áudios próprios.
- 🔳 Continuidade percebida mesmo durante pausas das APIs.

## 14. Ordem de preenchimento do feed

1. 🔳 Publicações próprias já existentes.
2. 🔳 Vídeos próprios curtos.
3. 🔳 Vídeos longos processados pela Mux.
4. 🔳 Conteúdos válidos do cache.
5. 🔳 Conteúdos externos recém-consultados, somente com orçamento.
6. 🔳 Imagem com áudio próprio.
7. 🔳 Imagem estática como último fallback.

## 15. Cache e deduplicação

- 🔳 Usar identificador externo como chave de deduplicação.
- 🔳 Não reinserir o mesmo item a cada renovação.
- 🔳 Guardar coleta, última exibição e expiração.
- 🔳 Separar cache de descoberta do histórico de interação.
- 🔳 Aplicar TTL diferente por fonte.
- 🔳 Não baixar o arquivo original quando thumbnail, metadados e URL forem suficientes.
- 🔳 Definir limite máximo de itens por fonte.

## 16. Segurança

- 🔳 Manter chaves da Mux e das APIs nos secrets das Edge Functions.
- 🔳 Nunca expor service role key ou chaves privadas no frontend.
- 🔳 Validar JWT e permissões.
- 🔳 Manter RLS nas tabelas acessíveis ao cliente.
- 🔳 Validar tipo, tamanho e duração dos arquivos.
- 🔳 Validar webhooks da Mux.
- 🔳 Impedir consultas diretas e descontroladas do frontend.

## 17. Fases de implementação

1. 🔳 Auditar o aplicativo atual sem reconstruí-lo.
2. 🔳 Auditar tabelas, schemas, RLS, Storage e Edge Functions disponíveis no Supabase de referência.
3. 🔳 Definir o limite `X`.
4. 🔳 Implementar detecção de duração no frontend.
5. 🔳 Implementar persistência mínima de metadados.
6. 🔳 Criar ou adaptar o upload direto para a Mux.
7. 🔳 Implementar webhook e atualização de status.
8. 🔳 Criar gateway de descoberta e cache.
9. 🔳 Implementar rate limit por fonte, usuário e janela.
10. 🔳 Implementar primeiro as APIs públicas.
11. 🔳 Adicionar APIs privadas com orçamento de 15%.
12. 🔳 Implementar o Modo Cinema.
13. 🔳 Adicionar cards externos e fallback de imagem com áudio.
14. 🔳 Testar consumo, renovação, falhas e comportamento offline.

## 18. Estimativa de execução

| Etapa | Tempo aproximado |
|---|---:|
| Auditoria do aplicativo | 1 a 2 dias |
| Definição de `X` e fluxo Mux | 1 dia |
| Cache centralizado | 2 a 4 dias |
| Edge Function de controle | 1 a 3 dias |
| APIs públicas | 2 a 4 dias |
| APIs privadas | 2 a 4 dias |
| Cards e fallback | 2 a 4 dias |
| Testes | 2 a 3 dias |

- **MVP funcional:** aproximadamente 10 a 15 dias de trabalho.
- **Versão refinada e testada:** aproximadamente 3 a 4 semanas.

## 19. Regras fundamentais

- 🔳 Vídeos longos não devem ser armazenados diretamente no banco.
- 🔳 O frontend não deve chamar APIs externas a cada rolagem.
- 🔳 O cache deve ser consultado antes de novas chamadas.
- 🔳 Os limites de 15%, 25% e 70% devem ser convertidos em números reais.
- 🔳 Nenhuma chave privada deve ser exposta.
- 🔳 Nenhuma alteração destrutiva deve ser feita na estrutura existente.
- 🔳 O feed deve continuar funcionando mesmo quando uma API estiver bloqueada.

## 20. Resultado esperado

O resultado será um aplicativo com sensação de conteúdo contínuo e consumo governado. O Supabase Neural-iA ficará responsável pelos metadados, autenticação, controle, cache e Edge Functions; a Mux ficará responsável pelo processamento e entrega dos vídeos longos; e as APIs externas fornecerão descoberta de conteúdo dentro de janelas controladas.

> **Nota:** este documento é uma especificação de planejamento. Antes da programação, será necessário confirmar os limites reais de cada API, o plano e o consumo do Supabase, a capacidade da conta Mux e a estrutura atual do aplicativo.
