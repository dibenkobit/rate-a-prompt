# Rate a Prompt

Compare two system prompts side-by-side. See which one is actually better — by your own eyes and by AI evaluators.

Free, open-source, and bring-your-own-key (OpenRouter). No accounts, no storage, no cost beyond what you pay OpenRouter for the tokens.

## Why

Writing a good system prompt is guesswork. You tweak it, run it, and *feel* like it got better. There's no easy way to put prompt A next to prompt B and actually compare.

Rate a Prompt runs both prompts against the same question, shows the responses side-by-side, and lets you score the winner.

## Features

- **Side-by-side comparison** — two system prompts, one shared question, streamed responses in parallel.
- **Blind preference** — pick the response you like before seeing which prompt produced it.
- **Shuffle** — randomizes which prompt lands on which side, so you don't bias toward "the left one."
- **Auto-evaluation** — let up to 5 models score each response 0–10 with a one-line reason.
- **Any model** — pick from a curated list or paste any OpenRouter model ID.
- **Web search toggle** — optionally let the model search the web while answering.
- **Per-request cost** — see what each comparison cost you.

## How it works

1. Write **Prompt A** and **Prompt B** in the two editors.
2. Type one question and pick a model to run both prompts.
3. (Optional) Add evaluator models and turn on shuffle.
4. Hit **Send** — both responses stream in side-by-side.
5. Click **"I prefer this one"** on the better response.
6. The tool reveals which prompt was behind each side, plus the evaluator scores.

Your choice + the model scores give you a clear read on which prompt wins.

## Getting started

You need [Bun](https://bun.sh) ≥ 1.3 and an [OpenRouter API key](https://openrouter.ai/keys).

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Set API Key**, and paste your OpenRouter key.

### Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run start` | Run the production build |
| `bun run lint` | Lint & format with Biome |
| `bun run typecheck` | Type-check with TypeScript |

## Privacy

Your API key lives in your browser's `localStorage` and is sent with each request straight to OpenRouter. It's never stored on a server. There is no database, no auth, and no billing — the app keeps nothing.

## Tech stack

Next.js (App Router) · TypeScript · Bun · tRPC v11 (streaming) · Tailwind CSS v4 · shadcn/ui · Zod · Biome

## Contributing

Issues and PRs welcome. Before opening a PR, run:

```bash
bun run lint
bun run build
```

## License

[MIT](LICENSE)
