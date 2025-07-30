import { useState, useEffect } from 'react';
import React from 'react';
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
  Smartphone,
  Sparkles,
  TrendingUp,
  Award,
  Globe,
  Check,
  ArrowDown,
  MousePointer,
  Flame
} from 'lucide-react';

// Import Geist font
const GeistFontLink = () => {
  React.useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@100;200;300;400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);
  return null;
};

export function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    setIsVisible(true);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const features = [
    {
      icon: Target,
      title: 'Eisenhower Matrix',
      description: 'Prioritize with the proven 4-quadrant system used by presidents and CEOs.',
      gradient: 'from-red-500 to-orange-500'
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Get intelligent suggestions to optimize your daily productivity workflow.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Layers,
      title: 'Multiple Views',
      description: 'Switch seamlessly between matrix, list, and calendar views.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Smart Automation',
      description: 'Automate recurring tasks and set intelligent reminders.',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Track your productivity patterns and optimize your workflow.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share projects and collaborate with your team seamlessly.',
      gradient: 'from-indigo-500 to-purple-500'
    }
  ];

  const testimonials = [
    {
      quote: "TodoPro completely transformed our team's productivity. The Eisenhower Matrix is a game-changer.",
      author: "Sarah Chen",
      role: "Product Manager",
      company: "Stripe",
      avatar: "SC"
    },
    {
      quote: "The AI insights helped me identify patterns I never noticed. My focus improved dramatically.",
      author: "Marcus Johnson",
      role: "Startup Founder", 
      company: "TechFlow",
      avatar: "MJ"
    },
    {
      quote: "Simple, powerful, and actually helps me focus on what matters most each day.",
      author: "Elena Rodriguez",
      role: "Design Lead",
      company: "Figma",
      avatar: "ER"
    }
  ];

  const stats = [];


  return (
    <>
      <GeistFontLink />
      <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden font-['Geist',sans-serif] antialiased" style={{ fontFeatureSettings: '"cv11", "ss01"', fontVariationSettings: '"opsz" 32' }}>
      {/* Animated Background Elements with Parallax */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute rounded-full -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-green-400/10 to-emerald-500/10 blur-3xl animate-pulse"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px) translateY(${scrollY * 0.1}px)`
          }}
        ></div>
        <div 
          className="absolute delay-1000 rounded-full -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-neutral-700/20 to-neutral-600/20 blur-3xl animate-pulse"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px) translateY(${scrollY * 0.05}px)`
          }}
        ></div>
        <div 
          className="absolute rounded-full top-1/2 left-1/2 w-60 h-60 bg-gradient-to-r from-neutral-800/30 to-neutral-700/30 blur-3xl animate-pulse delay-2000"
          style={{
            transform: `translate(-50%, -50%) translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.015}px) translateY(${scrollY * 0.08}px)`
          }}
        ></div>
        {/* Grid pattern overlay with parallax */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20"
          style={{
            transform: `translateY(${scrollY * 0.02}px)`
          }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrollY > 50 
          ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-neutral-800/50 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="flex items-center justify-center w-8 h-8 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
                <div className="absolute w-3 h-3 bg-green-400 rounded-full -top-1 -right-1 animate-pulse"></div>
              </div>
              <span className="text-xl font-bold text-white">
                TodoPro
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="items-center hidden space-x-8 md:flex">
              <a href="#features" className="font-medium transition-colors text-neutral-300 hover:text-white">
                Features
              </a>
              <a href="#testimonials" className="font-medium transition-colors text-neutral-300 hover:text-white">
                Reviews
              </a>
              <Link to="/auth/signin" className="font-medium transition-colors text-neutral-300 hover:text-white">
                Sign In
              </Link>
              <Link to="/auth/signup">
                <Button className="text-white transition-all duration-300 bg-green-600 border-0 rounded-lg shadow-lg hover:bg-green-700 hover:shadow-xl hover:scale-105">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-neutral-300"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 inset-x-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-neutral-800 shadow-xl">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block font-medium text-neutral-300 hover:text-white">
                Features
              </a>
              <a href="#testimonials" className="block font-medium text-neutral-300 hover:text-white">
                Reviews
              </a>
              <Link to="/auth/signin" className="block font-medium text-neutral-300 hover:text-white">
                Sign In
              </Link>
              <Link to="/auth/signup">
                <Button className="w-full text-white bg-green-600 border-0 rounded-lg shadow-lg hover:bg-green-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div 
            className="text-center"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`
            }}
          >
            {/* Animated Badge */}
            <div className={`inline-flex items-center px-4 py-2 rounded-full bg-neutral-800/60 border border-neutral-700/50 mb-8 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <Sparkles className="w-4 h-4 mr-2 text-green-400" />
              <span className="text-sm font-medium text-neutral-200">
                Trusted by 50,000+ users worldwide
              </span>
            </div>

            {/* Main Headline */}
            <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight transition-all duration-1000 delay-200 font-['Geist',sans-serif] ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              <span className="text-white">
                Focus on what
              </span>
              <br />
              <span className="text-transparent bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text">
                matters most
              </span>
            </h1>

            <p className={`text-xl md:text-2xl text-neutral-400 mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-400 font-['Geist',sans-serif] ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ fontWeight: 400, lineHeight: 1.5 }}>
              The smart task management system that helps you prioritize with the 
              <span className="font-semibold text-green-400"> Eisenhower Matrix</span>, 
              powered by AI insights.
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-1000 delay-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <Link to="/auth/signup">
                <Button className="bg-green-600 hover:bg-green-700 text-white border-0 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-lg font-['Geist',sans-serif]">
                  Start Free Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            
            </div>

            {/* Stats */}
            <div 
              className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-800 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                transform: `translateY(${scrollY * 0.05}px)`
              }}
            >
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="text-center group">
                    <div className="inline-flex items-center justify-center w-12 h-12 mb-3 transition-transform duration-300 bg-neutral-800/60 rounded-xl group-hover:scale-110">
                      <IconComponent className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white font-['Geist',sans-serif]" style={{ fontWeight: 700 }}>{stat.number}</div>
                    <div className="text-sm text-neutral-400 font-['Geist',sans-serif]">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute transform -translate-x-1/2 bottom-8 left-1/2">
          <div className="flex flex-col items-center animate-bounce">
            <ArrowDown className="w-5 h-5 text-neutral-500" />
            <div className="w-0.5 h-8 bg-gradient-to-b from-neutral-500 to-transparent mt-2"></div>
          </div>
        </div>
      </section>

      {/* Interactive Product Preview */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-neutral-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-['Geist',sans-serif]" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              See TodoPro in action
            </h2>
            <p className="text-xl text-neutral-400 font-['Geist',sans-serif]">
              The Eisenhower Matrix that actually works
            </p>
          </div>

          <div 
            className="relative max-w-5xl mx-auto"
            style={{
              transform: `translateY(${scrollY * 0.03}px)`
            }}
          >
            <div className="overflow-hidden border shadow-2xl bg-neutral-800/60 rounded-3xl border-neutral-700/50 backdrop-blur-sm">
              {/* Browser Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-sm text-neutral-400 ml-4 font-['Geist',sans-serif]">
                    app.todopro.com
                  </div>
                </div>
              </div>

              {/* Matrix Preview */}
              <div className="p-8 bg-neutral-800/40">
                <div className="grid grid-cols-2 gap-6">
                  {/* Urgent & Important */}
                  <div className="p-6 transition-transform duration-300 border bg-red-900/20 backdrop-blur-sm rounded-2xl border-red-700/30 group hover:scale-105">
                    <div className="flex items-center mb-4">
                      <Flame className="w-5 h-5 mr-2 text-red-400" />
                      <h4 className="font-bold text-red-200 font-['Geist',sans-serif]">Do First</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-neutral-700/50 p-3 rounded-xl shadow-sm text-sm font-medium animate-pulse text-white font-['Geist',sans-serif]">
                        Fix production bug
                      </div>
                      <div className="bg-neutral-700/50 p-3 rounded-xl shadow-sm text-sm font-medium text-white font-['Geist',sans-serif]">
                        Client presentation today
                      </div>
                    </div>
                  </div>

                  {/* Important, Not Urgent */}
                  <div className="p-6 transition-transform duration-300 border bg-green-900/20 backdrop-blur-sm rounded-2xl border-green-700/30 group hover:scale-105">
                    <div className="flex items-center mb-4">
                      <Calendar className="w-5 h-5 mr-2 text-green-400" />
                      <h4 className="font-bold text-green-200 font-['Geist',sans-serif]">Schedule</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-neutral-700/50 p-3 rounded-xl shadow-sm text-sm font-medium text-white font-['Geist',sans-serif]">
                        Strategic planning
                      </div>
                      <div className="bg-neutral-700/50 p-3 rounded-xl shadow-sm text-sm font-medium text-white font-['Geist',sans-serif]">
                        Team 1:1 meetings
                      </div>
                    </div>
                  </div>

                  {/* Urgent, Not Important */}
                  <div className="p-6 transition-transform duration-300 border bg-yellow-900/20 backdrop-blur-sm rounded-2xl border-yellow-700/30 group hover:scale-105">
                    <div className="flex items-center mb-4">
                      <Users className="w-5 h-5 mr-2 text-yellow-400" />
                      <h4 className="font-bold text-yellow-200 font-['Geist',sans-serif]">Delegate</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-neutral-700/50 p-3 rounded-xl shadow-sm text-sm font-medium text-white font-['Geist',sans-serif]">
                        Email responses
                      </div>
                      <div className="bg-neutral-700/50 p-3 rounded-xl shadow-sm text-sm font-medium text-white font-['Geist',sans-serif]">
                        Quick status meeting
                      </div>
                    </div>
                  </div>

                  {/* Neither */}
                  <div className="p-6 transition-transform duration-300 border bg-neutral-700/20 backdrop-blur-sm rounded-2xl border-neutral-600/30 group hover:scale-105">
                    <div className="flex items-center mb-4">
                      <X className="w-5 h-5 mr-2 text-neutral-400" />
                      <h4 className="font-bold text-neutral-200 font-['Geist',sans-serif]">Eliminate</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-neutral-700/50 p-3 rounded-xl shadow-sm text-sm font-medium line-through opacity-60 text-neutral-400 font-['Geist',sans-serif]">
                        Social media browsing
                      </div>
                      <div className="bg-neutral-700/50 p-3 rounded-xl shadow-sm text-sm font-medium line-through opacity-60 text-neutral-400 font-['Geist',sans-serif]">
                        Endless meetings
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <div className="inline-flex items-center text-sm text-neutral-300 bg-neutral-700/50 px-4 py-2 rounded-full shadow-sm font-['Geist',sans-serif]">
                    <MousePointer className="w-4 h-4 mr-2" />
                    Interactive Eisenhower Matrix
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-['Geist',sans-serif]" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              Everything you need to stay productive
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto font-['Geist',sans-serif]">
              Powerful features designed to help you focus on what matters most
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={index} 
                  className="relative p-8 transition-all duration-500 border shadow-lg group bg-neutral-800/40 backdrop-blur-sm rounded-2xl hover:shadow-2xl hover:scale-105 border-neutral-700/50"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    transform: `translateY(${scrollY * (0.01 + index * 0.005)}px)`
                  }}
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors font-['Geist',sans-serif]" style={{ fontWeight: 600 }}>
                    {feature.title}
                  </h3>
                  <p className="text-neutral-300 leading-relaxed font-['Geist',sans-serif]">
                    {feature.description}
                  </p>
                  <div className={`absolute inset-0 bg-gradient-to-r from-green-400/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300`}></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section id="testimonials" className="px-4 py-20 sm:px-6 lg:px-8 bg-neutral-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-['Geist',sans-serif]" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              Loved by productive teams worldwide
            </h2>
            <p className="text-xl text-neutral-400 font-['Geist',sans-serif]">
              See what our users say about their productivity transformation
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="relative p-8 transition-all duration-500 border shadow-lg group bg-neutral-800/40 backdrop-blur-sm rounded-2xl hover:shadow-2xl hover:scale-105 border-neutral-700/50"
                style={{
                  transform: `translateY(${scrollY * (0.02 + index * 0.01)}px)`
                }}
              >
                <div className="absolute -top-4 left-8">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-gradient-to-r from-green-600 to-emerald-600">
                    <Quote className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="pt-4">
                  <p className="text-neutral-200 mb-6 leading-relaxed text-lg font-['Geist',sans-serif]">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 text-sm font-bold text-white rounded-full shadow-lg bg-gradient-to-r from-green-600 to-emerald-600">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-white font-['Geist',sans-serif]">{testimonial.author}</div>
                      <div className="text-sm text-neutral-400 font-['Geist',sans-serif]">{testimonial.role} at {testimonial.company}</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-green-400/5 to-emerald-500/5 rounded-2xl group-hover:opacity-100"></div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="relative px-4 py-20 overflow-hidden sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Geist',sans-serif]" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Ready to transform your productivity?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-['Geist',sans-serif]">
            Join 50,000+ users who've already discovered the power of focused task management
          </p>
          
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/auth/signup">
              <Button className="bg-white text-green-600 hover:bg-neutral-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-['Geist',sans-serif]">
                Start Free Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white bg-neutral-950">
        <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6 space-x-3">
                <div className="flex items-center justify-center w-8 h-8 shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold font-['Geist',sans-serif]">TodoPro</span>
              </div>
              <p className="text-neutral-400 mb-6 max-w-md font-['Geist',sans-serif]">
                The smart task management system that helps you focus on what matters most. 
                Built for modern teams and individuals.
              </p>
              <div className="flex space-x-4">
                {/* Social links would go here */}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4 font-['Geist',sans-serif]">Product</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#features" className="hover:text-white transition-colors font-['Geist',sans-serif]">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-['Geist',sans-serif]">Updates</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-['Geist',sans-serif]">API</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 font-['Geist',sans-serif]">Company</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors font-['Geist',sans-serif]">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-['Geist',sans-serif]">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-['Geist',sans-serif]">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-['Geist',sans-serif]">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 mt-12 text-center border-t border-neutral-800">
            <p className="text-neutral-400 font-['Geist',sans-serif]">
              © 2024 TodoPro. Built with ❤️ for productive teams worldwide.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}