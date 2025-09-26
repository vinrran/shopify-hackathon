
import tooltip from './tooltip.svg'

export function TooltipOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div 
      className="fixed inset-0 z-50 w-full h-full cursor-pointer"
      onClick={onDismiss}
    >
      <img 
        src={tooltip}
        alt="Tutorial Instructions"
        className="w-full h-full object-cover object-center"
        onError={(e) => {
          console.error('Failed to load tooltip SVG:', e)
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
        }}
      />
    </div>
  )
}
