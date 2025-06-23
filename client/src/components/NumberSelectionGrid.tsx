import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';

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
  // Use props directly for controlled behavior
  const selectedNumbers = initialNumbers;
  const selectedLottoNumber = initialLottoNumber;

  // Handle main number selection
  const handleNumberClick = (num: number) => {
    let newNumbers;
    if (selectedNumbers.length < 5) {
      newNumbers = [...selectedNumbers, num];
    } else {
      newNumbers = [...selectedNumbers.slice(0, -1), num];
    }
    onNumbersSelected(newNumbers, selectedLottoNumber);
  };

  // Handle LOTTO number selection
  const handleLottoNumberClick = (num: number) => {
    onNumbersSelected(selectedNumbers, selectedLottoNumber === num ? null : num);
  };

  // Handle reset button click
  const handleReset = () => {
    onNumbersSelected([], null);
  };

  // Generate main numbers grid (1-70)
  const renderMainNumbers = () => {
    const numbers = [];
    for (let i = 1; i <= 70; i++) {
      const count = selectedNumbers.filter(n => n === i).length;
      const isSelected = count > 0;
      numbers.push(
        <Button
          key={i}
          variant={isSelected ? "default" : "outline"}
          className={`h-10 w-10 rounded-full p-0 text-sm font-medium transition-all relative ${
            isSelected
              ? 'bg-primary text-black hover:bg-primary/90'
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
          onClick={() => handleNumberClick(i)}
        >
          {i < 10 ? `0${i}` : i}
          {count > 1 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {count}
            </span>
          )}
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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-white/70">
              {selectedNumbers.length}/5 Selected
            </Badge>
            {(selectedNumbers.length > 0 || selectedLottoNumber !== null) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 px-2 py-0 text-xs border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
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