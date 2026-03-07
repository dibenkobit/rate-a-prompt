Problem:
There's no tool to verify which system prompt is better. Prompt A or prompt B. Right now it's just the handiwork.

Customer:
Users of LLMs who are into writing their own system prompts.

Existing alternatives:
• manual testing
• buying "ready-to-go" prompts (their usefulness is often not confirmed tho)

Value proposition:
Our product allows you to compare side-by-side in a good UI responses of two different system prompts that you've provided. Also you can enable "auto evaluation" and under the hood up to 5 models will be launched to rate both of the prompts from 0 to 10. Results (your choice + models evaluation) will give you the clear picture about how good the prompts are.

Success criteria / metrics:
• users use the product and they're happy

Scope of v1:
• side-by-side two big textareas. full screen. each for inserting the system prompts to compare.
• at the bottom another textarea (in which you'll write one question, that will go to the model with 2 different system prompts).
• below input textarea there's like a config menu. you can select the model that will run the prompts (it's either models from our choice, or you can free-paste model code from openrouter).
• in the config menu there's also a "model evaluations" choice. user can pick up to 5 models (the same, either from our pick or pasting the model codes) that will evaluate the responses.
• in the config menu there's also a toggle "shuffle". this thing ensures that it can randomly shuffle your prompt sides. for example you wrote down prompt A into the left textarea, and prompt B into the right textarea. you expect that the response of the prompt A will be on the left, but with this settings it's not guaranteed to prevent bias.
• button "send".
• we send a request to openrouter with two different system prompts but one input
• we show user side-by-side the responses
• if user choosed "model evaluations" we run for each selected models both of the responses with our single evaluation system prompt (write it) to rate response from 0 to 10
• below each response there's a button "i prefer this one". when user clicks we show him the system prompt that was under the hood.

Important:
This product is non-profit. Completely free to use with BYOK of OpenRouter.

Stack:
Language: TypeScript (strict mode);
Framework: Next.js App Router, Server Components;
Runtime: Bun;
Linting: Biome (strict mode);
UI: Shadcn UI;
Icons: Lucide;
APIs: tRPC;
Validation: Zod;
Animations: Motion;

Optional stack (if needed):
URL State: nuqs.

Out of scope:
No storage.
No database.
No billing.
No auth.

What you can take from `~/projects/concilium/web`:
• Biome config.
• User input (not of prompts but of input input) style `src/components/concilium/chat-container.tsx`.
