/**
 * Converte uma cor HEX para formato HSL usado pelo Tailwind
 * @param hex - Cor no formato #RRGGBB ou RRGGBB
 * @returns String no formato "H S% L%" para uso em CSS variables
 */
export function hexToHsl(hex: string): string {
  // Remove # se existir
  hex = hex.replace('#', '');
  
  // Validar formato
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return '210 60% 50%'; // Fallback para azul padrão
  }
  
  // Converter para RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Calcular HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  // Retornar no formato HSL para CSS
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Verifica se uma cor HEX é válida
 */
export function isValidHex(hex: string): boolean {
  return /^#?[0-9A-Fa-f]{6}$/.test(hex);
}

/**
 * Calcula o contraste relativo entre uma cor e branco
 * Retorna true se o contraste for aceitável para texto branco
 */
export function hasGoodContrastWithWhite(hex: string): boolean {
  hex = hex.replace('#', '');
  
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return true;
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Luminância relativa simplificada
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Se a luminância for menor que 0.6, o contraste com branco é bom
  return luminance < 0.6;
}
