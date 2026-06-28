import { ArrowUpRightIcon } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/layout/footer';
import { RapLogo } from '@/components/layout/logo';

export default function GuidesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className='flex min-h-screen flex-col'>
            <header className='py-3 container mx-auto flex items-center justify-between'>
                <Link href='/' className='flex items-center gap-2'>
                    <RapLogo className='size-7' />
                    <span className='text-lg font-semibold tracking-tight'>Rate a Prompt</span>
                </Link>
                <Link
                    href='/'
                    className='flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground'
                >
                    Open the app
                    <ArrowUpRightIcon className='size-3.5' />
                </Link>
            </header>
            <main className='flex-1 container mx-auto py-10'>{children}</main>
            <Footer />
        </div>
    );
}
