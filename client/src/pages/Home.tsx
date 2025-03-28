import React from 'react';
import HeroBanner from '@/components/HeroBanner';
import LotteryStats from '@/components/LotteryStats';
import BuyTickets from '@/components/BuyTickets';
import ParticipantsList from '@/components/ParticipantsList';
import PastWinners from '@/components/PastWinners';
import FAQSection from '@/components/FAQSection';

export default function Home() {
  return (
    <>
      <HeroBanner />
      <LotteryStats />
      <BuyTickets />
      <ParticipantsList />
      <PastWinners />
      <FAQSection />
    </>
  );
}
