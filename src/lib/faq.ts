/**
 * FAQ content — single source for the visible accordion and the FAQPage
 * JSON-LD. Keep the two in sync (Google requires matching visible content),
 * so always read from here, never duplicate the copy.
 */

export interface FaqEntry {
    question: string;
    answer: string;
}

export const FAQ: FaqEntry[] = [
    {
        question: 'What is Rate a Prompt?',
        answer: 'Rate a Prompt is a free, open-source tool for comparing system prompts side-by-side. You run two to four prompts against the same question, stream the answers in parallel, and pick the best one — by eye or with automated AI scoring.'
    },
    {
        question: 'How do I compare two system prompts?',
        answer: 'Write Prompt A and Prompt B, ask one question, and pick a model. Both prompts answer the same question at once so you can compare them directly. Optionally turn on blind judging and AI evaluators that score each answer from 0 to 10.'
    },
    {
        question: 'What is a system prompt?',
        answer: 'A system prompt is the instruction that sets an AI model’s behavior, role, and tone before the user asks anything. Small wording changes can noticeably shift the output, which is exactly why comparing prompt variants side-by-side is useful.'
    },
    {
        question: 'Do I need an account or API key?',
        answer: 'No account, ever. You bring your own OpenRouter API key, which stays in your browser’s local storage and is sent straight to OpenRouter. There is no server-side storage and no database.'
    },
    {
        question: 'Which AI models can I use?',
        answer: 'Any model available on OpenRouter — Claude, GPT, Gemini, Grok, DeepSeek, Mistral and more. Choose one from the list or paste any OpenRouter model ID, and optionally let the model search the web while it answers.'
    },
    {
        question: 'Is Rate a Prompt free and open-source?',
        answer: 'Yes. The app is MIT-licensed and free to use — you only pay OpenRouter for the tokens you spend. The full source is on GitHub, and self-hosting it takes two commands.'
    }
];
