import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';

export default function FAQ() {
  const faqCategories = [
    {
      title: "General",
      items: [
        {
          question: "What is CryptoLotto?",
          answer: "CryptoLotto is a decentralized lottery running on the Ethereum blockchain. It allows users to buy tickets using ETH and participate in regular lottery draws. The platform ensures transparency and fairness through smart contracts and verifiable randomness."
        },
        {
          question: "How does the lottery work?",
          answer: "CryptoLotto is a decentralized lottery running on Ethereum. Each ticket costs 0.01 ETH. When you purchase tickets, your entry is recorded on the blockchain. At the end of each round (approximately 24 hours), a winner is selected randomly using Chainlink VRF (Verifiable Random Function), ensuring fairness and transparency. The winner automatically receives 70% of the pool, 20% goes to the next round's starting pot, and 10% goes to the treasury."
        },
        {
          question: "How frequently are lottery draws held?",
          answer: "Lottery rounds typically last for 24 hours, after which a new round begins. The exact timing can be seen on the homepage with the countdown timer showing time remaining for the current round."
        }
      ]
    },
    {
      title: "Tickets & Participation",
      items: [
        {
          question: "How much does a ticket cost?",
          answer: "Each lottery ticket costs 0.01 ETH. You can purchase multiple tickets (up to 100) in a single transaction to increase your winning chances."
        },
        {
          question: "How many tickets can I buy?",
          answer: "You can purchase between 1 and 100 tickets in a single transaction. There is no limit to how many tickets you can buy across multiple transactions, but each transaction is limited to 100 tickets to prevent network congestion."
        },
        {
          question: "Can I buy tickets from any country?",
          answer: "CryptoLotto is a decentralized application running on the blockchain, so technically anyone with an Ethereum wallet can participate. However, it's your responsibility to ensure that participating in blockchain-based lotteries complies with your local laws and regulations."
        }
      ]
    },
    {
      title: "Winning & Prizes",
      items: [
        {
          question: "How do I know if I've won?",
          answer: "If you win, the prize will be automatically sent to your wallet address immediately after the winner is selected. You can also check your status in the 'My Tickets' section, where winning tickets will be marked. Additionally, all past winners are displayed in the 'History' section."
        },
        {
          question: "How do I receive my winnings?",
          answer: "If you win, the prize is automatically sent to your wallet address immediately after the winner is selected. There's no need to claim your prize manually. You can verify the transaction on the Ethereum blockchain."
        },
        {
          question: "How is the prize distributed?",
          answer: "70% of the total pool goes to the winner, 20% is added to the next lottery round's starting pool, and 10% goes to the treasury for platform maintenance and development."
        }
      ]
    },
    {
      title: "Technical & Security",
      items: [
        {
          question: "How do I know the lottery is fair?",
          answer: "The lottery uses Chainlink VRF (Verifiable Random Function) to guarantee that winners are selected in a provably fair and verifiable manner. All code is open-source and can be audited. The smart contract is deployed on the Ethereum blockchain, making all transactions transparent and verifiable."
        },
        {
          question: "What are the gas fees for entering?",
          answer: "Gas fees depend on the current network congestion of the Ethereum network. The DApp will display an estimated gas fee before you confirm your transaction. You can adjust the gas price to potentially speed up or slow down your transaction."
        },
        {
          question: "Is the smart contract audited?",
          answer: "Yes, the smart contract has been audited by independent security firms to ensure its security and reliability. You can find the audit reports in our GitHub repository linked in the footer."
        },
        {
          question: "What happens if there are no participants in a round?",
          answer: "In the unlikely event that no tickets are purchased during a round, the pool will roll over entirely to the next round, making the next jackpot even larger."
        }
      ]
    }
  ];

  return (
    <div className="mt-8 mb-16">
      <div className="flex items-center mb-8">
        <HelpCircle className="h-6 w-6 text-primary mr-2" />
        <h1 className="text-2xl font-bold">Frequently Asked Questions</h1>
      </div>
      
      <div className="space-y-8">
        {faqCategories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">{category.title}</h2>
            
            <div className="glass rounded-2xl shadow-glass overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item, itemIndex) => (
                  <AccordionItem key={itemIndex} value={`${categoryIndex}-${itemIndex}`} className="border-b border-gray-200 last:border-0">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline text-gray-900 font-medium">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-gray-600">
                      <p>{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-10 glass rounded-2xl shadow-glass p-6">
        <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
        <p className="text-gray-600 mb-4">
          If you couldn't find the answer to your question, please reach out to our community on Discord or Telegram. Our team and community members are always happy to help.
        </p>
        <div className="flex flex-wrap gap-4">
          <a 
            href="#" 
            className="bg-primary bg-opacity-10 text-primary hover:bg-opacity-20 font-medium rounded-lg px-4 py-2 text-sm transition flex items-center"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#6C63FF"/>
            </svg>
            Join Discord
          </a>
          <a 
            href="#" 
            className="bg-primary bg-opacity-10 text-primary hover:bg-opacity-20 font-medium rounded-lg px-4 py-2 text-sm transition flex items-center"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 15.55C16.4 16.31 15.3 16.66 14.58 16.12C13.19 15.11 11.3 14.45 9.19 14.82C8.15 15.03 7.08 14.31 7.08 13.25C7.08 12.26 7.97 11.55 8.96 11.68C11.79 12.04 14.25 12.88 16.15 14.37C16.82 14.88 17.09 15.18 16.64 15.55Z" fill="#6C63FF"/>
            </svg>
            Join Telegram
          </a>
          <a 
            href="mailto:support@cryptolotto.com" 
            className="bg-primary bg-opacity-10 text-primary hover:bg-opacity-20 font-medium rounded-lg px-4 py-2 text-sm transition flex items-center"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#6C63FF"/>
            </svg>
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
}
