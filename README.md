# Separação e Conferência de Pedidos

MVP funcional de uma aplicação web mobile-first para separação e conferência de pedidos em estoque, com OCR real no navegador, captura por câmera, checklist operacional, histórico mínimo de rupturas, testes automatizados e retenção mínima de dados.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Dexie + IndexedDB
- Tesseract.js
- Vitest + Testing Library
- Service Worker + Web App Manifest

## O que o MVP entrega

- Fluxo principal por múltiplas imagens/páginas do pedido
- Captura por câmera traseira no celular
- OCR real no navegador via `tesseract.js`, com fallback mockado quando necessário
- Pré-processamento local da imagem antes do OCR para melhorar contraste e leitura
- Memória estrutural anonimizada do scan, sem guardar conteúdo bruto do OCR fora do pedido em andamento
- Camada de OCR via adapter, parser, normalizador e validador
- Revisão obrigatória do OCR antes de liberar a separação
- Checklist operacional com status:
  - `Pendente`
  - `Separado completo`
  - `Falta parcial`
  - `Em falta total`
- Recalculo financeiro por linha e do pedido inteiro
- Busca, filtros e ordenação por criticidade
- Banner fixo de pendências
- Revisão final com dupla confirmação
- Persistência local do pedido em andamento
- Limpeza automática do pedido concluído
- Histórico mínimo local apenas para faltas totais e parciais
- Recurso auxiliar de imagem de apoio do produto por adapter
- Importação por texto como fluxo de backup
- Dados demo com múltiplas páginas, OCR incompleto e histórico de faltas
- PWA instalável com cache offline básico do app shell
- Testes automatizados para parser, persistência e recálculo financeiro
- Cobertura de parser para múltiplos formatos de código: numérico, EAN, alfanumérico, SKU e códigos com separadores

## Estrutura

```text
src/
  components/
    ui/
  data/
  features/
    items/
    orders/
    product-images/
    scanner/
    shortage-history/
  hooks/
  lib/
```

## Rodando localmente

### Requisitos

- Node.js 18+
- npm 9+

### Comandos

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

Rodar testes:

```bash
npm run test:run
```

## Fluxo principal

1. Criar ou abrir um pedido.
2. Adicionar uma ou várias fotos/páginas.
3. Rodar OCR real no navegador.
4. Revisar itens reconhecidos e trechos suspeitos.
5. Gerar checklist operacional.
6. Conferir item a item no celular.
7. Revisar pendentes, faltas parciais e faltas totais.
8. Confirmar conclusão.
9. Confirmar novamente a liberação da próxima lista.
10. Remover do dispositivo os dados completos do pedido, preservando apenas o histórico mínimo de faltas.

## Persistência e retenção mínima

- Pedido em andamento: salvo em `IndexedDB`
- Histórico mínimo de faltas: salvo em `IndexedDB`
- Pedido concluído:
  - checklist detalhado removido
  - páginas/imagens removidas
  - dados completos do pedido removidos
  - mantidos apenas registros mínimos de falta total/parcial

## Arquitetura

### OCR

- `src/features/scanner/adapters.ts`
- `src/features/scanner/preprocess.ts`
- `src/features/scanner/parser.ts`
- `src/features/scanner/normalizer.ts`
- `src/features/scanner/validator.ts`

Hoje o app usa `tesseract.js` no navegador, com pré-processamento local da imagem antes da leitura, e faz fallback para OCR mockado se o motor real falhar. O parser também já tolera melhor variações frequentes de layout do Bling e PDFs com colunas irregulares. A troca para API externa ou software de scanner continua concentrada no adapter.

### Imagem de apoio

- `src/features/product-images/adapter.ts`

Hoje usa imagens mockadas em `data:image/svg+xml`. A interface já está pronta para trocar por cadastro interno ou busca externa futura.

### Persistência

- `src/lib/db.ts`
- `src/hooks/usePersistentOrdersApp.ts`

Dexie organiza duas camadas:

- pedido em andamento
- histórico mínimo de faltas

### PWA

- `public/manifest.webmanifest`
- `public/sw.js`
- `src/main.tsx`

O app registra `service worker`, publica manifesto instalável e mantém cache offline básico do shell da aplicação.

### Testes

- `src/features/scanner/parser.test.ts`
- `src/features/orders/utils.test.ts`
- `src/lib/db.test.ts`

## Decisões técnicas principais

- `IndexedDB` foi escolhido em vez de `localStorage` para reduzir risco de perda do pedido em andamento e suportar melhor metadados de páginas.
- A integração OCR real roda no próprio navegador para manter o MVP sem backend.
- Todo item entra em `pendente` e nunca some silenciosamente da interface.
- Filtros sempre mostram `exibindo X de Y itens`.
- A revisão do OCR é etapa obrigatória.
- A conclusão é bloqueada enquanto houver pendentes.
- A falta parcial é tratada como estado próprio, com quantidade e valor recalculados.
- O histórico local preserva somente o necessário para alertas operacionais futuros.
- O PWA foi implementado manualmente para evitar dependências incompatíveis com o runtime atual do projeto.

## Próximos passos recomendados

1. Adicionar recorte automático e correção de perspectiva antes do OCR.
2. Expandir ainda mais o parser para layouts reais adicionais do Bling coletados em produção.
3. Expandir o cache offline para assets e telas críticas com estratégia mais refinada.
4. Adicionar auditoria local opcional de alterações por item.
5. Cobrir fluxos de UI e conclusão com testes de integração.
6. Permitir escolha entre OCR local, OCR por API e scanner dedicado nas configurações.
