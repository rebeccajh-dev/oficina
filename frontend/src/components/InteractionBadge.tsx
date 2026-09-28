import { IconStar, IconHeart, IconEye } from '../icons/icons'

export function InteractionBadge({ type }: { type: string }) {
  if (type === 'avaliou')    return <span className="badge badge-gold" style={{gap:4,display:'inline-flex',alignItems:'center'}}><IconStar />Avaliou</span>
  if (type === 'favoritou')  return <span className="badge badge-green" style={{gap:4,display:'inline-flex',alignItems:'center'}}><IconHeart />Favoritou</span>
  return <span className="badge badge-blue" style={{gap:4,display:'inline-flex',alignItems:'center'}}><IconEye />Visualizou</span>
}

export function Stars({ value }: { value: number }) {
  return (
    <span style={{color:'#B08D57',fontSize:'0.85rem',letterSpacing:1}}>
      {'★'.repeat(value)}{'☆'.repeat(5-value)}
    </span>
  )
}