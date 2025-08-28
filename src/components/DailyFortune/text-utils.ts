// Utility functions for dynamic text sizing based on content length
// More aggressive sizing to better fill available space

export const getDynamicTitleSize = (text: string): string => {
  const length = text.length
  
  if (length <= 15) return 'text-4xl'      // Very short titles - use more space
  if (length <= 25) return 'text-3xl'      // Short titles
  if (length <= 40) return 'text-2xl'      // Medium titles  
  if (length <= 55) return 'text-xl'       // Long titles
  if (length <= 75) return 'text-lg'       // Very long titles
  if (length <= 95) return 'text-base'     // Extremely long titles
  return 'text-sm'                         // Super long titles
}

export const getDynamicSubtitleSize = (text: string): string => {
  const length = text.length
  
  if (length <= 20) return 'text-xl'       // Short subtitles - use more space
  if (length <= 35) return 'text-lg'       // Medium subtitles
  if (length <= 55) return 'text-base'     // Long subtitles  
  if (length <= 75) return 'text-sm'       // Very long subtitles
  if (length <= 100) return 'text-xs'      // Extremely long subtitles
  return 'text-xs'                         // Super long subtitles
}
