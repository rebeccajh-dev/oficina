export interface Interaction {
  id: number
  player: string
  position: string
  positionKey: string
  type: 'visualizou' | 'avaliou' | 'favoritou'
  note?: number
  date: string
  club: string
}