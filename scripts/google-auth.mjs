#!/usr/bin/env node
/**
 * One-time OAuth2 setup script for Google Calendar integration.
 *
 * Usage:
 *   node scripts/google-auth.mjs <client-id> <client-secret>
 *
 * This will:
 *   1. Open your browser to Google's consent screen
 *   2. Listen on http://localhost:3001/callback for the redirect
 *   3. Exchange the auth code for tokens
 *   4. Print the refresh token to add to your .env file
 *
 * Prerequisites:
 *   - In Google Cloud Console → APIs & Services → Credentials → your OAuth2 client:
 *     Add http://localhost:3001/callback as an Authorized Redirect URI
 */

import http from 'node:http';
import { exec } from 'node:child_process';
import { URL } from 'node:url';

const PORT = 3001;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

const clientId = process.argv[2];
const clientSecret = process.argv[3];

if (!clientId || !clientSecret) {
  console.error('\n  Usage: node scripts/google-auth.mjs <client-id> <client-secret>\n');
  process.exit(1);
}

// Build the consent URL
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent'); // force refresh token

console.log('\n  Opening browser for Google sign-in...\n');

// Open browser
const openCmd =
  process.platform === 'win32' ? `start "" "${authUrl}"` :
  process.platform === 'darwin' ? `open "${authUrl}"` :
  `xdg-open "${authUrl}"`;

exec(openCmd, (err) => {
  if (err) {
    console.log('  Could not auto-open browser. Visit this URL manually:\n');
    console.log(`  ${authUrl}\n`);
  }
});

// Start a temporary HTTP server to receive the callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (!url.pathname.startsWith('/callback')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2>Authorization denied.</h2><p>You can close this tab.</p>');
    console.error(`\n  Authorization error: ${error}\n`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h2>Missing authorization code.</h2>');
    return;
  }

  // Exchange code for tokens
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      throw new Error(data.error_description || data.error || 'Token exchange failed');
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2>Success! You can close this tab.</h2><p>Check your terminal for the refresh token.</p>');

    console.log('  ✓ Authorization successful!\n');
    console.log('  Add these to your .env file:\n');
    console.log(`  VITE_GOOGLE_CLIENT_ID=${clientId}`);
    console.log(`  VITE_GOOGLE_CLIENT_SECRET=${clientSecret}`);
    console.log(`  VITE_GOOGLE_REFRESH_TOKEN=${data.refresh_token}`);
    console.log();

    if (!data.refresh_token) {
      console.log('  ⚠ No refresh token received. This can happen if you previously');
      console.log('    authorized this app. Go to https://myaccount.google.com/permissions,');
      console.log('    remove this app, and run this script again.\n');
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h2>Error exchanging token.</h2><pre>${err.message}</pre>`);
    console.error(`\n  Token exchange error: ${err.message}\n`);
  }

  server.close();
});

server.listen(PORT, () => {
  console.log(`  Waiting for callback on http://localhost:${PORT}/callback ...\n`);
});
