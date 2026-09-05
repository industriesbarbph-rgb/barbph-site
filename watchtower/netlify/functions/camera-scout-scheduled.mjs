import { runScoutOnce } from './_lib/global-sky.mjs';

export default async () => {
  try {
    const result = await runScoutOnce();
    return new Response(JSON.stringify({
      ok: true,
      discovered: result.discovered,
      last_city: result.state.last_city,
      total_runs: result.state.total_runs
    }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  } catch (error) {
    console.error('Global Sky scheduled scout failed', error);
    return new Response(JSON.stringify({ ok: false, error: String(error?.message || error) }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
};

export const config = {
  schedule: '*/15 * * * *'
};
