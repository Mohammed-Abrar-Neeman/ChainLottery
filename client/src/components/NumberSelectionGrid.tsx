import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface NumberSelectionGridProps {
  onNumbersSelected: (numbers: number[], lottoNumber: number | null) => void;
  initialNumbers?: number[];
  initialLottoNumber?: number | null;
  key?: string | number; // Add key prop to force re-render
}

export function NumberSelectionGrid({
  onNumbersSelected,
  initialNumbers = [],
  initialLottoNumber = null,
  key
}: NumberSelectionGridProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(initialNumbers);
  const [selectedLottoNumber, setSelectedLottoNumber] = useState<number | null>(initialLottoNumber);
  
  // Update state when initialNumbers or initialLottoNumber changes
  useEffect(() => {
    setSelectedNumbers(initialNumbers);
    setSelectedLottoNumber(initialLottoNumber);
  }, [initialNumbers, initialLottoNumber, key]);
  
  // Update parent when selections change
  useEffect(() => {
    onNumbersSelected(selectedNumbers, selectedLottoNumber);
  }, [selectedNumbers, selectedLottoNumber, onNumbersSelected]);
  
  // Handle main number selection
  const handleNumberClick = (number: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      }
      if (prev.length < 5) {
        return [...prev, number].sort((a, b) => a - b);
      }
      return prev;
    });
  };
  
  // Handle LOTTO number selection
  const handleLottoNumberClick = (number: number) => {
    setSelectedLottoNumber(prev => prev === number ? null : number);
  };
  
  // Generate number grid
  const renderNumberGrid = (start: number, end: number, isLotto: boolean = false) => {
    const numbers = [];
    for (let i = start; i <= end; i++) {
      const isSelected = isLotto 
        ? selectedLottoNumber === i
        : selectedNumbers.includes(i);
      
      numbers.push(
        <Button
          key={i}
          variant={isSelected ? "default" : "outline"}
          size="sm"
          className={`h-8 w-8 rounded-full p-0 text-xs font-medium transition-all ${
            isSelected 
              ? isLotto 
                ? "bg-accent text-white hover:bg-accent/90" 
                : "bg-primary text-white hover:bg-primary/90"
              : "bg-black/20 text-white hover:bg-black/30"
          }`}
          onClick={() => isLotto ? handleLottoNumberClick(i) : handleNumberClick(i)}
        >
          {i < 10 ? `0${i}` : i}
        </Button>
      );
    }
    return numbers;
  };
  
  return (
    <div className="space-y-4">
      {/* Main Numbers Grid */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-white">Select 5 Main Numbers (1-70)</h3>
          <span className="text-xs text-white/70">
            {selectedNumbers.length}/5 selected
          </span>
        </div>
        <div className="grid grid-cols-10 gap-1">
          {renderNumberGrid(1, 70)}
        </div>
      </div>
      
      {/* LOTTO Number Grid */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-white">Select 1 LOTTO Number (1-30)</h3>
          <span className="text-xs text-white/70">
            {selectedLottoNumber ? "1/1 selected" : "0/1 selected"}
          </span>
        </div>
        <div className="grid grid-cols-10 gap-1">
          {renderNumberGrid(1, 30, true)}
        </div>
      </div>
    </div>
  );
} 