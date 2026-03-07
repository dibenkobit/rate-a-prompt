import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';

export function createTRPCContext(opts: { req: Request }) {
    const apiKey = opts.req.headers.get('x-openrouter-key');
    return { apiKey };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            message: error.message
        };
    }
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const authedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.apiKey) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'API key is required' });
    }
    return next({ ctx: { apiKey: ctx.apiKey } });
});
