/**
 * Evergreen guide content — the indexable SEO surface that targets real search
 * queries around prompts. Each guide is hand-written, statically rendered at
 * /guides/[slug], and feeds its own TechArticle JSON-LD. Add a guide by adding
 * an entry here; the route, sitemap, and index page pick it up automatically.
 */

export interface GuideSection {
    heading: string;
    body?: string[];
    bullets?: string[];
    example?: string;
}

export interface Guide {
    slug: string;
    title: string;
    description: string;
    keywords: string[];
    /** Static ISO date — drives Article datePublished/dateModified. */
    updated: string;
    intro: string;
    sections: GuideSection[];
}

export const GUIDES: Guide[] = [
    {
        slug: 'how-to-write-a-system-prompt',
        title: 'How to Write a System Prompt (2026 Guide)',
        description:
            'A practical guide to writing effective system prompts: the structure that works, the principles that make them reliable, common mistakes, and how to test prompt variants side-by-side.',
        keywords: [
            'how to write a system prompt',
            'system prompt guide',
            'writing system prompts',
            'prompt engineering',
            'system prompt structure'
        ],
        updated: '2026-06-28',
        intro: `The system prompt is the highest-leverage text in any LLM app — it sets the model's role, rules, and output before the user types a single word. This guide covers how to structure one, the principles that make it reliable, and how to know it actually got better instead of just different.`,
        sections: [
            {
                heading: 'What a system prompt does',
                body: [
                    `A system prompt is a standing instruction the model reads before every user message. It defines who the assistant is, what it should do, what it must not do, and how its answers should look.`,
                    `Because it applies to every turn, a small change to the system prompt ripples through every response. That leverage is exactly why it's worth writing deliberately — and testing.`
                ]
            },
            {
                heading: 'The anatomy of a good system prompt',
                body: [`Most reliable system prompts contain the same building blocks, in roughly this order:`],
                bullets: [
                    'Role — who the assistant is and the expertise it should bring.',
                    'Task — the specific job it performs and the goal it optimizes for.',
                    'Constraints — hard rules: what to avoid, length limits, tone, when to refuse.',
                    'Output format — the exact shape of the answer (prose, JSON, steps, table).',
                    'Examples — one or two short input→output samples for anything ambiguous.'
                ]
            },
            {
                heading: 'Principles that make prompts reliable',
                bullets: [
                    `Be specific. "Be concise" is weak; "Answer in at most three sentences" is testable.`,
                    `Show, don't tell. One worked example beats a paragraph of description.`,
                    'Constrain the output. State the format explicitly and the model will hold it.',
                    `Put rules positively. "Answer only from the provided context" beats a pile of don'ts.`,
                    'Order matters. Put the most important instruction first and last — models weight both.'
                ]
            },
            {
                heading: 'Common mistakes',
                bullets: [
                    `Vague adjectives ("professional", "helpful") with no concrete definition.`,
                    'Contradictory rules the model silently has to choose between.',
                    'Stuffing in every edge case until the core task is buried.',
                    'Never measuring — changing the wording and assuming it improved.'
                ]
            },
            {
                heading: 'Test every change side-by-side',
                body: [
                    `Writing is guessing until you compare. Keep your current prompt as A, your edit as B, run both against the same question, and read the answers next to each other. Better still, judge blind so you aren't biased toward the version you wrote, and let a second model score each answer against a rubric.`,
                    `That loop — change one thing, compare, keep the winner — is how a prompt actually gets better.`
                ]
            }
        ]
    },
    {
        slug: 'how-to-compare-llm-prompts',
        title: 'How to Compare LLM Prompts (A/B Testing Guide)',
        description:
            'How to A/B test prompts properly: a fair setup, blind evaluation, scoring rubrics, and avoiding the biases that make prompt comparisons quietly lie to you.',
        keywords: [
            'compare llm prompts',
            'prompt a/b testing',
            'test prompts',
            'prompt evaluation',
            'compare prompts side by side'
        ],
        updated: '2026-06-28',
        intro: `Everyone tweaks prompts; almost nobody compares them properly. A fair, blind, side-by-side test is the difference between "I think this is better" and knowing. Here's how to run one.`,
        sections: [
            {
                heading: 'Why eyeballing fails',
                body: [
                    `LLM output is fluent, so a slightly different answer feels better just because it's new. Run-to-run variance and your own bias toward the version you wrote both push you toward the wrong conclusion. The fix is a controlled comparison.`
                ]
            },
            {
                heading: 'Set up a fair test',
                bullets: [
                    'Same question for both prompts — change only the prompt, nothing else.',
                    'Same model and parameters (temperature, max tokens) on both sides.',
                    'Run them together so model and provider state are as close as possible.',
                    'Use representative questions, including the hard and edge cases you actually care about.'
                ]
            },
            {
                heading: 'Judge blind to kill bias',
                body: [
                    `If you know which answer came from "your" prompt, you'll favor it. Hide the labels, decide which answer is better, and only then reveal which prompt produced it. Shuffling which side each answer appears on removes the subtler "I trust the one on the left" bias too.`
                ]
            },
            {
                heading: 'Score with a rubric — and a second model',
                body: [
                    `A gut "this one" is fine for a single comparison; a rubric scales. Rate each answer 0–10 on accuracy, relevance, completeness, and clarity. Adding one or more AI evaluators to score the same answers gives you a fast, consistent second opinion and surfaces disagreements worth a closer look.`
                ]
            },
            {
                heading: 'Iterate one variable at a time',
                body: [
                    `Change one thing, compare, keep the winner, repeat. If you change five things at once and it improves, you've learned nothing about which change mattered. Single-variable iteration is slower per step and far faster to a prompt you trust.`
                ]
            }
        ]
    },
    {
        slug: 'system-prompt-examples',
        title: 'System Prompt Examples (Annotated)',
        description:
            'Five annotated system prompt examples — assistant persona, coding helper, summarizer, strict JSON classifier, and support agent — with notes on exactly why each one works.',
        keywords: [
            'system prompt examples',
            'example system prompts',
            'system prompt templates',
            'chatgpt system prompt examples',
            'prompt examples'
        ],
        updated: '2026-06-28',
        intro: `The fastest way to write a good system prompt is to start from one that works and adapt it. Here are five short, annotated examples covering common jobs, with notes on what makes each one reliable.`,
        sections: [
            {
                heading: 'Focused assistant persona',
                example: `You are a senior backend engineer. Answer questions about API design and databases. Be direct: give the recommendation first, then a one-paragraph reason. If a question is ambiguous, ask one clarifying question instead of guessing.`,
                body: [
                    `Why it works: a concrete role, an answer-first format, and a defined behavior for ambiguity instead of leaving it to chance.`
                ]
            },
            {
                heading: 'Coding helper with output rules',
                example: `You are a coding assistant. Return a single, complete code block in the requested language, then at most three bullet points explaining the key choices. Do not add prose before the code. Assume the latest stable version unless told otherwise.`,
                body: [
                    `Why it works: it pins the output shape — code first, short rationale — so responses stay consistent and easy to scan.`
                ]
            },
            {
                heading: 'Summarizer with a hard limit',
                example: `Summarize the text the user provides in at most five bullet points. Each bullet is one sentence. Keep the author's claims; do not add opinions or information that isn't in the text.`,
                body: [
                    `Why it works: a testable length limit plus an explicit "no invented additions" rule, which is where summarizers usually fail.`
                ]
            },
            {
                heading: 'Strict JSON classifier',
                example: `Classify the user's message as one of: bug, feature_request, question, other. Respond with only valid JSON: {"label": <one of the four>, "confidence": <0-1>}. No explanation, no markdown.`,
                body: [
                    `Why it works: a closed label set plus an exact JSON schema and "no markdown" makes the output safe to parse in code.`
                ]
            },
            {
                heading: 'Support agent with tone and limits',
                example: `You are a support agent for an open-source app. Be warm and concise, and solve the problem in clear steps. You cannot issue refunds or access accounts — for those, tell the user to email support@example.com. Never invent features that don't exist.`,
                body: [
                    `Why it works: it sets tone, scopes what the agent can and can't do, and gives a concrete escalation path so it won't promise things it can't deliver.`
                ]
            },
            {
                heading: 'Adapt, then test',
                body: [
                    `Copy the closest example, swap in your own role, task, and constraints, and run it. Then compare your version against the original side-by-side — the only way to know your edit helped is to see both answers next to each other.`
                ]
            }
        ]
    }
];

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);

export const getGuide = (slug: string): Guide | undefined => GUIDES.find((g) => g.slug === slug);
