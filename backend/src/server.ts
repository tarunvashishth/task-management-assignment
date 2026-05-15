import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import authService from './services/auth.service';
import socketService from './services/socket.service';

const PORT = parseInt(process.env.PORT || '3001', 10);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// JWT auth middleware for every connection (including reconnects)
io.use((socket, next) => {
  try {
    // Try auth.token first (sent explicitly), then fall back to cookie
    let token: string | undefined = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      const rawCookie = socket.handshake.headers.cookie || '';
      const match = rawCookie.match(/access_token=([^;]+)/);
      token = match?.[1];
    }

    if (!token) {
      return next(new Error('UNAUTHORIZED'));
    }

    const payload = authService.verifyAccessToken(token);
    if (authService.isBlocked(payload.jti)) {
      return next(new Error('UNAUTHORIZED'));
    }

    socket.data.user = { id: payload.id, email: payload.email, jti: payload.jti };
    next();
  } catch {
    next(new Error('UNAUTHORIZED'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user as { id: string; email: string };
  socketService.trackConnection(socket.id, user.id);

  socket.on('task:join', ({ taskId }: { taskId: string }) => {
    socketService.joinTaskRoom(socket, taskId);
  });

  socket.on('task:leave', ({ taskId }: { taskId: string }) => {
    socketService.leaveTaskRoom(socket, taskId);
  });

  socket.on('task:editing', ({ taskId }: { taskId: string }) => {
    socketService.emitUserEditing(taskId, user.id, user.email);
  });

  socket.on('task:stop-editing', ({ taskId }: { taskId: string }) => {
    socketService.emitUserStoppedEditing(taskId, user.id);
  });

  socket.on('disconnect', () => {
    socketService.onDisconnect(socket.id, user.id);
  });
});

socketService.initialize(io);

async function start() {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
