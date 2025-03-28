import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSection() {
  // FAQ data
  const faqItems = [
    {
      question: "How does the lottery work?",
      answer: "CryptoLotto is a decentralized lottery running on Ethereum. Each ticket costs 0.01 ETH. When you purchase tickets, your entry is recorded on the blockchain. At the end of each round (approximately 24 hours), a winner is selected randomly using Chainlink VRF (Verifiable Random Function), ensuring fairness and transparency. The winner automatically receives 70% of the pool, 20% goes to the next round's starting pot, and 10% goes to the treasury."
    },
    {
      question: "How do I know the lottery is fair?",
      answer: "The lottery uses Chainlink VRF (Verifiable Random Function) to guarantee that winners are selected in a provably fair and verifiable manner. All code is open-source and can be audited. The smart contract is deployed on the Ethereum blockchain, making all transactions transparent and verifiable."
    },
    {
      question: "When do I receive my winnings?",
      answer: "If you win, the prize is automatically sent to your wallet address immediately after the winner is selected. There's no need to claim your prize manually. You can verify the transaction on the Ethereum blockchain."
    },
    {
      question: "What are the gas fees for entering?",
      answer: "Gas fees depend on the current network congestion of the Ethereum network. The DApp will display an estimated gas fee before you confirm your transaction. You can adjust the gas price to potentially speed up or slow down your transaction."
    },
    {
      question: "Can I buy tickets from any country?",
      answer: "CryptoLotto is a decentralized application running on the blockchain, so technically anyone with an Ethereum wallet can participate. However, it's your responsibility to ensure that participating in blockchain-based lotteries complies with your local laws and regulations."
    }
  ];

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
      
      <div className="glass rounded-2xl shadow-glass p-6 lg:p-8">
        <Accordion type="single" collapsible className="space-y-6">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="mt-3 text-gray-600">
                <p>{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
