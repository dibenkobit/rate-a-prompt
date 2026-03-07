import { router } from '../init';
import { completionRouter } from './completion';
import { evaluationRouter } from './evaluation';

export const appRouter = router({
    completion: completionRouter,
    evaluation: evaluationRouter
});

export type AppRouter = typeof appRouter;
