import { useState } from 'react';
import emailjs from '@emailjs/browser';
import { useToast } from '@/hooks/use-toast';

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await emailjs.send(
        'service_wgphbkk',
        'template_dzxttak',
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: `You received a message from ${formData.name} (${formData.email}):\n\n${formData.message}`,
          to_name: 'CryptoLotto Support',
          to_email: 'abrarn@etherauthority.io'
        },
        'Icy29GNRklX_YE3vm'
      );

      toast({
        title: "Message Sent!",
        description: "We'll get back to you as soon as possible.",
        variant: "default",
      });

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-yellow-500 to-amber-500 text-transparent bg-clip-text mb-4">
          Contact Us
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Have questions about our blockchain lottery platform? We're here to help. Send us a message and we'll get back to you as soon as possible.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Get in Touch</h2>
            <p className="text-gray-400">
              We're here to help with any questions you might have about our platform, blockchain technology, or lottery services.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium">Email</h3>
                <p className="text-gray-400">support@cryptolotto.com</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium">Live Chat</h3>
                <p className="text-gray-400">Available 24/7</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-400 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="How can we help?"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              placeholder="Your message here..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary via-yellow-500 to-amber-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
} 