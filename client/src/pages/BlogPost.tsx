import { useRoute } from 'wouter';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useConfigData } from '@/hooks/useConfigData';

const API_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'http://167.172.76.74:3001';

function getImageUrl(url: string) {
  if (url?.startsWith('/images/')) {
    return API_URL + url;
  }
  return url;
}

export default function BlogPost() {
  const [, params] = useRoute('/blogs/:id');
  const { data: config, isLoading, error } = useConfigData();

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Loading blog post...</div>;
  }
  if (error || !config) {
    return <div className="text-center py-12 text-red-500">Failed to load blog post.</div>;
  }

  const post = config.blogPosts?.find((p: any) => p.id === params?.id);

  if (!post) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-4">Blog post not found</h1>
        <Link href="/blogs">
          <span className="text-primary hover:text-primary/80 transition-colors">
            Return to blogs
          </span>
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto">
      {/* Back button */}
      <Link href="/blogs">
        <div className="flex items-center text-primary hover:text-primary/80 transition-colors mb-8 cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to Blogs</span>
        </div>
      </Link>

      {/* Banner image */}
      {post.bannerPhoto && (
        <div className="relative h-[400px] rounded-xl overflow-hidden mb-8">
          <img
            src={getImageUrl(post.bannerPhoto)}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Header */}
      <header className={`mb-12 ${!post.bannerPhoto ? 'mt-8' : ''}`}>
        <div className="flex items-center text-sm text-gray-400 mb-4">
          <Calendar className="h-4 w-4 mr-2" />
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-yellow-500 to-amber-500 text-transparent bg-clip-text mb-4">
          {post.title}
        </h1>
        <p className="text-xl text-gray-400">
          {post.description}
        </p>
      </header>

      {/* Content */}
      <div className="prose prose-invert max-w-none">
        {post.sections.map((section: any, index: number) => (
          <div key={index} className="mb-12">
            <div className={`grid ${section.photo ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-8 items-center ${index > 0 ? 'mt-12' : ''}`}>
              {/* Content - Alternates between left and right */}
              <div className={`${section.photo ? (index % 2 === 0 ? 'order-1' : 'order-2') : 'max-w-3xl mx-auto'}`}>
                <p className="text-gray-300 leading-relaxed text-lg">
                  {section.content}
                </p>
              </div>

              {/* Photo - Alternates between right and left */}
              {section.photo && (
                <div className={`relative h-[300px] rounded-lg overflow-hidden ${index % 2 === 0 ? 'order-2' : 'order-1'}`}>
                  <img
                    src={getImageUrl(section.photo)}
                    alt={`Section ${index + 1} illustration`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
} 