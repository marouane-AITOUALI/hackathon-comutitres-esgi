import { createServer } from 'node:http'
import { app } from './app.js'
import { env } from './config/env.js'
import { initializeGlitchTip } from './observability/glitchtip.js'
import { initializeWebSocketServer } from './realtime/websocket.server.js'

initializeGlitchTip()

const server = createServer(app)
initializeWebSocketServer(server)

server.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`)
})
