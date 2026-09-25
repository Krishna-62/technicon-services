// Runs the local backend Express app locally with a plain `.listen()`,
// so the app can be tested manually without needing external services.
let app;
if (process.env.DATABASE_URL) {
  try {
    app = (await import('./index.js')).default;
  } catch {
    app = (await import('../server/src/app.js')).default;
  }
} else {
  app = (await import('../server/src/app.js')).default;
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`TECHNICON API listening on http://localhost:${PORT}`));
