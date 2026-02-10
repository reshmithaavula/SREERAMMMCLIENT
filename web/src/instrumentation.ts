export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // We can run startup scripts here if we want to ensure data ingestion happens on server start
    // const { startEngine } = await import('../scripts/backend-engine'); // Issues with importing TS directly in instrumentation
    console.log('Server instrumentation register hook - Server Starting...');
  }
}
