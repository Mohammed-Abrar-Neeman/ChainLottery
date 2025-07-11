import { Link } from 'wouter';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useConfigData } from '@/hooks/useConfigData';

const API_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://api.lottoblokk.com';

function getImageUrl(url: string) {
  if (url?.startsWith('/images/')) {
    return API_URL + url;
  }
  return url;
}

export default function Blogs() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: config, isLoading, error } = useConfigData();
  const blogPosts = config?.blogPosts || [];

  const nextSlide = () => {
    const isMobile = window.innerWidth < 768;
    const maxIndex = isMobile ? blogPosts.length - 1 : blogPosts.length - 3;
    setCurrentIndex((prevIndex) => 
      prevIndex >= maxIndex ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    const isMobile = window.innerWidth < 768;
    const maxIndex = isMobile ? blogPosts.length - 1 : blogPosts.length - 3;
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? maxIndex : prevIndex - 1
    );
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Loading blogs...</div>;
  }
  if (error) {
    return <div className="text-center py-12 text-red-500">Failed to load blogs.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-yellow-500 to-amber-500 text-transparent bg-clip-text mb-4">
          Latest from CryptoLotto
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Stay updated with the latest news, insights, and developments in the world of blockchain lotteries.
        </p>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 md:px-12">
        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Carousel Container */}
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ 
              transform: `translateX(-${currentIndex * (window.innerWidth < 768 ? 100 : 100/3)}%)` 
            }}
          >
            {blogPosts.map((post: any) => (
              <div key={post.id} className="w-full md:w-1/3 flex-shrink-0 px-2">
                <Link href={`/blogs/${post.id}`}>
                  <article className="casino-card group cursor-pointer transition-all duration-300 hover:scale-[1.02] h-full flex flex-col">
                    <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
                      <img
                        src={getImageUrl(post.bannerPhoto)}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center text-sm text-gray-400 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      
                      <h2 className="text-lg font-bold text-white mb-2 line-clamp-2">
                        {post.title}
                      </h2>
                      
                      <p className="text-gray-400 line-clamp-3 flex-1 text-sm">
                        {post.description}
                      </p>
                      
                      <div className="mt-3 flex items-center text-primary">
                        <span className="text-sm font-medium">Read More</span>
                        <svg
                          className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ 
            length: Math.ceil(blogPosts.length / (window.innerWidth < 768 ? 1 : 3)) 
          }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * (window.innerWidth < 768 ? 1 : 3))}
              className={`w-2 h-2 rounded-full transition-all ${
                Math.floor(currentIndex / (window.innerWidth < 768 ? 1 : 3)) === index 
                  ? 'bg-primary w-4' 
                  : 'bg-gray-600'
              }`}
              aria-label={`Go to slide group ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 