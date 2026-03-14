import { useParams } from 'react-router-dom'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <h1>Event {id ?? '—'}</h1>
}
