# 📱 REDE-SOCIOLOCAL — Plano de Implementação Neural-iA

**Repositório:** `detiillimichel-max/REDE-SOCIOLOCAL`  
**Publicação:** `https://detiillimichel-max.github.io/REDE-SOCIOLOCAL/?v6`  
**Projeto Supabase:** **Neural-iA**  
**URL informada:** `https://svqocghixhrpqaxucubn.supabase.co/`

> Documento vivo do projeto. A cada etapa concluída, este arquivo deve ser atualizado.
>
> **Importante:** o **OIO TOC CORE não faz parte desta arquitetura**. O banco e as Edge Functions de referência desta proposta são do **Neural-iA**.

## Legenda do checklist

- `🔳➕✔️` = já existente/feito e mantido no documento como marco.
- `🔳` = ainda precisa ser feito.
- Os símbolos são **somente documentação**. Eles não representam componentes de interface do aplicativo.

---

# 1. O que já existe ✅

## Frontend atual

- 🔳➕✔️ PWA existente no repositório `REDE-SOCIOLOCAL`.
- 🔳➕✔️ `index.html` com estrutura de feed.
- 🔳➕✔️ Seleção de fotos pela galeria.
- 🔳➕✔️ Seleção de vídeos pela galeria.
- 🔳➕✔️ Captura de foto pela câmera.
- 🔳➕✔️ Captura de vídeo pela câmera.
- 🔳➕✔️ Criação de cards de mídia no feed.
- 🔳➕✔️ Reprodução de vídeos locais.
- 🔳➕✔️ Ícones Lucide.
- 🔳➕✔️ Módulo separado de engajamento.
- 🔳➕✔️ Botões de curtir, não curtir, comentários e compartilhar.
- 🔳➕✔️ PWA com `manifest.json`.
- 🔳➕✔️ Service Worker `sw.js`.
- 🔳➕✔️ Estrutura CSS e JS modular já existente.

O README atual descreve o aplicativo como um PWA de feed privado de fotos e vídeos locais, com suporte offline e reprodução local. `index.html` já conecta `app.js` e `engajamento.js`. O `app.js` cria os cards de mídia e o módulo de engajamento trata as interações. 

## Backend / Supabase

- 🔳➕✔️ Projeto Supabase de referência: **Neural-iA**.
- 🔳➕✔️ Edge Functions existentes no Neural-iA podem ser reaproveitadas.
- 🔳➕✔️ APIs externas já catalogadas no Neural-iA podem ser utilizadas como fontes, sem recriar a infraestrutura já existente.
- 🔳➕✔️ O frontend e o Supabase existentes são a base do trabalho.

---

# 2. Objetivo da nova arquitetura

Criar uma camada de mídia e descoberta que permita ao aplicativo ter uma sensação de conteúdo praticamente contínuo, mantendo o consumo controlado.

A regra principal é:

```text
APIs externas
    ↓
Edge Functions Neural-iA
    ↓
Rate limit por APP
    ↓
Cache do aplicativo
    ↓
Frontend REDE-SOCIOLOCAL
    ↓
Usuário somente consome o cache
```

## Regra fundamental do rate limit

O rate limit **não é por usuário**.

É **por aplicativo/fonte**.

O usuário não dispara uma nova consulta à API externa apenas porque abriu um card ou rolou o feed. Ele recebe os conteúdos que o aplicativo já colocou no cache.

Isso permite que muitos usuários consumam o mesmo conjunto de conteúdos sem multiplicar proporcionalmente as chamadas às APIs externas.

---

# 3. Regra de duração dos vídeos

- 🔳➕✔️ Ideia definida: existe um limite `X` de duração.
- 🔳➕✔️ Exemplo inicial de projeto: `X = 2 minutos`.
- 🔳 Vídeos com duração `<= X` seguem o fluxo de vídeo curto.
- 🔳 Vídeos com duração `> X` serão encaminhados para a **Mux**.
- 🔳 O banco não deverá armazenar vídeo longo como Base64/blob/arquivo bruto.
- 🔳 O banco deverá armazenar metadados e referências de reprodução.

> O valor X é configurável. Os 2 minutos são um exemplo inicial, não uma decisão irreversível.

---

# 4. Fluxo de vídeos longos com Mux

- 🔳 Detectar a duração do vídeo antes do envio definitivo.
- 🔳 Se `duração <= X`, seguir fluxo de vídeo curto.
- 🔳 Se `duração > X`, solicitar por Edge Function uma URL de upload direto para a Mux.
- 🔳 Enviar o arquivo pesado diretamente para a Mux.
- 🔳 Evitar passar o arquivo longo pelo banco.
- 🔳 Receber o resultado/processamento da Mux.
- 🔳 Salvar no Neural-iA somente os metadados necessários.
- 🔳 Guardar `asset_id`, `playback_id` e status quando aplicável.
- 🔳 Atualizar o status por webhook seguro da Mux.
- 🔳 Exibir no feed usando a reprodução da Mux.

---

# 5. Controle de consumo do banco Neural-iA

## Objetivo de 25%

A referência de **25%** é uma margem operacional de segurança para o consumo do banco/infraestrutura. Não significa “25 requisições”. O limite real deverá considerar o plano e o consumo efetivo do Neural-iA.

- 🔳 Definir orçamento operacional de banco.
- 🔳 Medir leituras e escritas.
- 🔳 Evitar gravações repetidas do mesmo conteúdo externo.
- 🔳 Usar cache antes de novas consultas.
- 🔳 Limitar paginação e quantidade de itens retornados.
- 🔳 Evitar salvar eventos individualmente quando puderem ser agregados.
- 🔳 Criar mecanismo de proteção quando o orçamento estiver próximo do limite.

---

# 6. Edge Function de proteção do Neural-iA

A Edge Function de proteção é **do aplicativo**, não de cada usuário.

- 🔳 Criar/adaptar uma Edge Function gateway para o feed.
- 🔳 Aplicar rate limit por fonte/API e por janela.
- 🔳 Verificar cache antes de fazer nova consulta externa.
- 🔳 Controlar orçamento de cada API.
- 🔳 Impedir consultas repetitivas do frontend.
- 🔳 Retornar cache existente quando a API estiver em pausa.
- 🔳 Controlar a renovação da janela de consumo.
- 🔳 Registrar somente as métricas necessárias.

### Princípio

```text
Usuário → pede conteúdo
       → recebe cache
       → NÃO consulta diretamente a API

Aplicativo → verifica orçamento
           → consulta API somente quando autorizado
           → atualiza cache
```

---

# 7. Modo Cinema — cache

O **Modo Cinema** é a camada que transforma consultas controladas em uma experiência contínua para o usuário.

## Ciclo inicial

- 🔳 Definir lote inicial de aproximadamente **100 vídeos/itens** para o cache.
- 🔳 Salvar somente os dados necessários: ID externo, título, categoria, thumbnail, URL/origem, duração e expiração.
- 🔳 Exibir o conteúdo do cache no feed.
- 🔳 Não consultar a API a cada abertura de card.
- 🔳 Não consultar a API a cada usuário.
- 🔳 Renovar o cache somente quando permitido pela janela de rate limit.
- 🔳 Evitar duplicatas.
- 🔳 Alternar para outra fonte quando uma fonte estiver bloqueada.

### Comportamento esperado

```text
100 conteúdos no cache
      ↓
usuários consomem
      ↓
sem novas chamadas externas
      ↓
cache chega ao nível de renovação
      ↓
verificar rate limit
      ↓
renovou? → buscar novo lote
não renovou? → manter/usar cache disponível
```

---

# 8. APIs públicas — meta de 70%

A meta operacional inicial para APIs públicas é usar até aproximadamente **70% do limite disponível**, preservando margem para segurança e variações.

Fontes previstas:

- 🔳 Internet Archive
- 🔳 Open Library
- 🔳 Gutendex
- 🔳 Wikipedia
- 🔳 Wikimedia Commons
- 🔳 NASA
- 🔳 Crossref
- 🔳 OpenAlex

### Regra

O percentual não deve ser tratado como número fixo universal. Cada API terá sua própria configuração de limite, janela, TTL e renovação.

---

# 9. APIs privadas/restritas — meta de 15%

As APIs mais sensíveis ou restritas terão utilização conservadora de aproximadamente **15% do limite disponível**.

Fontes previstas:

- 🔳 YouTube
- 🔳 PeerTube, respeitando o limite de cada instância
- 🔳 Dailymotion
- 🔳 Vimeo

### Regra

Quando a cota operacional da fonte for atingida:

```text
consulta externa → PAUSA
cache existente  → CONTINUA
nova consulta    → somente após renovação
```

---

# 10. Categorias dos cards externos

Os conteúdos das fontes externas poderão aparecer como:

- 🔳 Filmes
- 🔳 Séries
- 🔳 Desenhos
- 🔳 Esportes
- 🔳 Música
- 🔳 Áudio visual
- 🔳 Outras categorias compatíveis com as fontes disponíveis

Ao tocar em um card:

- 🔳 Abrir o conteúdo por player/embed autorizado ou página de origem.
- 🔳 Respeitar as regras do provedor.
- 🔳 Aceitar que alguns conteúdos possam expirar, ser removidos ou exigir abertura externa.

---

# 11. Fallback de conteúdo

Quando não houver vídeo apropriado, o feed deverá continuar funcionando.

Prioridade:

1. 🔳➕✔️ Publicações locais existentes.
2. 🔳 Vídeos locais curtos.
3. 🔳 Vídeos longos pela Mux.
4. 🔳 Conteúdo do cache.
5. 🔳 Conteúdo externo recém-consultado quando houver orçamento.
6. 🔳 Imagem + áudio próprio.
7. 🔳 Imagem sem áudio.

### Áudios próprios

- 🔳 Preparar biblioteca inicial de aproximadamente 15 áudios próprios.
- 🔳 Permitir associação entre imagem e faixa.
- 🔳 Evitar chamadas externas para tocar esses áudios.
- 🔳 Permitir expansão posterior da biblioteca.

---

# 12. Cache e deduplicação

- 🔳 Usar identificador externo como chave de deduplicação.
- 🔳 Não inserir o mesmo item novamente a cada renovação.
- 🔳 Guardar data de coleta.
- 🔳 Guardar data de expiração/TTL.
- 🔳 Guardar origem do item.
- 🔳 Definir quantidade máxima por fonte.
- 🔳 Remover/arquivar itens antigos de modo controlado.
- 🔳 Separar cache de descoberta do histórico de interação do usuário.

---

# 13. Rate limit do aplicativo

## Modelo simples

Cada fonte possui:

- 🔳 Limite oficial conhecido.
- 🔳 Percentual operacional.
- 🔳 Quantidade máxima por janela.
- 🔳 Quantidade consumida.
- 🔳 Início da janela.
- 🔳 Próxima renovação.
- 🔳 Status da fonte.

### Estados

- 🔳 `AVAILABLE`
- 🔳 `NEAR_LIMIT`
- 🔳 `PAUSED`
- 🔳 `RENEWED`
- 🔳 `ERROR`

---

# 14. Segurança

- 🔳 Manter chaves Mux/API somente no backend/Edge Functions.
- 🔳 Nunca expor service-role/secret key no frontend.
- 🔳 Validar autenticação nas operações protegidas.
- 🔳 Validar upload por tipo/tamanho/duração.
- 🔳 Validar webhooks da Mux.
- 🔳 Evitar acesso direto do frontend às APIs privadas quando a arquitetura exigir gateway.

---

# 15. Observabilidade

- 🔳 Medir chamadas por fonte.
- 🔳 Medir cache hit.
- 🔳 Medir cache miss.
- 🔳 Medir itens coletados.
- 🔳 Medir erros 401/403/429/5xx.
- 🔳 Medir tempo de resposta.
- 🔳 Medir renovação das janelas.
- 🔳 Medir consumo do banco.
- 🔳 Medir uploads e processamento Mux.

---

# 16. Fases de implementação

## Fase 1 — Auditoria e base

- 🔳 Auditar o frontend atual completo.
- 🔳 Auditar as Edge Functions relevantes do Neural-iA.
- 🔳 Mapear as tabelas já existentes.
- 🔳 Definir exatamente onde o cache ficará.
- 🔳 Confirmar o limite X.

## Fase 2 — Mux

- 🔳 Implementar decisão de duração.
- 🔳 Criar/adaptar upload direto para Mux.
- 🔳 Implementar status de processamento.
- 🔳 Implementar webhook.
- 🔳 Testar reprodução.

## Fase 3 — Cache

- 🔳 Criar camada de cache por aplicativo.
- 🔳 Criar deduplicação.
- 🔳 Criar TTL e expiração.
- 🔳 Criar lote de aproximadamente 100 itens.

## Fase 4 — Rate limit

- 🔳 Implementar orçamento por fonte.
- 🔳 Implementar meta de 15% para APIs privadas.
- 🔳 Implementar meta de 70% para APIs públicas.
- 🔳 Implementar pausa até renovação.
- 🔳 Implementar fallback durante pausa.

## Fase 5 — APIs públicas

- 🔳 Internet Archive
- 🔳 Open Library
- 🔳 Gutendex
- 🔳 Wikipedia
- 🔳 Wikimedia Commons
- 🔳 NASA
- 🔳 Crossref
- 🔳 OpenAlex

## Fase 6 — APIs privadas/restritas

- 🔳 YouTube
- 🔳 PeerTube
- 🔳 Dailymotion
- 🔳 Vimeo

## Fase 7 — Modo Cinema

- 🔳 Criar cards de categorias.
- 🔳 Integrar reprodução/embeds autorizados.
- 🔳 Fazer renovação do cache sem travar o feed.
- 🔳 Implementar fallback de imagem + áudio.
- 🔳 Refinar UX sem quebrar o feed atual.

## Fase 8 — Integração final e testes

- 🔳 Teste de carga do cache.
- 🔳 Teste de rate limit.
- 🔳 Teste de renovação.
- 🔳 Teste com APIs indisponíveis.
- 🔳 Teste com cache vazio.
- 🔳 Teste com vídeo acima de X.
- 🔳 Teste de segurança.
- 🔳 Teste PWA/offline.

---

# 17. Regras que não podem ser quebradas

- 🔳 Não armazenar vídeos longos diretamente no banco.
- 🔳 Não chamar API externa a cada scroll.
- 🔳 Não chamar API externa por usuário.
- 🔳 Não usar o usuário como unidade de rate limit.
- 🔳 Não expor secrets no frontend.
- 🔳 Não ignorar limites oficiais das APIs.
- 🔳 Não confundir Neural-iA com OIO TOC CORE.
- 🔳 Não alterar estruturas existentes do Neural-iA sem auditoria.
- 🔳 Não destruir o frontend atual.
- 🔳 Não substituir recursos existentes sem necessidade.
- 🔳 Priorizar mudanças incrementais e reversíveis.

---

# 18. Estimativa de implementação

Estimativa inicial, condicionada à auditoria do código atual:

| Etapa | Estimativa |
|---|---:|
| Auditoria e arquitetura | 1–2 dias |
| Fluxo Mux | 1–3 dias |
| Cache | 2–4 dias |
| Edge Function/rate limit | 1–3 dias |
| APIs públicas | 2–4 dias |
| APIs privadas | 2–4 dias |
| Modo Cinema + fallback | 2–4 dias |
| Testes e ajustes | 2–3 dias |

**MVP:** aproximadamente 10–15 dias de trabalho.  
**Versão refinada:** aproximadamente 3–4 semanas.

Esses números são estimativas de engenharia, não prazos garantidos.

---

# 19. Estado atual deste documento

**Status:** 🟡 Planejamento aprovado / implementação pendente.

**Base existente:** frontend e projeto Supabase já disponíveis.

**Próxima etapa:** auditoria técnica do frontend + mapeamento das Edge Functions/tabelas do Neural-iA antes de qualquer alteração estrutural.

**Regra de atualização:** quando uma etapa for realmente concluída e testada, trocar o respectivo `🔳` por `🔳➕✔️` e registrar abaixo o que foi feito.

---

# 20. Registro de alterações

### v1.0
- Documento inicial criado no repositório.
- Rate limit definido como **por aplicativo/fonte**, não por usuário.
- Neural-iA definido como Supabase de referência.
- OIO TOC CORE explicitamente excluído desta arquitetura.
- Mux, cache, Modo Cinema, APIs públicas/privadas e fallback documentados.

### Próximas versões
- Registrar cada etapa implementada aqui antes de avançar para a próxima fase.
