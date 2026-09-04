import { Router } from 'express';
import crypto from 'node:crypto';
import db from '../db/index.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { getSessionUser } from '../auth/middleware.js';

const router = Router();
const SESSION_DAYS = 30;
const COOKIE_NAME = 'session';
const isProduction = process.env.NODE_ENV === 'production';

function createSession(userId, res) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO session (token, user_id, expires_at) VALUES (?, ?, ?)`).run(token, userId, expiresAt);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    // Frontend (Vercel) and backend (Fly.io) are different origins in production, so the cookie
    // needs sameSite:'none' (requires secure:true) to be sent on cross-site API calls. Locally,
    // both run on localhost over http, where 'none' would be rejected by the browser — use 'lax' there.
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

router.get('/me', (req, res) => {
  const userCount = db.prepare(`SELECT COUNT(*) c FROM user`).get().c;
  if (userCount === 0) return res.json({ needsSetup: true });

  const user = getSessionUser(req.cookies?.session);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user });
});

router.post('/setup', (req, res) => {
  const userCount = db.prepare(`SELECT COUNT(*) c FROM user`).get().c;
  if (userCount > 0) return res.status(403).json({ error: 'Setup already completed' });

  const { username, password } = req.body;
  if (!username || !username.trim()) return res.status(400).json({ error: 'Username is required' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const { salt, hash } = hashPassword(password);
  const info = db
    .prepare(`INSERT INTO user (username, password_hash, password_salt, role) VALUES (?, ?, ?, 'admin')`)
    .run(username.trim(), hash, salt);

  createSession(info.lastInsertRowid, res);
  res.status(201).json({ user: { id: info.lastInsertRowid, username: username.trim(), role: 'admin' } });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

  const row = db.prepare(`SELECT * FROM user WHERE username = ?`).get(username.trim());
  if (!row || !verifyPassword(password, row.password_salt, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  createSession(row.id, res);
  res.json({ user: { id: row.id, username: row.username, role: row.role } });
});

router.post('/logout', (req, res) => {
  const token = req.cookies?.session;
  if (token) db.prepare(`DELETE FROM session WHERE token = ?`).run(token);
  res.clearCookie(COOKIE_NAME, { path: '/', secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
  res.json({ ok: true });
});

export default router;
