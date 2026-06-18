import type { Server } from 'node:http'
import type { IncomingMessage } from 'node:http'
import { WebSocket, WebSocketServer } from 'ws'
import { env } from '../config/env.js'
import { AUTH_COOKIE_NAME } from '../utils/auth-cookie.js'
import { verifyAuthToken } from '../utils/jwt.js'

const socketsByUser = new Map<string, Set<WebSocket>>()
const socketUsers = new WeakMap<WebSocket, string>()
const aliveSockets = new WeakSet<WebSocket>()

function tokenFromProtocols(request: IncomingMessage) {
  const protocols = request.headers['sec-websocket-protocol']
    ?.split(',')
    .map((protocol) => protocol.trim()) ?? []
  const authProtocol = protocols.find((protocol) => protocol.startsWith('comutitres.jwt.'))
  return authProtocol?.slice('comutitres.jwt.'.length)
}

function tokenFromCookie(request: IncomingMessage) {
  for (const cookie of request.headers.cookie?.split(';') ?? []) {
    const index = cookie.indexOf('=')
    if (index < 0 || cookie.slice(0, index).trim() !== AUTH_COOKIE_NAME) continue
    return decodeURIComponent(cookie.slice(index + 1).trim())
  }
}

function rejectUpgrade(socket: import('node:stream').Duplex, statusCode: number, message: string) {
  socket.write(`HTTP/1.1 ${statusCode} ${message}\r\nConnection: close\r\n\r\n`)
  socket.destroy()
}

function removeSocket(socket: WebSocket) {
  const userId = socketUsers.get(socket)
  if (!userId) return
  const sockets = socketsByUser.get(userId)
  sockets?.delete(socket)
  if (sockets?.size === 0) socketsByUser.delete(userId)
}

export function initializeWebSocketServer(server: Server) {
  const webSocketServer = new WebSocketServer({
    noServer: true,
    handleProtocols(protocols) {
      return protocols.has('comutitres') ? 'comutitres' : false
    },
  })

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
    if (url.pathname !== '/ws') {
      rejectUpgrade(socket, 404, 'Not Found')
      return
    }

    const origin = request.headers.origin
    if (origin && !env.corsOrigins.includes(origin)) {
      rejectUpgrade(socket, 403, 'Forbidden')
      return
    }

    const token = tokenFromProtocols(request) ?? tokenFromCookie(request)
    if (!token) {
      rejectUpgrade(socket, 401, 'Unauthorized')
      return
    }

    try {
      const session = verifyAuthToken(token)
      webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
        socketUsers.set(webSocket, session.sub)
        webSocketServer.emit('connection', webSocket, request)
      })
    } catch {
      rejectUpgrade(socket, 401, 'Unauthorized')
    }
  })

  webSocketServer.on('connection', (socket) => {
    const userId = socketUsers.get(socket)
    if (!userId) {
      socket.close(1008, 'Session invalide')
      return
    }

    const sockets = socketsByUser.get(userId) ?? new Set<WebSocket>()
    sockets.add(socket)
    socketsByUser.set(userId, sockets)
    aliveSockets.add(socket)

    socket.on('pong', () => aliveSockets.add(socket))
    socket.on('close', () => removeSocket(socket))
    socket.on('error', () => removeSocket(socket))
    socket.send(JSON.stringify({ event: 'realtime.ready', payload: { connectedAt: new Date().toISOString() } }))
  })

  const heartbeat = setInterval(() => {
    for (const socket of webSocketServer.clients) {
      if (!aliveSockets.has(socket)) {
        socket.terminate()
        removeSocket(socket)
        continue
      }
      aliveSockets.delete(socket)
      socket.ping()
    }
  }, 30_000)

  server.on('close', () => clearInterval(heartbeat))
}

export function publishRealtimeEvent(userId: string, event: string, payload: unknown) {
  const message = JSON.stringify({ event, payload })
  for (const socket of socketsByUser.get(userId) ?? []) {
    if (socket.readyState === WebSocket.OPEN) socket.send(message)
  }
}
