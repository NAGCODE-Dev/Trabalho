import { describe, expect, it } from 'vitest'
import { normalizeOCRTextToRows } from './ocr-text'
import { parseOrderLine } from './parser'
import { buildScanStructureProfile } from './structure'

describe('parseOrderLine', () => {
  it('parseia linha delimitada por ponto e vírgula', () => {
    const result = parseOrderLine('Arroz 5kg;7891001;FD;3;25,90;77,70', 'page-1')
    expect(result.item?.description).toBe('Arroz 5kg')
    expect(result.item?.code).toBe('7891001')
    expect(result.item?.quantity).toBe(3)
    expect(result.item?.totalPrice).toBe(77.7)
  })

  it('marca linha inválida quando faltam colunas', () => {
    const result = parseOrderLine('Linha incompleta;123', 'page-1')
    expect(result.issue?.severity).toBe('error')
  })
})

describe('normalizeOCRTextToRows', () => {
  it('extrai linhas estruturadas de OCR por espaços múltiplos', () => {
    const raw = 'Arroz Tipo 1 5kg  7891001  FD  3  25,90  77,70'
    const result = normalizeOCRTextToRows(raw)
    expect(result.extractedRows).toEqual(['Arroz Tipo 1 5kg;7891001;FD;3;25,90;77,70'])
    expect(result.uncertainRows).toHaveLength(0)
  })

  it('envia linha suspeita para revisão humana', () => {
    const raw = 'Cafe Especial 7898008 XX 5 13,4O 67,00'
    const result = normalizeOCRTextToRows(raw)
    expect(result.extractedRows).toHaveLength(0)
    expect(result.uncertainRows).toHaveLength(1)
  })

  it('ignora cabeçalho do bling e extrai linha útil', () => {
    const raw = `Descricao Codigo Un Qtd Vl unitario Vl total
Arroz Tipo 1 5kg  7891001  FD  3  25,90  77,70
Pagina 1`
    const result = normalizeOCRTextToRows(raw)
    expect(result.extractedRows).toEqual(['Arroz Tipo 1 5kg;7891001;FD;3;25,90;77,70'])
    expect(result.uncertainRows).toHaveLength(0)
  })

  it('reconstrói item quando descricao e detalhes vêm em linhas separadas', () => {
    const raw = `Macarrao Espaguete 500g
7894004 FD 12 4,80 57,60`
    const result = normalizeOCRTextToRows(raw)
    expect(result.extractedRows).toEqual(['Macarrao Espaguete 500g;7894004;FD;12;4,80;57,60'])
  })

  it('aceita linha com R$ e colunas irregulares de pdf', () => {
    const raw = 'Molho de Tomate Tradicional 300g | 7895005 | CX | 4 | R$ 19,90 | R$ 79,60'
    const result = normalizeOCRTextToRows(raw)
    expect(result.extractedRows).toEqual(['Molho de Tomate Tradicional 300g;7895005;CX;4;19,90;79,60'])
  })

  it('corrige erros comuns de OCR em campos numéricos', () => {
    const raw = 'Cafe Torrado 500g 7898008 UN 5 13,4O 67,0O'
    const result = normalizeOCRTextToRows(raw)
    expect(result.extractedRows).toEqual(['Cafe Torrado 500g;7898008;UN;5;13,40;67,00'])
  })

  it('aceita linha com rótulos do layout exportado', () => {
    const raw = 'Feijao Carioca 1kg Cód 7892002 Un UN Qtd 8 Vl Unit 8,50 Vl Total 68,00'
    const result = normalizeOCRTextToRows(raw)
    expect(result.extractedRows).toEqual(['Feijao Carioca 1kg;7892002;UN;8;8,50;68,00'])
  })

  it('ignora linhas de totalização do pdf e extrai só itens', () => {
    const raw = `Total do pedido 1.254,90
Oleo de Soja 900ml 7893003 CX 2 71,90 143,80
Valor total 143,80`
    const result = normalizeOCRTextToRows(raw)
    expect(result.extractedRows).toEqual(['Oleo de Soja 900ml;7893003;CX;2;71,90;143,80'])
    expect(result.uncertainRows).toHaveLength(0)
  })

  it.each([
    ['numeric curtos', 'Arroz 5kg 7891001 FD 3 25,90 77,70', 'Arroz 5kg;7891001;FD;3;25,90;77,70'],
    ['ean 13', 'Leite Integral 7891234567890 CX 2 6,99 13,98', 'Leite Integral;7891234567890;CX;2;6,99;13,98'],
    ['alfanumérico', 'Molho Especial ABC-1234 CX 4 19,90 79,60', 'Molho Especial;ABC-1234;CX;4;19,90;79,60'],
    ['sku com barra', 'Tempero Verde SKU/AB-99 UN 5 3,20 16,00', 'Tempero Verde;SKU/AB-99;UN;5;3,20;16,00'],
    ['código pontuado', 'Biscoito 01.234.567/89 PCT 3 7,50 22,50', 'Biscoito;01.234.567/89;PCT;3;7,50;22,50'],
  ])('aceita códigos %s', (_label, raw, expected) => {
    const result = normalizeOCRTextToRows(raw)
    expect(result.extractedRows).toEqual([expected])
  })

  it('suporta carga alta de linhas sem perder extrações válidas', () => {
    const raw = Array.from({ length: 250 }, (_, index) => {
      const code = `7891${String(index).padStart(4, '0')}`
      return `Produto Teste ${index} ${code} UN 2 10,00 20,00`
    }).join('\n')

    const result = normalizeOCRTextToRows(raw)
    expect(result.extractedRows).toHaveLength(250)
    expect(result.uncertainRows).toHaveLength(0)
  })
})

describe('buildScanStructureProfile', () => {
  it('guarda apenas estrutura anonimizada do scan', () => {
    const profile = buildScanStructureProfile({
      rawText: 'Feijao Carioca 1kg Cód 7892002 Un UN Qtd 8 Vl Unit 8,50 Vl Total 68,00',
      extractedRows: ['Feijao Carioca 1kg;7892002;UN;8;8,50;68,00'],
      uncertainRows: [],
      sourceEngine: 'tesseract.js',
    })

    expect(profile.sourceEngine).toBe('tesseract.js')
    expect(profile.detectedLabels).toContain('codigo')
    expect(profile.codePatternKinds.length).toBeGreaterThan(0)
    expect(profile.lineShapes[0]).not.toContain('Feijao')
  })
})
