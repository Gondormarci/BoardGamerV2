import { useEffect, useState, useCallback, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import { getApiBase } from '../api/config'

export interface ChatMessagePayload {
  senderId: string
  senderName: string
  content: string
  createdAt: string
}

export interface UseEventChatOptions {
  eventId: string | undefined
  isParticipant: boolean
  getAccessToken: () => Promise<string | undefined>
}

export interface UseEventChatResult {
  messages: ChatMessagePayload[]
  sendMessage: (content: string) => Promise<void>
  connectionState: signalR.HubConnectionState
  error: string | null
}

/**
 * SignalR event chat: connects to hub with Bearer token, joins group event_{eventId},
 * receives and sends messages. Only connects when isParticipant and eventId are set.
 */
export function useEventChat({
  eventId,
  isParticipant,
  getAccessToken,
}: UseEventChatOptions): UseEventChatResult {
  const [messages, setMessages] = useState<ChatMessagePayload[]>([])
  const [connectionState, setConnectionState] = useState<signalR.HubConnectionState>(signalR.HubConnectionState.Disconnected)
  const [error, setError] = useState<string | null>(null)
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      const connection = connectionRef.current
      if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        return
      }
      const trimmed = content.trim()
      if (!trimmed) return
      try {
        await connection.invoke('SendMessage', trimmed)
      } catch (err) {
        console.error('SendMessage failed', { eventId, err })
        setError('Failed to send message.')
      }
    },
    [eventId]
  )

  useEffect(() => {
    if (!eventId || !isParticipant) {
      return
    }

    const baseUrl = getApiBase()
    if (!baseUrl) {
      setError('API base URL not configured.')
      return
    }

    const hubPath = '/hubs/eventchat'
    const url = `${baseUrl.replace(/\/$/, '')}${hubPath}?eventId=${encodeURIComponent(eventId)}`

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: async () => (await getAccessToken()) ?? '',
      })
      .withAutomaticReconnect()
      .build()

    connectionRef.current = connection

    connection.on('ReceiveMessage', (payload: ChatMessagePayload) => {
      setMessages((prev) => [...prev, payload])
    })

    const startConnection = async () => {
      setConnectionState(connection.state)
      setError(null)
      try {
        await connection.start()
        setConnectionState(signalR.HubConnectionState.Connected)
      } catch (err) {
        console.error('Event chat connection failed', { eventId, err })
        setConnectionState(connection.state)
        setError('Could not connect to chat.')
      }
    }

    connection.onclose(() => setConnectionState(signalR.HubConnectionState.Disconnected))
    connection.onreconnecting(() => setConnectionState(signalR.HubConnectionState.Reconnecting))
    connection.onreconnected(() => setConnectionState(signalR.HubConnectionState.Connected))

    startConnection()

    return () => {
      connection.off('ReceiveMessage')
      connection.stop().catch(() => {})
      connectionRef.current = null
      setMessages([])
      setConnectionState(signalR.HubConnectionState.Disconnected)
    }
  }, [eventId, isParticipant, getAccessToken])

  return { messages, sendMessage, connectionState, error }
}
