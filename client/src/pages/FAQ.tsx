import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';
import { useConfigData } from '@/hooks/useConfigData';

export default function FAQ() {
  const { data: config, isLoading, error } = useConfigData();
  const faqCategories = config?.faqCategories || [];
  const faqSupportSection = config?.faqSupportSection;

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Loading FAQs...</div>;
  }
  if (error) {
    return <div className="text-center py-12 text-red-500">Failed to load FAQs.</div>;
  }

  return (
    <div className="mt-8 mb-16">
      <div className="flex items-center mb-8">
        <HelpCircle className="h-6 w-6 text-primary mr-2" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-500 text-transparent bg-clip-text">Frequently Asked Questions</h1>
      </div>
      
      <div className="space-y-8">
        {faqCategories.map((category: any, categoryIndex: number) => (
          <div key={categoryIndex}>
            <h2 className="text-xl font-semibold mb-4 text-primary">{category.title}</h2>
            
            <div className="casino-card overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item: any, itemIndex: number) => (
                  <AccordionItem key={itemIndex} value={`${categoryIndex}-${itemIndex}`} className="border-b border-primary/20 last:border-0">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline text-white font-medium hover:text-primary transition-colors">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-white/80">
                      <p>{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        ))}
      </div>
      {faqSupportSection && (
        <div className="mt-10 casino-card p-6">
          <h2 className="text-xl font-semibold mb-4 text-primary">{faqSupportSection.title}</h2>
          <p className="text-white/80 mb-4">{faqSupportSection.description}</p>
          <div className="flex flex-wrap gap-4">
            {faqSupportSection.supportLinks?.map((link: any, i: number) => (
              <a
                key={i}
                href={link.href}
                target="_blank" 
                rel="noopener noreferrer"
                className="border border-primary/30 text-primary hover:bg-primary/10 font-medium rounded-lg px-4 py-2 text-sm transition flex items-center"
                dangerouslySetInnerHTML={{ __html: link.svgIcon + link.label }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
