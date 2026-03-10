/**
 * sessionController.js
 * Manages lecture sessions: creation, status tracking, transcript storage, and student roster.
 */
import { randomUUID } from 'crypto';

class SessionManager {
  constructor() {
    this.activeSession = null;
    this.students = new Map(); // socketId → { name, joinedAt }
  }

  /**
   * Create a new lecture session with a unique ID.
   */
  createSession(title) {
    this.activeSession = {
      sessionId: randomUUID().slice(0, 8).toUpperCase(),
      title,
      status: 'running',
      startTime: new Date().toISOString(),
      transcript: [],
      studentCount: this.students.size,
    };
    return this.activeSession;
  }

  /**
   * Return the current active session (with live student count).
   */
  getActiveSession() {
    if (this.activeSession) {
      this.activeSession.studentCount = this.students.size;
    }
    return this.activeSession;
  }

  /**
   * Update the lecture status (running | paused | ended).
   */
  updateStatus(status) {
    if (!this.activeSession) return;
    this.activeSession.status = status;
    if (status === 'ended') {
      this.activeSession.endTime = new Date().toISOString();
    }
  }

  /**
   * Append a transcript entry and return it.
   */
  addTranscript(text, timestamp) {
    const entry = {
      id: Date.now(),
      text,
      timestamp: timestamp || new Date().toISOString(),
    };
    if (this.activeSession) {
      this.activeSession.transcript.push(entry);
    }
    return entry;
  }

  /**
   * Clear the current transcript.
   */
  clearTranscript() {
    if (this.activeSession) {
      this.activeSession.transcript = [];
    }
  }

  addStudent(socketId, name = 'Anonymous') {
    this.students.set(socketId, { name, joinedAt: new Date().toISOString() });
  }

  removeStudent(socketId) {
    this.students.delete(socketId);
  }

  getStudentCount() {
    return this.students.size;
  }
}

export const sessionManager = new SessionManager();
