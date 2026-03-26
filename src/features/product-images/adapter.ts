import { toSlug } from '../../lib/utils'

function svgDataUrl(title: string, bg: string, fg: string) {
  const text = title.slice(0, 2).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180"><rect width="240" height="180" rx="18" fill="${bg}"/><circle cx="186" cy="52" r="28" fill="${fg}" opacity="0.18"/><text x="24" y="104" font-family="Verdana, sans-serif" font-size="56" font-weight="700" fill="${fg}">${text}</text><text x="24" y="146" font-family="Verdana, sans-serif" font-size="16" fill="${fg}" opacity="0.78">${title}</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const presets: Record<string, string> = {
  'arroz-tipo-1-5kg': svgDataUrl('Arroz', '#f5ead5', '#855f1d'),
  'feijao-carioca-1kg': svgDataUrl('Feijao', '#f7ddcf', '#8a3f1f'),
  'oleo-de-soja-900ml': svgDataUrl('Oleo', '#fff4c6', '#8a6b05'),
  'macarrao-espaguete-500g': svgDataUrl('Macarrao', '#fce7c7', '#a15f00'),
}

export interface ProductImageAdapter {
  getImage(description: string, code?: string): Promise<string | null>
}

export const mockProductImageAdapter: ProductImageAdapter = {
  async getImage(description, code) {
    const key = toSlug(description)
    if (presets[key]) {
      return presets[key]
    }
    if (code) {
      return svgDataUrl(code, '#dce9f8', '#244a72')
    }
    return svgDataUrl(description, '#e9efe5', '#305437')
  },
}
