import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { TutorialModal } from '@/components/modals/TutorialModal';
import { useConfigData } from '@/hooks/useConfigData';

export default function PromoBanner() {
  const { data: config, isLoading, error } = useConfigData();
  const bannerImages = config?.promoBanners || [];

  const API_URL =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3001'
      : 'https://api.lottoblokk.com';

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('/images/')) {
      return API_URL + url;
    }
    return url;
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [imageLoadError, setImageLoadError] = useState<Record<number, boolean>>({});
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Function to advance to the next slide
  const goToNextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => bannerImages.length > 0 ? (prevIndex + 1) % bannerImages.length : 0);
  }, [bannerImages.length]);

  // Function to go to the previous slide
  const goToPrevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => bannerImages.length > 0 ? (prevIndex - 1 + bannerImages.length) % bannerImages.length : 0);
  }, [bannerImages.length]);

  // Set up autoplay
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (autoplay && bannerImages.length > 1) {
      intervalId = setInterval(() => {
        goToNextSlide();
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoplay, goToNextSlide, bannerImages.length]);

  // Reset autoplay when user manually changes the slide
  const handleManualNavigation = (index: number) => {
    setCurrentIndex(index);
    setAutoplay(false);
    setTimeout(() => {
      setAutoplay(true);
    }, 10000);
  };

  // Handle image load errors
  const handleImageError = (index: number) => {
    setImageLoadError(prev => ({
      ...prev,
      [index]: true
    }));
  };

  // Preload the current image and check for errors
  useEffect(() => {
    if (!bannerImages.length) return;
    const img = new window.Image();
    img.src = getImageUrl(bannerImages[currentIndex]?.url);
    img.onerror = () => handleImageError(currentIndex);
    return () => {
      img.onerror = null;
    };
  }, [currentIndex, bannerImages]);

  if (isLoading) {
    return <div className="w-full h-[100svh] flex items-center justify-center text-gray-400 bg-black">Loading banners...</div>;
  }
  if (error || !bannerImages.length) {
    return <div className="w-full h-[100svh] flex items-center justify-center text-red-500 bg-black">Failed to load banners.</div>;
  }

  // Get the current banner
  const currentBanner = bannerImages[currentIndex];
  const hasImageError = imageLoadError[currentIndex];
  const cta = (currentBanner as any)?.cta as
    | { label?: string; href?: string; action?: string; modal?: string }
    | undefined;

  const handleCta = () => {
    if (!cta) {
      setTutorialOpen(true);
      return;
    }
    if (cta.action === 'openModal' && cta.modal === 'tutorial') {
      setTutorialOpen(true);
      return;
    }
    if (cta.action === 'external' && cta.href) {
      window.open(cta.href, '_blank', 'noopener,noreferrer');
      return;
    }
    if (cta.action === 'navigate' && cta.href) {
      window.location.href = cta.href;
      return;
    }
    setTutorialOpen(true);
  };

  return (
    <div className="relative w-full overflow-hidden bg-black">
      {/* Active banner */}
      <div 
        key={currentBanner.id}
        className="relative w-full min-h-[100svh] md:min-h-[92svh] lg:min-h-[88svh] transition-opacity duration-500"
      >
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${hasImageError ? currentBanner.fallbackColor : ''}`}
          style={{ 
            backgroundImage: hasImageError ? 'none' : `url(${getImageUrl(currentBanner.url)})`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        </div>
        <div className="container mx-auto relative z-10 flex flex-col justify-center h-full py-6 md:py-10 px-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-3 md:mb-6 leading-tight">
              {currentBanner.title}
            </h2>
            <p className="text-base sm:text-lg md:text-2xl text-white/90 mb-4 md:mb-8 max-w-xl leading-relaxed">
              {currentBanner.description}
            </p>
            {/* Mobile CTA directly under text */}
            <div className="md:hidden">
              <Button 
                className={`${currentBanner.id === 4
                  ? 'mt-2 w-40 sm:w-48 max-w-[80vw] h-auto min-h-12 sm:min-h-14 px-5 sm:px-6 py-3 text-base sm:text-lg bg-primary hover:bg-primary/90 font-semibold whitespace-normal break-words text-center leading-snug'
                  : 'mt-2 w-40 sm:w-48 h-12 sm:h-14 text-base sm:text-lg bg-primary hover:bg-primary/90 font-semibold'
                }`}
                onClick={handleCta}
              >
                {cta?.label ?? 'Learn More'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-8 left-0 right-0 hidden md:flex justify-center gap-3">
        {bannerImages.map((_: unknown, index: number) => (
          <button
            key={index}
            className={`w-4 h-4 rounded-full transition-all ${
              currentIndex === index ? 'bg-white w-8' : 'bg-white/60'
            }`}
            onClick={() => handleManualNavigation(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Previous/Next buttons */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-black/40 border-none text-white hover:bg-black/60 z-20 h-14 w-14 rounded-full shadow-lg"
        onClick={() => {
          goToPrevSlide();
          handleManualNavigation(currentIndex > 0 ? currentIndex - 1 : bannerImages.length - 1);
        }}
        aria-label="Previous slide"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-black/40 border-none text-white hover:bg-black/60 z-20 h-14 w-14 rounded-full shadow-lg"
        onClick={() => {
          goToNextSlide();
          handleManualNavigation((currentIndex + 1) % bannerImages.length);
        }}
        aria-label="Next slide"
      >
        <ArrowRight className="h-6 w-6" />
      </Button>

      {/* Bottom-left CTA below arrows, above dots */}
      <div className="hidden md:block absolute left-0 right-0 z-30 bottom-40 sm:bottom-36 md:bottom-24">
        <div className="container mx-auto px-4 flex justify-start">
          <Button
            className="w-40 sm:w-48 md:w-56 h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl bg-primary hover:bg-primary/90 font-semibold"
            onClick={handleCta}
          >
            {cta?.label ?? 'Learn More'}
          </Button>
        </div>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal 
        isOpen={tutorialOpen} 
        onClose={() => setTutorialOpen(false)} 
      />
    </div>
  );
}