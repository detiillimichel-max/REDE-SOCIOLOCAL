# Neural-iA — Arquitetura de Vídeos, Cache e Controle de Consumo

**Documento-base do projeto**

- **Repositório:** `detiillimichel-max/REDE-SOCIOLOCAL`
- **Aplicação:** `https://detiillimichel-max.github.io/REDE-SOCIOLOCAL/?v6`
- **Projeto Supabase:** Neural-iA
- **URL informada do Supabase:** `https://svqocghixhrpqaxucubn.supabase.co/`
- **Escopo:** arquitetura de vídeos, Mux, cache, Modo Cinema e controle de consumo
- **Versão do documento:** 1.0
- **Última atualização:** 2026-09-14

> **Importante:** este documento se refere ao projeto **Neural-iA**. O projeto **OIO TOC CORE não faz parte desta arquitetura** e não deve ser alterado como parte desta implementação.

---

## 1. Objetivo

Criar uma arquitetura híbrida para oferecer uma experiência de feed praticamente ilimitada, sem encher o banco de dados com arquivos de vídeo e sem consumir rapidamente os limites das APIs externas.

O Neural-iA será responsável pela camada de dados, cache, controle de consumo e Edge Functions. A Mux será utilizada para processamento e entrega de vídeos acima do limite de duração definido. As APIs externas serão consultadas de maneira controlada, e os usuários consumirão somente o conteúdo que já estiver disponível no cache do aplicativo.

---

## 2. Estado atual do projeto

### Já existe / já feito

- [x] Repositório `REDE-SOCIOLOCAL` criado e publicado.
- [x] Frontend PWA existente.
- [x] Interface de feed para fotos e vídeos locais.
- [x] Seleção de fotos pela galeria.
- [x] Seleção de vídeos pela galeria.
- [x] Captura de fotos pela câmera.
- [x] Gravação de vídeos pela câmera.
- [x] Exibição de mídias no feed.
- [x] Estrutura de PWA com `manifest.json`.
- [x] Service Worker existente para suporte offline.
- [x] Biblioteca Lucide utilizada no frontend.
- [x] Módulo de engajamento separado em `js/engajamento.js`.
- [x] Botões de curtir, não curtir, comentários e compartilhar.
- [x] Projeto Supabase Neural-iA existente.
- [x] Tabelas e Edge Functions existentes no Neural-iA.
- [x] Estrutura inicial para integração futura com APIs externas.
- [x] Conceito de utilização da Mux definido para vídeos acima do limite X.
- [x] Conceito de cache centralizado por aplicativo definido.
- [x] Conceito de rate limit por aplicativo definido.

### Ainda precisa ser feito

- [ ] Auditar profundamente o frontend atual antes de modificar qualquer arquivo.
- [ ] Auditar as tabelas e Edge Functions existentes no Neural-iA.
- [ ] Definir formalmente o limite X de duração dos vídeos.
- [ ] Implementar a identificação da duração antes do upload definitivo.
- [ ] Implementar o fluxo de upload direto para a Mux.
- [ ] Implementar webhook ou rotina segura para acompanhar o processamento da Mux.
- [ ] Criar ou adaptar a estrutura de metadados dos vídeos Mux.
- [ ] Criar o gateway de descoberta de conteúdo.
- [ ] Criar o cache por aplicativo.
- [ ] Criar o controle de rate limit por fonte e por janela.
- [ ] Implementar a renovação automática das janelas de consulta.
- [ ] Implementar o Modo Cinema.
- [ ] Integrar primeiro as APIs públicas.
- [ ] Integrar depois as APIs privadas ou restritas.
- [ ] Implementar deduplicação dos conteúdos externos.
- [ ] Implementar cards de filmes, séries, desenhos, esportes, música e audiovisual.
- [ ] Implementar fallback para imagem com áudio próprio.
- [ ] Implementar métricas de cache hit, cache miss e consumo.
- [ ] Realizar testes de limite, falha, renovação e recuperação.
- [ ] Atualizar este documento ao concluir cada etapa.

---

## 3. Regra de duração dos vídeos

Será definido um limite configurável **X** de duração. O exemplo inicial considerado é **X = 2 minutos**.

- [ ] Definir o valor oficial de X.
- [ ] Colocar o valor X em uma configuração central.
- [ ] Permitir alteração futura sem reescrever o aplicativo.

Regras:

- [ ] Vídeos com duração igual ou inferior a X seguem o fluxo normal de vídeos curtos.
- [ ] Vídeos com duração superior a X são enviados para a Mux.
- [ ] O banco não armazena vídeos longos como Base64, blob ou arquivo bruto.
- [ ] O banco armazena somente metadados e identificadores de reprodução.

---

## 4. Fluxo de publicação com Mux

1. [ ] O usuário seleciona ou grava um vídeo.
2. [ ] O aplicativo identifica a duração antes de finalizar o envio.
3. [ ] Se o vídeo estiver dentro do limite X, segue o fluxo de vídeo curto.
4. [ ] Se ultrapassar X, o frontend solicita uma URL de upload direto por meio de uma Edge Function do Neural-iA.
5. [ ] O arquivo é enviado diretamente para a Mux, sem atravessar o banco.
6. [ ] A Mux processa o vídeo.
7. [ ] Um webhook ou Edge Function atualiza os metadados no banco.
8. [ ] O feed utiliza o playback ID ou a URL autorizada de reprodução da Mux.

### Resultado esperado

O banco guarda somente informações como título, descrição, autor, duração, status, thumbnail, `asset_id` e `playback_id`. O arquivo pesado permanece na infraestrutura de vídeo da Mux.

---

## 5. Dados armazenados no Neural-iA

A estrutura final deverá ser definida após auditoria das tabelas existentes, evitando duplicação ou alterações destrutivas.

Metadados previstos:

- [ ] ID da mídia.
- [ ] ID do usuário ou autor.
- [ ] Tipo de mídia: vídeo curto, vídeo Mux, imagem com áudio ou conteúdo externo.
- [ ] Título.
- [ ] Descrição.
- [ ] Categoria.
- [ ] Duração em segundos.
- [ ] Origem do conteúdo.
- [ ] URL de origem.
- [ ] URL da thumbnail.
- [ ] Mux asset ID, quando aplicável.
- [ ] Mux playback ID, quando aplicável.
- [ ] Status: aguardando, processando, pronto, falhou ou removido.
- [ ] Data de criação.
- [ ] Data de atualização.
- [ ] Data de expiração do cache, quando aplicável.

---

## 6. Controle de consumo do banco — margem operacional de 25%

A meta de **25%** representa uma margem operacional conservadora para o consumo do banco do Neural-iA. Não significa simplesmente permitir 25 chamadas. O cálculo deverá considerar armazenamento, leituras, escritas, largura de banda, consultas simultâneas e limites do plano.

- [ ] Definir o orçamento operacional do banco.
- [ ] Limitar leituras repetidas.
- [ ] Usar cache antes de consultar novamente o banco.
- [ ] Evitar salvar o mesmo conteúdo externo várias vezes.
- [ ] Usar paginação e quantidade máxima por consulta.
- [ ] Selecionar somente as colunas necessárias.
- [ ] Agrupar eventos de visualização quando possível.
- [ ] Interromper ou reduzir consultas não essenciais ao atingir o orçamento.
- [ ] Gerar alertas quando o consumo se aproximar do limite definido.

> A margem de 25% é uma meta de segurança. O limite real deverá ser calculado com base no plano e no consumo medido do Neural-iA.

---

## 7. Edge Function de proteção do Neural-iA

A Edge Function deverá atuar como gateway entre o aplicativo, o banco, a Mux e as APIs externas.

### Correção importante: rate limit por aplicativo

O rate limit **não será por usuário**. Ele será aplicado ao **aplicativo como um todo**.

O usuário final não consulta diretamente as APIs externas. Ele apenas recebe e consome o conteúdo que o aplicativo já colocou no cache.

### Responsabilidades

- [ ] Validar autenticação e permissões quando a operação exigir autenticação.
- [ ] Aplicar rate limit global por aplicativo.
- [ ] Aplicar controle individual por fonte de API.
- [ ] Consultar o cache antes de chamar uma API.
- [ ] Impedir consultas ilimitadas vindas do frontend.
- [ ] Retornar cache válido quando a API estiver bloqueada ou indisponível.
- [ ] Registrar métricas essenciais.
- [ ] Responder com bloqueio temporário quando o orçamento da fonte for atingido.
- [ ] Controlar a janela de renovação de cada fonte.
- [ ] Evitar que cada visualização gere uma nova consulta externa.

### Funcionamento simplificado

```text
APIs externas
     ↓
Edge Function do Neural-iA
     ↓
Rate limit global do aplicativo
     ↓
Cache centralizado
     ↓
Frontend
     ↓
Usuários apenas consomem o cache
```

> O rate limit será por aplicativo, por fonte e por janela. Não será necessário criar uma regra de rate limit individual para cada usuário.

---

## 8. Modo Cinema — conceito de cache

O Modo Cinema deverá apresentar uma biblioteca contínua de conteúdos sem realizar uma chamada externa a cada rolagem ou abertura de card.

### Ciclo de funcionamento

1. [ ] Consultar as fontes autorizadas somente quando houver orçamento disponível.
2. [ ] Buscar aproximadamente 100 vídeos ou itens por ciclo.
3. [ ] Salvar no cache apenas metadados, thumbnails, identificadores e URLs de origem.
4. [ ] Exibir os itens já armazenados no cache.
5. [ ] Enquanto houver conteúdo válido, não repetir a consulta da mesma fonte.
6. [ ] Quando o cache estiver próximo de acabar, verificar a renovação do rate limit.
7. [ ] Se a janela estiver liberada, consultar novamente a fonte.
8. [ ] Se a fonte estiver bloqueada, utilizar cache anterior válido ou alternar para outra fonte.

O número **100** é uma referência inicial. Poderá variar por fonte, categoria, espaço disponível e comportamento real do aplicativo.

---

## 9. APIs públicas — teto operacional de 70%

As APIs públicas terão como objetivo operacional utilizar no máximo aproximadamente **70% do limite permitido** pela API ou pelo plano.

Fontes previstas:

- [ ] Internet Archive.
- [ ] Open Library.
- [ ] Gutendex.
- [ ] Wikipedia.
- [ ] Wikimedia Commons.
- [ ] NASA.
- [ ] Crossref.
- [ ] OpenAlex.

Regras:

- [ ] Converter o percentual em quantidade real por fonte.
- [ ] Respeitar o limite oficial de cada API.
- [ ] Consultar somente quando houver orçamento disponível.
- [ ] Armazenar os resultados no cache.
- [ ] Pausar consultas ao atingir o orçamento da janela.
- [ ] Retomar somente após a renovação da janela.

---

## 10. APIs privadas ou restritas — teto operacional de 15%

As APIs privadas, restritas ou de maior sensibilidade terão uma utilização inicial conservadora de aproximadamente **15% do limite disponível**.

Fontes previstas:

- [ ] YouTube.
- [ ] PeerTube, conforme a instância utilizada.
- [ ] Dailymotion.
- [ ] Vimeo.

Essas fontes poderão alimentar cards de:

- [ ] Filmes.
- [ ] Séries.
- [ ] Desenhos.
- [ ] Esportes.
- [ ] Música.
- [ ] Conteúdo audiovisual.

A reprodução deverá respeitar o embed, a URL autorizada, os termos e as limitações de cada provedor.

### Regra de pausa

Depois de atingir o orçamento da fonte:

- [ ] Pausar novas consultas dessa fonte.
- [ ] Continuar exibindo o cache existente.
- [ ] Não renovar chamadas a cada visualização.
- [ ] Verificar a próxima janela de renovação.
- [ ] Retomar consultas somente quando o rate limit for liberado.

---

## 11. Modelo de janela e renovação

Cada fonte deverá possuir uma configuração semelhante a:

- [ ] Limite oficial conhecido da fonte.
- [ ] Percentual operacional permitido.
- [ ] Quantidade calculada por janela.
- [ ] Quantidade consumida.
- [ ] Início da janela.
- [ ] Fim da janela.
- [ ] Data/hora de renovação.
- [ ] Tempo mínimo entre chamadas.
- [ ] Status: disponível, próximo do limite ou bloqueado temporariamente.

### Exemplos

```text
API pública:
Até 70% → coleta → cache → pausa → renovação → nova coleta

API privada:
Até 15% → coleta controlada → cache → pausa → renovação → nova coleta
```

Durante a pausa, o feed deverá continuar utilizando:

- [ ] Conteúdos já armazenados.
- [ ] Outras fontes disponíveis.
- [ ] Publicações próprias.
- [ ] Imagens com áudio próprio.

---

## 12. Cards e experiência do usuário

- [ ] Cards externos exibem thumbnail, título, categoria, duração e origem.
- [ ] Ao tocar no card, o aplicativo abre o conteúdo por embed, player autorizado ou página de origem.
- [ ] O sistema aceita que alguns conteúdos expirem, sejam removidos ou exijam abertura no provedor.
- [ ] O usuário não vê o rate limit interno.
- [ ] O usuário não consulta diretamente as APIs externas.
- [ ] O usuário apenas consome os itens disponíveis no cache.
- [ ] Quando não houver vídeo, o feed poderá apresentar imagem com áudio pré-selecionado.
- [ ] A biblioteca de aproximadamente 15 áudios próprios poderá ser associada a imagens.
- [ ] O usuário deverá perceber continuidade mesmo quando as APIs estiverem em pausa.

---

## 13. Ordem de preenchimento do feed

1. [x] Publicações próprias já existentes.
2. [x] Vídeos próprios curtos, conforme o fluxo atual do frontend.
3. [ ] Vídeos longos processados pela Mux.
4. [ ] Conteúdos válidos do cache.
5. [ ] Conteúdos externos recém-consultados, somente quando houver orçamento.
6. [ ] Imagem com áudio próprio.
7. [ ] Imagem estática como último fallback.

---

## 14. Cache e deduplicação

- [ ] Usar o identificador externo como chave de deduplicação.
- [ ] Não inserir novamente o mesmo item a cada renovação.
- [ ] Guardar data de coleta.
- [ ] Guardar última exibição, quando necessário.
- [ ] Guardar data de expiração.
- [ ] Separar cache de descoberta do histórico de interação.
- [ ] Aplicar TTL diferente por fonte.
- [ ] Não baixar o arquivo original quando thumbnail, metadados e URL forem suficientes.
- [ ] Definir limite máximo de itens por fonte.
- [ ] Remover ou arquivar itens expirados de maneira controlada.

---

## 15. Relação com o Neural-iA

O Neural-iA é o projeto Supabase de referência desta arquitetura. Suas Edge Functions poderão funcionar como camada de integração, segurança, cache, rate limit e comunicação com a Mux e com as APIs externas.

- [x] Projeto de referência definido como Neural-iA.
- [x] URL informada registrada neste documento.
- [x] OIO TOC CORE excluído deste escopo.
- [ ] Auditar as tabelas existentes antes de criar novas estruturas.
- [ ] Auditar as Edge Functions existentes antes de adaptar ou criar funções.
- [ ] Não alterar tabelas, schemas, secrets ou Edge Functions sem autorização específica.
- [ ] Manter a implementação incremental.
- [ ] Preservar o que já funciona.

---

## 16. Segurança

- [ ] Manter chaves da Mux e das APIs nos secrets das Edge Functions.
- [ ] Nunca expor `service_role key` ou chaves secretas no frontend.
- [ ] Validar JWT e permissões nas funções que gravam dados.
- [ ] Manter RLS nas tabelas acessíveis ao cliente.
- [ ] Validar tipo, tamanho e duração dos arquivos.
- [ ] Validar webhooks da Mux.
- [ ] Não permitir que o frontend consulte diretamente todas as APIs sem controle.
- [ ] Validar URLs e identificadores externos.
- [ ] Evitar armazenar dados sensíveis desnecessários nos logs.

---

## 17. Fases de implementação

### Fase 1 — Auditoria e definição

- [ ] Auditar o repositório atual.
- [ ] Identificar publicação, feed, player, cache e integração existentes.
- [ ] Auditar tabelas e Edge Functions do Neural-iA.
- [ ] Definir o valor X de duração.
- [ ] Definir o formato final dos metadados.

### Fase 2 — Mux

- [ ] Implementar detecção de duração no frontend.
- [ ] Criar ou adaptar o upload direto para a Mux.
- [ ] Implementar webhook e atualização de status.
- [ ] Exibir vídeos Mux no feed.

### Fase 3 — Cache e gateway

- [ ] Criar o gateway de descoberta.
- [ ] Criar o cache por aplicativo.
- [ ] Implementar deduplicação.
- [ ] Implementar rate limit por fonte e janela.
- [ ] Implementar renovação das janelas.
- [ ] Implementar fallback quando uma fonte estiver bloqueada.

### Fase 4 — APIs públicas

- [ ] Integrar Internet Archive.
- [ ] Integrar Open Library.
- [ ] Integrar Gutendex.
- [ ] Integrar Wikipedia.
- [ ] Integrar Wikimedia Commons.
- [ ] Integrar NASA.
- [ ] Integrar Crossref.
- [ ] Integrar OpenAlex.

### Fase 5 — APIs privadas

- [ ] Integrar YouTube com orçamento operacional de 15%.
- [ ] Integrar PeerTube com orçamento operacional de 15%.
- [ ] Integrar Dailymotion com orçamento operacional de 15%.
- [ ] Integrar Vimeo com orçamento operacional de 15%.
- [ ] Implementar cards de filmes, séries, desenhos, esportes e música.

### Fase 6 — Modo Cinema e fallback

- [ ] Implementar Modo Cinema.
- [ ] Implementar cache inicial de aproximadamente 100 itens por ciclo.
- [ ] Implementar imagem com áudio próprio.
- [ ] Integrar biblioteca de áudios.
- [ ] Implementar rotação e deduplicação.

### Fase 7 — Testes e estabilização

- [ ] Testar renovação do rate limit.
- [ ] Testar bloqueio temporário de uma API.
- [ ] Testar cache sem novas chamadas externas.
- [ ] Testar múltiplos usuários consumindo o mesmo cache.
- [ ] Testar falhas da Mux.
- [ ] Testar vídeos acima e abaixo do limite X.
- [ ] Testar consumo do banco.
- [ ] Testar funcionamento offline e fallback.
- [ ] Atualizar este documento com os resultados.

---

## 18. Estimativa de tempo

Considerando o aproveitamento do frontend atual e das Edge Functions existentes do Neural-iA:

| Etapa | Estimativa aproximada |
|---|---:|
| Auditoria do repositório e fluxo atual | 1 a 2 dias |
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

A implementação será incremental. Cada fase deverá ser testada antes de iniciar a próxima.

---

## 19. Regras fundamentais

- [ ] Vídeos longos não devem ser armazenados diretamente no banco.
- [ ] O frontend não deve chamar APIs externas a cada rolagem.
- [ ] O cache deve ser consultado antes de novas chamadas.
- [ ] O rate limit será por aplicativo, não por usuário.
- [ ] Os limites de 15%, 25% e 70% devem ser convertidos em números reais.
- [ ] Nenhuma chave privada deve ser exposta.
- [ ] O OIO TOC CORE não faz parte desta implementação.
- [ ] O projeto Supabase de referência é o Neural-iA.
- [ ] Nenhuma alteração destrutiva deve ser feita no Neural-iA.
- [ ] O feed deve continuar funcionando mesmo quando uma API estiver bloqueada.
- [ ] Os usuários devem consumir somente o cache implantado pelo aplicativo.
- [ ] O mesmo conteúdo em cache deve poder ser consumido por muitos usuários sem multiplicar as chamadas às APIs.

---

## 20. Resultado esperado

O resultado será um aplicativo com sensação de conteúdo contínuo, mas com consumo governado:

- O **Neural-iA** ficará responsável por metadados, autenticação, controle, cache e Edge Functions.
- A **Mux** ficará responsável pelo processamento e entrega dos vídeos longos.
- As **APIs externas** fornecerão descoberta de conteúdo dentro de janelas controladas.
- O **frontend** exibirá o conteúdo disponível no cache.
- Os **usuários** não controlarão nem consumirão diretamente o rate limit das APIs.
- O banco permanecerá protegido contra armazenamento indiscriminado de vídeos e consultas excessivas.

---

## 21. Histórico de atualizações

| Data | Etapa | Alteração |
|---|---|---|
| 2026-09-14 | Documento inicial | Documento criado com arquitetura de Mux, cache, Modo Cinema e rate limit por aplicativo. |
| 2026-09-14 | Correção de escopo | Confirmado que o projeto de referência é o Neural-iA e que o OIO TOC CORE está fora do escopo. |
| 2026-09-14 | Correção do rate limit | Alterado de rate limit por usuário para rate limit global por aplicativo e por fonte. |

---

## Nota técnica final

Os percentuais de **15%**, **25%** e **70%** são metas operacionais iniciais. Antes da implementação definitiva, deverão ser convertidos em limites concretos com base nos limites oficiais de cada API, no plano e consumo do Neural-iA e na capacidade real da conta Mux.

Este documento deverá ser atualizado após cada etapa concluída, mantendo os itens concluídos marcados com `- [x]` e os itens pendentes com `- [ ]`.
