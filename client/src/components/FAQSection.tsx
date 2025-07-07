import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useConfigData } from '@/hooks/useConfigData';

export default function FAQSection() {
  const { data: config, isLoading, error } = useConfigData();
  const faqItems = config?.faqSectionItems || [];

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Loading FAQs...</div>;
  }
  if (error) {
    return <div className="text-center py-12 text-red-500">Failed to load FAQs.</div>;
  }

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
      
      <div className="glass rounded-2xl shadow-glass p-6 lg:p-8">
        <Accordion type="single" collapsible className="space-y-6">
          {faqItems.map((item: any, index: number) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="mt-3 text-gray-200">
                <p dangerouslySetInnerHTML={{ __html: item.answer }}></p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
