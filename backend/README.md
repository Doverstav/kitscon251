# KitsCon 25.1 Backend

## Develop

```txt
npm install
npm run dev
```

### Type generation

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>();
```

## Deploy

Possible to do using the CLI, but is alos done on push to main.

```txt
npm run deploy
```
