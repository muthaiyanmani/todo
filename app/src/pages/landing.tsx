import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  CheckSquare, 
  Brain, 
  Calendar, 
  Star, 
  Sun, 
  Zap, 
  ArrowRight,
  Play,
  Menu,
  X,
  Target,
  Clock,
  Layers,
  Users,
  Quote,
  ChevronRight,
  BarChart3,
  Shield,
  Smartphone
} from 'lucide-react';

export function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const coreFeatures = [
    {
      icon: Target,
      title: 'Eisenhower Matrix',
      description: 'Prioritize with the proven 4-quadrant system used by presidents and CEOs.'
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Get intelligent suggestions to optimize your daily productivity workflow.'
    },
    {
      icon: Layers,
      title: 'Multiple Views',
      description: 'Switch seamlessly between matrix, list, and calendar views.'
    }
  ];

  const testimonials = [
    {
      quote: "TodoPro transformed how I manage my daily priorities. The Eisenhower Matrix finally makes sense.",
      author: "Sarah Chen",
      role: "Product Manager",
      company: "Stripe"
    },
    {
      quote: "The AI insights helped me identify patterns in my productivity I never noticed before.",
      author: "Marcus Johnson",
      role: "Startup Founder",
      company: "TechFlow"
    },
    {
      quote: "Simple, powerful, and actually helps me focus on what matters most each day.",
      author: "Elena Rodriguez",
      role: "Design Lead",
      company: "Figma"
    }
  ];

  const stats = [
    { number: '15K+', label: 'Teams', icon: Users },
    { number: '99.9%', label: 'Uptime', icon: Shield },
    { number: '4.8★', label: 'Rating', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      {/* Navigation */}
      <nav className="relative z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gray-900 dark:bg-white rounded-md flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-white dark:text-gray-900" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                TodoPro
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Features
              </a>
              <a href="#customers" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Customers
              </a>
              <Link to="/auth/signin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/auth/signup">
                <Button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 border-0 text-sm px-4 py-2">
                  Start building
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 dark:text-gray-400"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 inset-x-0 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Features
              </a>
              <a href="#customers" className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Customers
              </a>
              <Link to="/auth/signin" className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Sign In
              </Link>
              <Link to="/auth/signup">
                <Button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-0">
                  Start building
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 leading-tight">
              <span className="text-gray-900 dark:text-white">
                Build and ship
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                your productivity
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              The task management system that prioritizes what matters. 
              Built for teams and individuals who value focus over chaos.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              <Link to="/auth/signup">
                <Button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 px-6 py-3 text-base border-0">
                  Start building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" className="border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-6 py-3 text-base">
                <Play className="mr-2 h-4 w-4" />
                See how it works
              </Button>
            </div>

            {/* Stats */}
            <div className="flex justify-center items-center gap-12 text-sm text-gray-600 dark:text-gray-400">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span className="font-medium text-gray-900 dark:text-white">{stat.number}</span>
                    <span>{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
            <div className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Urgent & Important</h4>
                    <div className="space-y-2">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded text-sm">Fix production bug</div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded text-sm">Client presentation</div>
                    </div>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Important, Not Urgent</h4>
                    <div className="space-y-2">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded text-sm">Strategic planning</div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded text-sm">Team 1:1s</div>
                    </div>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Urgent, Not Important</h4>
                    <div className="space-y-2">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded text-sm">Email responses</div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded text-sm">Quick meeting</div>
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Neither</h4>
                    <div className="space-y-2">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded text-sm">Social media</div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded text-sm">Random browsing</div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">The Eisenhower Matrix - Focus on what matters</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-4">
              Built for modern productivity
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Three core capabilities that transform how you manage tasks and priorities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 dark:bg-white rounded-lg mb-4 group-hover:scale-105 transition-transform">
                    <IconComponent className="h-6 w-6 text-white dark:text-gray-900" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section id="customers" className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-4">
              Loved by teams worldwide
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              See how TodoPro transforms daily productivity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <Quote className="h-5 w-5 text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {testimonial.author[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{testimonial.author}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role} at {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 dark:bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Start building better habits
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of teams and individuals who prioritize what matters most
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/signup">
              <Button className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 text-base border-0">
                Start building
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800 px-6 py-3 text-base">
              <Play className="mr-2 h-4 w-4" />
              See how it works
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-gray-900 dark:bg-white rounded-md flex items-center justify-center">
                  <CheckSquare className="h-3 w-3 text-white dark:text-gray-900" />
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">TodoPro</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm text-sm">
                Purpose-built task management for modern teams. Prioritize what matters with the Eisenhower Matrix.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-gray-900 dark:text-white font-medium mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#features" className="hover:text-gray-900 dark:hover:text-white">Features</a></li>
                <li><a href="#customers" className="hover:text-gray-900 dark:hover:text-white">Customers</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Changelog</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">API</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-gray-900 dark:text-white font-medium mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 TodoPro. Built for productivity teams worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}