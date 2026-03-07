import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

export const metadata: Metadata = {
	title: 'Prompt Rate — Compare System Prompts Side-by-Side',
	description:
		'Compare two system prompts side-by-side with AI model responses and automated evaluations. Free, BYOK with OpenRouter.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang='en' className='dark'>
			<body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
				<TooltipProvider>{children}</TooltipProvider>
			</body>
		</html>
	);
}
