import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FAQ } from '@/lib/faq';

export function Faq() {
    return (
        <section aria-labelledby='faq-heading' className='container mx-auto max-w-2xl py-16'>
            <h2 id='faq-heading' className='mb-6 text-center text-xl font-semibold tracking-tight'>
                Frequently asked questions
            </h2>
            <Accordion>
                {FAQ.map((item) => (
                    <AccordionItem key={item.question} value={item.question}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent keepMounted>
                            <p className='text-muted-foreground'>{item.answer}</p>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    );
}
