/**
 * server.js
 * Express + Socket.io backend for Inclusive Classroom AI.
 * Handles real-time transcript broadcasting, translation API, and session management.
 */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { translationRouter } from './translationController.js';
import { sessionManager } from './sessionController.js';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

/* ---- Middleware ---- */
app.use(cors());
app.use(express.json());

/* ---- API Routes ---- */
app.use('/api', translationRouter);

app.get('/api/session', (_req, res) => {
  const session = sessionManager.getActiveSession();
  res.json(session || { active: false });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/* ---- Socket.io Events ---- */
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Send current state to new client
  const session = sessionManager.getActiveSession();
  if (session) {
    socket.emit('session-info', session);
    socket.emit('lecture-status', { status: session.status });
    if (session.transcript.length > 0) {
      socket.emit('transcript-history', session.transcript);
    }
  }
  io.emit('student-count', sessionManager.getStudentCount());

  /* ---- Admin events ---- */

  socket.on('start-lecture', (data) => {
    const s = sessionManager.createSession(data?.title || 'Untitled Lecture');
    socket.join('admin');
    socket.data.role = 'admin';
    io.emit('session-info', s);
    io.emit('lecture-status', { status: 'running' });
    io.emit('student-count', sessionManager.getStudentCount());
    console.log(`[Lecture] Started: ${s.sessionId}`);
  });

  socket.on('pause-lecture', () => {
    sessionManager.updateStatus('paused');
    io.emit('lecture-status', { status: 'paused' });
  });

  socket.on('resume-lecture', () => {
    sessionManager.updateStatus('running');
    io.emit('lecture-status', { status: 'running' });
  });

  socket.on('end-lecture', () => {
    sessionManager.updateStatus('ended');
    io.emit('lecture-status', { status: 'ended' });
    io.emit('session-info', sessionManager.getActiveSession());
  });

  socket.on('transcript-update', (data) => {
    const entry = sessionManager.addTranscript(data.text, data.timestamp);
    io.emit('transcript-broadcast', entry);
  });

  socket.on('clear-transcript', () => {
    sessionManager.clearTranscript();
    io.emit('transcript-cleared');
  });

  /* ---- Student events ---- */

  socket.on('join-session', (data) => {
    socket.join('students');
    socket.data.role = 'student';
    socket.data.name = data?.name || 'Anonymous';
    sessionManager.addStudent(socket.id, socket.data.name);
    io.emit('student-count', sessionManager.getStudentCount());
    console.log(`[Student] Joined: ${socket.data.name}`);
  });

  socket.on('student-question', (data) => {
    io.to('admin').emit('student-notification', {
      type: 'question',
      studentName: socket.data?.name || 'Anonymous',
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('student-feedback', (data) => {
    io.to('admin').emit('student-notification', {
      type: 'feedback',
      studentName: socket.data?.name || 'Anonymous',
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  });

  /* ---- Disconnect ---- */

  socket.on('disconnect', () => {
    if (socket.data?.role === 'student') {
      sessionManager.removeStudent(socket.id);
      io.emit('student-count', sessionManager.getStudentCount());
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

/* ---- Start ---- */
server.listen(PORT, () => {
  console.log(`\n🎓  Inclusive Classroom AI — Backend`);
  console.log(`   Server  → http://localhost:${PORT}`);
  console.log(`   Socket  → ready\n`);
});
