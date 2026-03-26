export interface OCRRawPageResult {
  pageId: string
  extractedRows: string[]
  uncertainRows: string[]
  warnings: string[]
  rawText?: string
  engine?: string
}

export interface OCRAdapter {
  name: string
  processPage(page: { id: string; name: string; pageNumber: number; imageUrl?: string }): Promise<OCRRawPageResult>
}
