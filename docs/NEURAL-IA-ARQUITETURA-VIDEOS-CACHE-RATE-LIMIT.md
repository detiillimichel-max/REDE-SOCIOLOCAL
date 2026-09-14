# REDE-SOCIOLOCAL — Plano de Integração de Mídia, Cache e Controle de Consumo

**Documento de planejamento — não representa funcionalidades já implementadas**

- **Repositório:** `detiillimichel-max/REDE-SOCIOLOCAL`
- **Aplicação:** `https://detiillimichel-max.github.io/REDE-SOCIOLOCAL/?v6`
- **Frontend atual:** PWA estático hospedado no GitHub Pages
- **Backend atual:** ainda não integrado
- **Supabase planejado:** `https://svqocghixhrpqaxucubn.supabase.co/`
- **Status da integração Supabase:** **não iniciada**
- **Escopo:** integração futura do Supabase, vídeos, Mux, cache, Modo Cinema e controle de consumo
- **Última atualização:** 2026-09-14

> **Correção fundamental:** o repositório `REDE-SOCIOLOCAL` **não possui Supabase integrado neste momento**. O Supabase informado acima será integrado futuramente. Nenhuma tabela, Edge Function, autenticação ou conexão do Supabase deve ser considerada existente no frontend atual.
>
> O projeto **OIO TOC CORE** não faz parte deste trabalho e não deve ser alterado.

---

## 1. Estado real do repositório

### Já existe no REDE-SOCIOLOCAL

- [x] Repositório criado e publicado.
- [x] PWA existente.
- [x] `index.html` com estrutura de feed.
- [x] Seleção de fotos pela galeria.
- [x] Seleção de vídeos pela galeria.
- [x] Captura de fotos pela câmera.
- [x] Captura de vídeos pela câmera.
- [x] Criação de cards de mídia no feed.
- [x] Reprodução de vídeos locais.
- [x] Biblioteca de ícones Lucide.
- [x] Módulo separado de engajamento.
- [x] Botões de curtir, não curtir, comentários e compartilhar.
- [x] `manifest.json`.
- [x] Service Worker `sw.js`.
- [x] Estrutura CSS e JavaScript modular já existente.

### Ainda não existe no repositório

- [ ] Integração com Supabase.
- [ ] Cliente Supabase configurado no frontend.
- [ ] Autenticação de usuários pelo Supabase.
- [ ] Tabelas do aplicativo no Supabase.
- [ ] Regras RLS do aplicativo.
- [ ] Edge Functions próprias para este projeto.
- [ ] Integração com Mux.
- [ ] Upload direto para Mux.
- [ ] Webhook de processamento de vídeos.
- [ ] Cache centralizado de conteúdo externo.
- [ ] Gateway de APIs externas.
- [ ] Rate limit implementado.
- [ ] Modo Cinema implementado.

**Regra de documentação:** somente itens realmente existentes e verificados no repositório podem receber `[x]`. Tudo que for integração futura permanece como `[ ]`.

---

## 2. Objetivo da próxima arquitetura

Evoluir o PWA existente sem reconstruí-lo, adicionando uma camada de dados e mídia com o Supabase informado pelo proprietário do projeto.

A arquitetura pretendida deverá permitir:

- publicar e armazenar metadados de fotos e vídeos;
- manter vídeos curtos no fluxo adequado ao frontend;
- encaminhar vídeos acima do limite definido para a Mux;
- consultar APIs externas de forma controlada;
- armazenar somente metadados e referências no banco;
- utilizar cache por aplicativo, não por usuário;
- evitar uma chamada externa a cada rolagem ou visualização;
- continuar exibindo conteúdo já armazenado quando uma fonte estiver em pausa.

---

## 3. Integração planejada com o Supabase

**Destino da integração:**

`https://svqocghixhrpqaxucubn.supabase.co/`

### Etapas ainda pendentes

- [ ] Confirmar o projeto Supabase correto e seu acesso administrativo.
- [ ] Auditar o projeto Supabase antes de criar qualquer tabela.
- [ ] Confirmar se já existem estruturas que podem ser reutilizadas.
- [ ] Criar as tabelas necessárias sem apagar estruturas existentes.
- [ ] Configurar variáveis públicas permitidas no frontend.
- [ ] Nunca colocar chave `service_role` no frontend ou no GitHub Pages.
- [ ] Configurar autenticação, caso seja necessária nesta fase.
- [ ] Configurar RLS para proteger dados privados.
- [ ] Criar as Edge Functions específicas do REDE-SOCIOLOCAL.
- [ ] Conectar o frontend ao Supabase somente após a auditoria.
- [ ] Testar leitura, gravação, autenticação e permissões.

> O Supabase será integrado ao REDE-SOCIOLOCAL. A integração não deve ser marcada como concluída antes de existir conexão funcional e validada no código.

---

## 4. Regra de duração dos vídeos

Será definido um limite configurável **X** para a duração dos vídeos. O valor de **2 minutos** é apenas uma hipótese inicial e ainda não é o valor oficial.

- [ ] Definir o valor oficial de X.
- [ ] Colocar X em uma configuração central.
- [ ] Identificar a duração antes do upload definitivo.
- [ ] Permitir alteração futura sem reescrever o aplicativo.

Regras planejadas:

- [ ] Vídeos com duração igual ou inferior a X seguem o fluxo de vídeos curtos.
- [ ] Vídeos com duração superior a X seguem o fluxo Mux.
- [ ] O banco não armazenará vídeo longo como Base64, blob ou arquivo bruto.
- [ ] O banco armazenará somente metadados e identificadores de reprodução.

---

## 5. Fluxo planejado para vídeos longos com Mux

1. [ ] O usuário seleciona ou grava um vídeo.
2. [ ] O aplicativo identifica a duração.
3. [ ] O aplicativo compara a duração com X.
4. [ ] Se estiver dentro de X, utiliza o fluxo de vídeo curto.
5. [ ] Se ultrapassar X, solicita uma URL de upload direto por uma Edge Function segura.
6. [ ] O arquivo é enviado diretamente para a Mux.
7. [ ] A Mux processa o vídeo.
8. [ ] Um webhook atualiza o status e os identificadores.
9. [ ] O feed utiliza o playback ID ou URL autorizada.

Metadados previstos:

- título;
- descrição;
- autor;
- duração;
- thumbnail;
- status;
- Mux asset ID;
- Mux playback ID;
- data de criação;
- data de atualização.

---

## 6. Controle de consumo do banco — margem operacional de 25%

A margem de **25%** será uma meta de segurança operacional para o consumo do banco e da infraestrutura. Não significa simplesmente permitir 25 chamadas.

O cálculo deverá considerar:

- leituras;
- escritas;
- armazenamento;
- largura de banda;
- consultas simultâneas;
- tamanho das respostas;
- limites reais do plano utilizado.

Etapas pendentes:

- [ ] Definir o orçamento operacional.
- [ ] Limitar leituras repetidas.
- [ ] Usar cache antes de consultar novamente.
- [ ] Evitar duplicação de conteúdo.
- [ ] Usar paginação.
- [ ] Selecionar somente as colunas necessárias.
- [ ] Agrupar eventos quando possível.
- [ ] Reduzir consultas não essenciais ao atingir o orçamento.
- [ ] Criar métricas e alertas de consumo.

---

## 7. Gateway e rate limit por aplicativo

O rate limit será aplicado ao **aplicativo como um todo**, e não individualmente por usuário.

O usuário final não deverá consultar diretamente as APIs externas. O frontend consumirá o conteúdo disponibilizado pelo cache e pelo gateway do aplicativo.

Responsabilidades planejadas:

- [ ] Validar autenticação quando necessário.
- [ ] Aplicar rate limit global do aplicativo.
- [ ] Aplicar controle separado por fonte.
- [ ] Consultar o cache antes de chamar uma API.
- [ ] Impedir chamadas ilimitadas vindas do frontend.
- [ ] Retornar cache válido quando uma API estiver indisponível.
- [ ] Registrar consumo e erros.
- [ ] Pausar uma fonte ao atingir seu orçamento.
- [ ] Controlar a renovação de cada janela.
- [ ] Evitar uma consulta externa por visualização.

Fluxo planejado:

```text
APIs externas
     ↓
Gateway / Edge Function do REDE-SOCIOLOCAL
     ↓
Rate limit global do aplicativo
     ↓
Cache centralizado
     ↓
Frontend PWA
     ↓
Usuários consomem o conteúdo disponível
```

---

## 8. Modo Cinema — cache por aplicativo

O Modo Cinema deverá apresentar uma sequência contínua de conteúdos sem consultar uma API a cada rolagem.

Ciclo planejado:

1. [ ] Verificar se existe cache válido.
2. [ ] Consultar fontes somente quando houver orçamento.
3. [ ] Buscar aproximadamente 100 itens por ciclo, conforme a capacidade da fonte.
4. [ ] Salvar apenas metadados, thumbnails, IDs e URLs de origem.
5. [ ] Exibir primeiro os itens já armazenados.
6. [ ] Não repetir a mesma consulta enquanto houver conteúdo válido.
7. [ ] Verificar a renovação quando o cache estiver próximo de acabar.
8. [ ] Alternar para outra fonte se a atual estiver bloqueada.

O número 100 é apenas uma referência inicial. O valor final dependerá da fonte, do cache e do consumo real.

---

## 9. APIs públicas — teto operacional de 70%

A meta inicial para APIs públicas será utilizar no máximo aproximadamente **70% do limite oficial disponível**, respeitando as regras de cada provedor.

Fontes que poderão ser avaliadas:

- [ ] Internet Archive.
- [ ] Open Library.
- [ ] Gutendex.
- [ ] Wikipedia.
- [ ] Wikimedia Commons.
- [ ] NASA.
- [ ] Crossref.
- [ ] OpenAlex.

Regras:

- [ ] Confirmar o limite real de cada fonte.
- [ ] Converter o percentual em quantidade por janela.
- [ ] Consultar somente com orçamento disponível.
- [ ] Salvar os resultados no cache.
- [ ] Pausar ao atingir o orçamento.
- [ ] Retomar após a renovação.

---

## 10. APIs privadas ou restritas — teto operacional de 15%

Para APIs privadas, restritas ou mais sensíveis, a meta inicial será utilizar aproximadamente **15% do limite disponível**.

Fontes que poderão ser avaliadas:

- [ ] YouTube.
- [ ] PeerTube, conforme a instância.
- [ ] Dailymotion.
- [ ] Vimeo.

A integração deverá respeitar:

- termos de uso;
- limites oficiais;
- regras de autenticação;
- permissões de reprodução;
- embeds autorizados;
- direitos e disponibilidade do conteúdo.

Após atingir o orçamento:

- [ ] pausar novas consultas;
- [ ] continuar exibindo o cache existente;
- [ ] não consultar novamente a cada visualização;
- [ ] aguardar a próxima janela;
- [ ] retomar somente após a liberação.

---

## 11. Modelo de janela e renovação

Cada fonte deverá possuir configurações semelhantes a:

- [ ] limite oficial;
- [ ] percentual operacional permitido;
- [ ] quantidade calculada por janela;
- [ ] quantidade consumida;
- [ ] início da janela;
- [ ] fim da janela;
- [ ] próxima renovação;
- [ ] intervalo mínimo entre chamadas;
- [ ] status da fonte.

Estados previstos:

- disponível;
- próximo do limite;
- pausado;
- aguardando renovação;
- indisponível;
- erro temporário.

---

## 12. Cards e experiência do usuário

Os cards externos deverão, quando os dados estiverem disponíveis, apresentar:

- [ ] thumbnail;
- [ ] título;
- [ ] categoria;
- [ ] duração;
- [ ] origem;
- [ ] ação de reprodução autorizada.

Ao tocar no card:

- [ ] abrir embed autorizado;
- [ ] abrir player permitido; ou
- [ ] abrir a página de origem.

O usuário não deverá visualizar os detalhes internos de rate limit. Quando não houver vídeo disponível, o feed poderá utilizar:

- [ ] conteúdo em cache;
- [ ] outra fonte disponível;
- [ ] publicação própria;
- [ ] imagem com áudio próprio;
- [ ] imagem estática como último fallback.

---

## 13. Ordem planejada de preenchimento do feed

1. [x] Publicações próprias já existentes.
2. [x] Vídeos próprios curtos, conforme o fluxo atual.
3. [ ] Vídeos longos processados pela Mux.
4. [ ] Conteúdos válidos do cache.
5. [ ] Conteúdos externos recém-consultados, somente com orçamento.
6. [ ] Imagens com áudio próprio.
7. [ ] Imagens estáticas como último fallback.

---

## 14. Cache e deduplicação

- [ ] Usar o identificador externo como chave de deduplicação.
- [ ] Não salvar novamente o mesmo item em cada renovação.
- [ ] Registrar a data de coleta.
- [ ] Registrar a data de expiração.
- [ ] Atualizar metadados sem duplicar o conteúdo.
- [ ] Remover ou marcar itens expirados sem quebrar o feed.
- [ ] Manter cache antigo válido quando uma fonte estiver temporariamente bloqueada.

---

## 15. Segurança

- [ ] Não colocar chaves privadas no frontend.
- [ ] Não colocar `service_role` no GitHub Pages.
- [ ] Usar Edge Functions para operações que exigem segredo.
- [ ] Validar URLs de reprodução e upload.
- [ ] Validar tamanho e tipo dos arquivos.
- [ ] Aplicar limites de upload.
- [ ] Aplicar RLS nas tabelas privadas.
- [ ] Não permitir que o frontend altere diretamente contadores de consumo.
- [ ] Registrar erros sem expor segredos.

---

## 16. Fases de implementação

### Fase 1 — Auditoria

- [ ] Auditar todos os arquivos atuais.
- [ ] Identificar como o feed é montado.
- [ ] Identificar como fotos e vídeos são armazenados hoje.
- [ ] Não alterar o UX existente sem necessidade.

### Fase 2 — Integração Supabase

- [ ] Confirmar o projeto `svqocghixhrpqaxucubn.supabase.co`.
- [ ] Criar a estrutura mínima necessária.
- [ ] Configurar autenticação e RLS, se aplicável.
- [ ] Conectar o frontend.
- [ ] Testar leitura e gravação.

### Fase 3 — Mídia e Mux

- [ ] Definir X.
- [ ] Detectar duração.
- [ ] Implementar upload direto.
- [ ] Implementar processamento e webhook.
- [ ] Exibir vídeos prontos no feed.

### Fase 4 — Cache e APIs

- [ ] Criar gateway.
- [ ] Criar cache por aplicativo.
- [ ] Criar rate limit por fonte e janela.
- [ ] Integrar primeiro APIs públicas.
- [ ] Integrar depois APIs privadas ou restritas.

### Fase 5 — Modo Cinema e fallback

- [ ] Criar carregamento contínuo do cache.
- [ ] Criar deduplicação.
- [ ] Criar cards externos.
- [ ] Criar imagem com áudio próprio.
- [ ] Criar fallback para imagem estática.

### Fase 6 — Testes

- [ ] Testar upload curto.
- [ ] Testar upload acima de X.
- [ ] Testar falha de upload.
- [ ] Testar renovação de janela.
- [ ] Testar cache cheio e cache vazio.
- [ ] Testar API indisponível.
- [ ] Testar duplicação.
- [ ] Testar segurança e permissões.

---

## 17. Estimativa preliminar

A estimativa somente poderá ser refinada depois da auditoria real do código e da confirmação do projeto Supabase.

- Auditoria do frontend: 1–2 dias.
- Integração inicial do Supabase: 1–3 dias.
- Limite X e fluxo de mídia: 1–2 dias.
- Integração Mux: 2–5 dias.
- Cache e rate limit: 2–5 dias.
- APIs públicas: 2–4 dias.
- APIs privadas ou restritas: 2–4 dias.
- Cards e fallback: 2–4 dias.
- Testes: 2–3 dias.

Esses prazos são apenas referências de planejamento, não uma promessa de entrega.

---

## 18. Regras fundamentais

1. O projeto principal é o **REDE-SOCIOLOCAL**.
2. O frontend atual será aproveitado; não haverá reconstrução desnecessária.
3. O Supabase ainda será integrado.
4. A URL planejada do Supabase é `https://svqocghixhrpqaxucubn.supabase.co/`.
5. Nenhuma tabela ou Edge Function deve ser declarada como existente sem verificação.
6. O rate limit será por aplicativo, por fonte e por janela.
7. O cache será centralizado por aplicativo, não por usuário.
8. O usuário final consumirá o cache, não consultará diretamente as APIs externas.
9. Vídeos longos não serão armazenados como Base64 no banco.
10. O projeto OIO TOC CORE está fora do escopo.
11. Nenhuma etapa futura deve ser marcada como concluída antes de ser implementada e testada.

---

## Histórico de correções

### 2026-09-14 — Correção de escopo

- Removida a afirmação incorreta de que o REDE-SOCIOLOCAL já possuía Supabase integrado.
- Alterado o status do Supabase para **integração planejada / não iniciada**.
- Separado o frontend existente das funcionalidades futuras.
- Mantida a URL do Supabase como destino planejado da integração.
- Reforçado que o OIO TOC CORE não faz parte deste projeto.
- Corrigidas as marcações `[x]` e `[ ]` para não apresentar arquitetura futura como funcionalidade existente.
