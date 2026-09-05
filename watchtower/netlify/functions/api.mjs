import {
  appendEvent,
  currentSession,
  getEvents,
  getStoredSession
} from './_lib/global-sky.mjs';

const json = (value, status = 200) => new Response(JSON.stringify(value, null, 2), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
});

function pathFor(request) {
  const url = new URL(request.url);
  let path = url.pathname;
  if (path.startsWith('/.netlify/functions/api')) path = path.slice('/.netlify/functions/api'.length) || '/';
  if (path.startsWith('/api')) path = path.slice(4) || '/';
  return path;
}

function publicSession(session) {
  if (!session) return null;
  return {
    broadcast_id: session.broadcast_id,
    status: session.status,
    started_at_utc: session.started_at_utc,
    next_set_utc: session.next_set_utc,
    selected: (session.selected || []).map((item) => ({
      slot: item.slot,
      camera: {
        camera_id: item.camera?.camera_id,
        city: item.camera?.city,
        country: item.camera?.country,
        provider: item.camera?.provider,
        source_page: item.camera?.source_page,
        attribution: item.camera?.attribution || null
      }
    }))
  };
}

export default async (request) => {
  const path = pathFor(request);

  try {
    if (request.method === 'GET' && path === '/stage/current') {
      const session = await currentSession();
      return json({
        session,
        settings: { heartbeat_seconds: 30, receipt_poll_ms: 1000 },
        next_interlude_utc: session.next_set_utc
      });
    }

    if (request.method === 'POST' && path === '/event') {
      const body = await request.json().catch(() => ({}));
      if (!body?.broadcast_id) return json({ error: 'broadcast_id required' }, 400);
      const event = await appendEvent(body);
      return json({ ok: true, event }, 201);
    }

    if (request.method === 'GET' && path === '/public/current') {
      const session = await currentSession();
      return json({ session: publicSession(session), next_interlude_utc: session.next_set_utc });
    }

    const publicEventsMatch = path.match(/^\/public\/session\/([^/]+)\/events$/);
    if (request.method === 'GET' && publicEventsMatch) {
      const id = decodeURIComponent(publicEventsMatch[1]);
      return json({ events: await getEvents(id) });
    }

    const publicSessionMatch = path.match(/^\/public\/session\/([^/]+)$/);
    if (request.method === 'GET' && publicSessionMatch) {
      const id = decodeURIComponent(publicSessionMatch[1]);
      const session = await getStoredSession(id);
      return session ? json({ session: publicSession(session) }) : json({ error: 'not found' }, 404);
    }

    return json({ error: 'not found', path }, 404);
  } catch (error) {
    console.error('Global Sky API error', error);
    return json({ error: 'internal_error', message: String(error?.message || error) }, 500);
  }
};
