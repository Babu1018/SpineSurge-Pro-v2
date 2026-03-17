import { WebSocket, WebSocketServer } from 'ws';
import { setupWSConnection } from './server/y-websocket';
import * as http from 'http';

const port = 3002;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
});
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, req) => {
    setupWSConnection(ws, req);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request as any, socket as any, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

server.listen(port, () => {
    console.log(`Test Server running at ws://localhost:${port}`);

    const ws = new WebSocket(`ws://localhost:${port}/room1`);
    ws.binaryType = 'arraybuffer';

    ws.on('open', () => {
        console.log('Client connected');
    });

    ws.on('message', (data: ArrayBuffer) => {
        console.log('Client received message of length:', data.byteLength);
        // We expect Yjs sync step 1 (messageType 0)
        const arr = new Uint8Array(data);
        if (arr.length > 0) {
            // check first byte (varUint)
            // 0 = sync
            // 1 = awareness
            // encoded as varUint. 0 is 0x00.
            if (arr[0] === 0) {
                console.log('Received Sync Step 1');
                process.exit(0);
            } else if (arr[0] === 1) {
                console.log('Received Awareness');
            }
        }
    });

    ws.on('error', (err) => {
        console.error('Client error:', err);
        process.exit(1);
    });
});
