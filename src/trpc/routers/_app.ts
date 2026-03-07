import { router } from '../init';
import { completionRouter } from './completion';
import { evaluationRouter } from './evaluation';
import { generationRouter } from './generation';

export const appRouter = router({
    completion: completionRouter,
    evaluation: evaluationRouter,
    generation: generationRouter
});

export type AppRouter = typeof appRouter;
