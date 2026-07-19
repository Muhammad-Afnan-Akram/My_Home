# Devices on the deployed app — home router agent

The Devices tab controls a Zong 4G (Huawei) router at `http://192.168.8.1`. That
address is **only reachable from inside your home LAN**, so the deployed app
(Vercel, in the cloud) can never talk to it directly. Nothing can bypass that —
it's how your network works.

The fix is a tiny **agent** that runs on a machine on the Zong Wi-Fi. It makes
only *outbound* connections to Supabase (no tunnel, no port-forwarding, no
certificate), listens on a **private** Supabase Realtime channel, runs the router
command locally, and sends the result back. The deployed app publishes commands
to the same channel.

```
phone/laptop (anywhere)
  → deployed app (HTTPS)  ──rpc-request──►  Supabase Realtime (private channel)
                                                  ▲   │
                                  (outbound WSS)  │   │
                                                  │   ▼
                                          home agent ── http://192.168.8.1
                                                  │
                          ◄──────rpc-response──────┘
```

## One-time setup

### 1. Apply the Realtime RLS policies (Supabase → SQL editor)

The channel is private: only the Devices-allowed account may read or write it, so
no one else can drive your router or see your device list. Run this once:

```sql
-- Receive (subscribe) on the router-control topic.
create policy "router-control read"
on realtime.messages
for select
to authenticated
using (
  realtime.topic() = 'router-control'
  and (auth.jwt() ->> 'email') = 'afnan.akram911@gmail.com'
);

-- Send (broadcast) on the router-control topic.
create policy "router-control write"
on realtime.messages
for insert
to authenticated
with check (
  realtime.topic() = 'router-control'
  and (auth.jwt() ->> 'email') = 'afnan.akram911@gmail.com'
);
```

If you change `VITE_ROUTER_CHANNEL`, change the topic string here to match. RLS is
already enabled on `realtime.messages` in Supabase by default.

### 2. Configure `.env` on the home machine

Copy `.env.example` to `.env` and fill in (see that file for the full list):

```
VITE_SUPABASE_URL=...            # already set for the app
VITE_SUPABASE_ANON_KEY=...       # already set for the app
ZONG_ROUTER_PASSWORD=...         # already set for the app
VITE_ROUTER_CHANNEL=router-control
ROUTER_AGENT_EMAIL=afnan.akram911@gmail.com   # must be the Devices-allowed email
ROUTER_AGENT_PASSWORD=...        # that Supabase account's password
```

### 3. Set the deployed transport (Vercel → Project → Settings → Environment Variables)

```
VITE_ROUTER_TRANSPORT=realtime
VITE_ROUTER_CHANNEL=router-control
```

These are `VITE_`-prefixed, so they're baked in at **build time** — after adding
them, trigger a redeploy. Locally, leave `VITE_ROUTER_TRANSPORT=http` (or unset)
so `npm run dev` keeps using the direct `/api/router` path.

## Running the agent

On a machine joined to the Zong Wi-Fi:

```
npm run agent
```

You should see `ready — listening on private channel "router-control"`. Open the
deployed app's Devices tab and it works. If the agent isn't running, the tab shows
"The home router agent isn't responding."

### Keep it running (optional)

- **Windows (Task Scheduler):** create a task "At log on" running
  `node` with argument `server\routerAgent.ts` and *Start in* set to the project
  folder. Tick "Run whether user is logged on or not" for a headless box.
- **Any OS (pm2):** `npm i -g pm2 && pm2 start "npm run agent" --name router-agent && pm2 save`.

## How it stays secure

- **Private channel + RLS** — only a session whose JWT email equals the allowed
  address can read or write the topic, enforced by Postgres, not the client.
- The agent signs in as that same account, so it passes the same check.
- Router commands carry no credentials in the payload; channel membership *is* the
  authorization.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Agent logs `channel error` | RLS policies missing or email mismatch. Re-check step 1 and `ROUTER_AGENT_EMAIL`. |
| App: "agent isn't responding" | Agent not running, not on the Zong Wi-Fi, or `VITE_ROUTER_CHANNEL` differs between app and agent. |
| Agent logs a router error | Same router messages as local dev (wrong `ZONG_ROUTER_PASSWORD`, MAC filter off, etc.). |
| Works locally, not deployed | `VITE_ROUTER_TRANSPORT=realtime` not set on Vercel, or set after the last build — redeploy. |
