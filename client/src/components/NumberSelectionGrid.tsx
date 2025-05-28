import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NumberSelectionGridProps {
  onNumbersSelected: (numbers: number[], lottoNumber: number | null) => void;
  initialNumbers?: number[];
  initialLottoNumber?: number | null;
}

export function NumberSelectionGrid({
  onNumbersSelected,
  initialNumbers = [],
  initialLottoNumber = null
}: NumberSelectionGridProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(initialNumbers);
  const [selectedLottoNumber, setSelectedLottoNumber] = useState<number | null>(initialLottoNumber);
  
  // Update parent when selections change
  useEffect(() => {
    onNumbersSelected(selectedNumbers, selectedLottoNumber);
  }, [selectedNumbers, selectedLottoNumber, onNumbersSelected]);
  
  // Handle main number selection
  const handleNumberClick = (num: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num);
      }
      if (prev.length < 5) {
        return [...prev, num].sort((a, b) => a - b);
      }
      return prev;
    });
  };
  
  // Handle LOTTO number selection
  const handleLottoNumberClick = (num: number) => {
    setSelectedLottoNumber(prev => prev === num ? null : num);
  };
  
  // Generate main numbers grid (1-70)
  const renderMainNumbers = () => {
    const numbers = [];
    for (let i = 1; i <= 70; i++) {
      numbers.push(
        <Button
          key={i}
          variant={selectedNumbers.includes(i) ? "default" : "outline"}
          className={`h-10 w-10 rounded-full p-0 text-sm font-medium transition-all ${
            selectedNumbers.includes(i)
              ? 'bg-primary text-black hover:bg-primary/90'
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
          onClick={() => handleNumberClick(i)}
        >
          {i < 10 ? `0${i}` : i}
        </Button>
      );
    }
    return numbers;
  };
  
  // Generate LOTTO numbers grid (1-30)
  const renderLottoNumbers = () => {
    const numbers = [];
    for (let i = 1; i <= 30; i++) {
      numbers.push(
        <Button
          key={i}
          variant={selectedLottoNumber === i ? "default" : "outline"}
          className={`h-10 w-10 rounded-full p-0 text-sm font-medium transition-all ${
            selectedLottoNumber === i
              ? 'bg-accent text-white hover:bg-accent/90'
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
          onClick={() => handleLottoNumberClick(i)}
        >
          {i < 10 ? `0${i}` : i}
        </Button>
      );
    }
    return numbers;
  };
  
  return (
    <div className="space-y-8">
      {/* Main Numbers Selection */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Select 5 Main Numbers</h3>
          <Badge variant="outline" className="text-white/70">
            {selectedNumbers.length}/5 Selected
          </Badge>
        </div>
        <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
          {renderMainNumbers()}
        </div>
      </div>
      
      {/* LOTTO Number Selection */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Select 1 LOTTO Number</h3>
          <Badge variant="outline" className="text-white/70">
            {selectedLottoNumber ? '1/1 Selected' : '0/1 Selected'}
          </Badge>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
          {renderLottoNumbers()}
        </div>
      </div>
    </div>
  );
} 