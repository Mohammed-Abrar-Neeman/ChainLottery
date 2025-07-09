import React from 'react';

export function TutorialContent() {
  return (
    <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">LOTTO DApp Tutorial</h1>
        
        <p className="text-lg mb-6">
          Welcome to the Decentralized Blockchain Lottery Platform!
        </p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. Getting Started</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Connect your Ethereum wallet by clicking the "Connect Wallet" button in the header.</li>
            <li>Make sure you're on the Sepolia test network to participate in the lottery.</li>
            <li>You can get test POL from the Sepolia faucet if needed for transactions.</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. How to Play</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Choose a lottery series from the dropdown menu.</li>
            <li>Each lottery series has a different difficulty level and prize structure.</li>
            <li>Buy tickets for the current draw by clicking the "Buy Tickets" button.</li>
            <li>Each ticket costs 0.0001 POL.</li>
            <li>For a Quick Pick, click "Generate Random Numbers" to get 5 numbers plus 1 LOTTO number.</li>
            <li>Alternatively, you can select your own numbers manually.</li>
            <li>Confirm your purchase by signing the transaction with your wallet.</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">3. Lottery Format</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Each lottery ticket consists of 5 main numbers (01-70) and 1 LOTTO number (01-30).</li>
            <li>Draws occur twice weekly, every Tuesday and Friday.</li>
            <li>Winners are determined by matching your numbers with the winning numbers.</li>
            <li>The more numbers you match, the higher your prize tier.</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">4. Prize Tiers</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Match 5 + LOTTO: Jackpot (100% of the prize pool)</li>
            <li>Match 5: 10% of the prize pool</li>
            <li>Match 4 + LOTTO: 5% of the prize pool</li>
            <li>Match 4: 2% of the prize pool</li>
            <li>Match 3 + LOTTO: 1% of the prize pool</li>
            <li>Match 3: 0.5% of the prize pool</li>
            <li>Match 2 + LOTTO: 0.2% of the prize pool</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. Checking Results & Claiming Prizes</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>After a draw is complete, check your tickets in the "My Tickets" section.</li>
            <li>Winning tickets will display a "Claim" button if you've won a prize.</li>
            <li>Click "Claim" to receive your winnings directly to your wallet.</li>
            <li>All transactions are recorded on the blockchain for transparency.</li>
          </ul>
        </section>
        
        <div className="mt-8 p-4 bg-black/10 rounded-lg">
          <p className="text-lg italic">
            Note: This is a DApp running on the Sepolia testnet. While the gameplay mirrors a real lottery, it uses test POL, not real currency.
          </p>
        </div>
      </div>
    </div>
  );
}