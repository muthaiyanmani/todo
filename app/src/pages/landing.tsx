import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function Landing() {
  const features = [
    {
      title: 'Smart Task Management',
      description: 'Organize tasks with AI-powered suggestions and intelligent categorization.',
      icon: '🧠',
    },
    {
      title: 'Offline-First',
      description: 'Create and manage tasks even without internet. Syncs when online.',
      icon: '📱',
    },
    {
      title: 'Calendar Integration',
      description: 'Visualize your tasks in calendar view with drag-and-drop scheduling.',
      icon: '📅',
    },
    {
      title: 'Smart Reminders',
      description: 'Never miss a deadline with intelligent notifications and reminders.',
      icon: '⏰',
    },
    {
      title: 'PWA Support',
      description: 'Install on any device and use like a native app.',
      icon: '📲',
    },
    {
      title: 'Dark Mode',
      description: 'Beautiful interface that adapts to your preferred theme.',
      icon: '🌙',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-foreground">Smart Todo Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            The Smart Way to Manage Your Tasks
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            An intelligent, offline-first task management app that helps you stay organized and
            productive with AI-powered insights and seamless synchronization.
          </p>
          <div className="space-x-4">
            <Link to="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Free Today
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Stay Productive
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you manage tasks efficiently, whether you're online
              or offline.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="text-4xl mb-2">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Productivity?
          </h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already discovered the power of smart task management.
          </p>
          <Link to="/auth/signup">
            <Button size="lg" className="text-lg px-8 py-3">
              Get Started Now - Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 Smart Todo Pro. Built with React, TypeScript, and modern web technologies.
          </p>
        </div>
      </footer>
    </div>
  );
}
