# REDE-SOCIOLOCAL — Plano de Integração de Mídia, Cache e Controle de Consumo

> Documento de planejamento. A integração com Supabase ainda não foi implementada neste repositório.

- **Repositório:** `detiillimichel-max/REDE-SOCIOLOCAL`
- **Aplicação:** `https://detiillimichel-max.github.io/REDE-SOCIOLOCAL/?v6`
- **Supabase futuro:** `https://svqocghixhrpqaxucubn.supabase.co/`
- **Status:** planejamento; nenhuma integração Supabase declarada como concluída.

## Estado real atual

- [x] PWA publicado no GitHub Pages.
- [x] Feed local de fotos e vídeos.
- [x] Seleção de mídia pela galeria.
- [x] Captura de foto e vídeo pela câmera.
- [x] Cards de mídia no feed.
- [x] Reprodução de vídeos locais.
- [x] Ícones Lucide.
- [x] Módulo de engajamento separado.
- [x] Manifest e Service Worker.
- [x] Estrutura modular de CSS e JavaScript.
- [ ] Integrar o Supabase informado.
- [ ] Auditar e definir tabelas, autenticação, storage e regras RLS.
- [ ] Criar as integrações de APIs por Edge Functions, se necessário.
- [ ] Implementar cache centralizado.
- [ ] Implementar controle de consumo e rate limit.
- [ ] Definir e implementar o fluxo Mux, se aprovado.

## Regra de verdade

O repositório é atualmente um frontend PWA. O Supabase será integrado posteriormente. Nenhuma tabela, Edge Function, autenticação, cache ou fluxo Mux deve ser marcado como existente ou concluído sem validação no código e no projeto correto.

## Próximas etapas

1. Auditar o frontend atual sem reconstruí-lo.
2. Confirmar o projeto Supabase correto e suas credenciais públicas permitidas.
3. Definir a estrutura mínima de dados.
4. Integrar autenticação e persistência somente após aprovação.
5. Implementar cache e controle de consumo.
6. Testar cada etapa antes de avançar.
