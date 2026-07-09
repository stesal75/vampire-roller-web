# Vampire Roller Web

## Stack
- Next.js 15 + TypeScript + React 19
- Tailwind CSS 3
- @upstash/redis (Upstash Redis REST API) — storage persistente
- bcryptjs — hashing password (10 rounds)
- jose — JWT HS256 (cookie httpOnly, 30 giorni)
- resend — invio email (recupero password)
- Deploy: Vercel (progetto `vampire-roller-web`, account/team `stefanosalvoni-9982s-projects`, owner stefano.salvoni@gmail.com)
- GitHub: https://github.com/stesal75/vampire-roller-web (collegato a Vercel, deploy automatico su push a `master`)

## Struttura File Principali
- `app/page.tsx` — server component: legge cookie JWT, verifica token, carica dati Redis, renderizza `<Roller>`
- `app/login/page.tsx` — client component: form login → POST `/api/login` → redirect `/`; link "Password dimenticata?"
- `app/layout.tsx` — layout radice con Tailwind
- `app/components/Roller.tsx` — client component: due select alfabetici (attributi/abilità), visualizzazione dot, somma pool, logout
- `app/api/sync/route.ts` — POST: riceve `{username, password, attributes, skills}` dall'app locale, crea/aggiorna utente in Redis
- `app/api/login/route.ts` — POST: verifica credenziali Redis, imposta cookie `session` JWT
- `app/api/logout/route.ts` — POST: cancella cookie `session`
- `app/api/forgot-password/route.ts` — POST `{username}`: se l'utente esiste crea un reset token (30 min TTL su Redis) e invia email via Resend a `RECOVERY_EMAIL`. Risposta sempre generica (no username enumeration)
- `app/api/reset-password/route.ts` — POST `{token, password}`: consuma il reset token, aggiorna `passwordHash` mantenendo attributi/skill esistenti
- `app/forgot-password/page.tsx` — form "richiedi reset" (solo username)
- `app/reset-password/page.tsx` — form "imposta nuova password" (legge `?token=` dalla query, wrappato in `Suspense` per `useSearchParams`)
- `lib/redis.ts` — `getUser()` / `setUser()` / `createResetToken()` / `consumeResetToken()` via @upstash/redis, interfacce `UserRecord`, `StatItem`, `CharacterData`
- `lib/auth.ts` — `signToken(username)` / `verifyToken(token)` con jose HS256
- `lib/mail.ts` — `sendPasswordResetEmail()` via Resend (pacchetto `resend`)
- `middleware.ts` — aggiunge header CORS `Access-Control-Allow-Origin: *` a tutte le risposte `/api/*`
- `next.config.ts` — headers CORS aggiuntivi (belt-and-suspenders)

## Setup
```bash
npm install
npm run dev   # sviluppo locale su http://localhost:3000
npm run build # build produzione
```

## Variabili d'Ambiente (Vercel → Production)
```
UPSTASH_REDIS_REST_URL=<vedi Vercel dashboard, non salvare qui il valore>
UPSTASH_REDIS_REST_TOKEN=<vedi Vercel dashboard, non salvare qui il valore>
JWT_SECRET=<generato con crypto.randomBytes(32).toString('hex'), encrypted in Vercel>
RESEND_API_KEY=<da account Resend registrato con stefano.salvoni@gmail.com>
RECOVERY_EMAIL=stefano.salvoni@gmail.com   # opzionale, default già stefano.salvoni@gmail.com se non impostata
```
Non committare mai i valori reali qui o in altri file del repo: GitHub Push Protection blocca il push se rileva
pattern di token noti (es. Vercel `vca_...`), e comunque è buona norma non tenere segreti in chiaro nel codice.

## Stato
Completato e funzionante su Vercel. URL produzione: https://vampire-roller-web.vercel.app

Flusso completo:
1. App locale (vampire-roller) legge DOM scheda personaggio
2. Invia dati a Vercel via proxy server-side (`/api/proxy-sync` → `/api/sync`)
3. Utente naviga su Vercel, fa login, seleziona attributo + abilità dai menu, vede la somma pool

## Note Importanti

### Architettura multi-utente
- Ogni utente è `user:{username}` in Redis
- Password hashed con bcrypt al primo sync; verificata ad ogni sync successivo
- JWT in cookie httpOnly `session` (30 giorni)

### CORS — problema risolto via proxy server-side
- Il browser non può chiamare Vercel direttamente (Vercel Deployment Protection blocca prima del codice app)
- Fix: `POST /api/proxy-sync` sull'app locale Express → fetch server-to-server → Vercel (nessun problema CORS)
- Middleware e `next.config.ts` headers CORS servono solo se si chiama Vercel da altri server (non dal browser)

### Env vars su Vercel — attenzione ai trailing whitespace
- `echo "value" | vercel env add KEY` aggiunge `\n` in coda → Upstash rifiuta con "invalid URL"
- `printf "value" | vercel env add KEY` evita il newline ma su Windows può aggiungere `\r`
- Metodo sicuro: scrivere il valore in un file con il Write tool e poi `cat file | vercel env add KEY`, cancellare il file subito dopo
- Verifica valori: `vercel env pull --environment production` e controllare il file generato

### Vercel — accesso CLI
- Login CLI via `vercel login` (device flow) NON ha funzionato in modo affidabile in ambiente sandbox: il token
  salvato in `auth.json` risultava sistematicamente "Not authorized" anche subito dopo un login riuscito nel browser
- **Metodo che funziona:** Personal Access Token creato dall'utente su vercel.com/account/tokens, passato con
  `vercel <comando> --token=<token>` esplicito ad ogni chiamata CLI (non salvato su disco)
- Attenzione: un token personale è legato a UN account/team specifico. Verificare sempre con
  `curl https://api.vercel.com/v9/projects/<projectId>?teamId=<teamId>` che il token abbia accesso al progetto
  giusto prima di usarlo, altrimenti si ottiene `{"error":{"code":"not_found"}}` silenzioso
- Progetto reale: `stefanosalvoni-9982s-projects/vampire-roller-web`, project ID `prj_5zGlkuuQH2wNMa52ZNxoirlmCF31`,
  team ID `team_ECoymY9F4SSWC0DgOt5RnaMy` — collegato a GitHub, deploy automatico sul push a `master`
- Un vecchio tentativo di deploy esisteva su un team/account diverso (`info-12834415s-projects`) con URL
  `vampire-roller-web-psi.vercel.app` — abbandonato, i suoi riferimenti (incluso un token Vercel) erano nella
  vecchia versione di questo file e sono stati rimossi perché scaduti e per evitare di esporre segreti nel repo

### GitHub — push bloccato da credenziali sbagliate
- Il Git Credential Manager di Windows ha salvato le credenziali per l'account GitHub **"Gupitalia"**, che NON ha
  permessi di scrittura su `stesal75/vampire-roller-web` → `git push` fallisce con 403 "Permission denied"
- **Fix che funziona:** GitHub CLI (`gh`) risultava già autenticato come `stesal75` (account giusto, scope `repo`).
  Push eseguito iniettando il token di `gh auth token` come header Basic auth via
  `git -c http.extraHeader="Authorization: Basic $(printf 'x-access-token:%s' "$(gh auth token)" | base64 -w0)" push`
- Da sistemare stabilmente: ri-autenticare Git Credential Manager con l'account `stesal75` (es.
  `cmdkey /delete:LegacyGeneric:target=git:https://github.com` e rifare login), così i push normali funzionano senza workaround

### Redis (Upstash)
- Il database originale (`advanced-finch-108615`) è stato **eliminato da Upstash per inattività** (constatato
  2026-07-09, DNS `ENOTFOUND`): tutti i vecchi utenti/personaggi sono andati persi, ricreato un database nuovo
- Chiavi: `user:{username}` → oggetto `UserRecord { passwordHash, attributes, skills, updatedAt }`
- Chiavi reset password: `reset:{token}` → username, TTL 30 minuti (monouso)
- `lib/redis.ts` legge, in ordine: `vampire_KV_REST_API_URL` → `KV_REST_API_URL` → `UPSTASH_REDIS_REST_URL`
  (stesso schema per il token). Solo `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` sono impostate ora;
  le var `KV_*`/`vampire_KV_*` erano di un'integrazione Marketplace legata al database morto e sono state rimosse

### Recupero password (Resend)
- Provider: [Resend](https://resend.com) (piano gratuito: 3.000 email/mese, 100/giorno)
- Mittente usato: `onboarding@resend.dev` (dominio di test Resend, nessuna verifica DNS necessaria)
- **Limite piano gratuito senza dominio verificato:** Resend consegna solo all'indirizzo email con cui ti sei registrato sull'account Resend. Per questo motivo bisogna registrarsi su Resend usando `stefano.salvoni@gmail.com` (lo stesso valore di `RECOVERY_EMAIL`), altrimenti le email di reset non arrivano.
- Flusso: `/login` → "Password dimenticata?" → `/forgot-password` (inserisci username) → email a `RECOVERY_EMAIL` con link `/reset-password?token=...` (token in Redis, TTL 30 min, monouso) → imposta nuova password
- Non esiste (ancora) un'email per singolo utente: tutti i reset arrivano alla stessa casella `RECOVERY_EMAIL`, adatto a un uso personale/familiare con pochi utenti fidati
- Testato end-to-end il 2026-07-09: login, sync e reset password funzionanti in produzione

*Ultimo aggiornamento: 2026-07-09*
