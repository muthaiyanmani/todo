import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { 
  HelpCircle, 
  Mail, 
  MessageSquare, 
  Book, 
  Keyboard, 
  ExternalLink,
  ChevronRight,
  Phone,
  FileText
} from 'lucide-react';

export function Help() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: ''
  });

  const handleSupportSubmit = async () => {
    setIsLoading(true);
    setSuccess(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Support form submission logic would go here
      setSupportForm({ subject: '', message: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to submit support request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const faqItems = [
    {
      question: 'How do I create a new task?',
      answer: 'Click the "+" button in any task list, or use the keyboard shortcut Ctrl+N (Cmd+N on Mac).'
    },
    {
      question: 'Can I set recurring tasks?',
      answer: 'Yes! When creating or editing a task, you can set it to repeat daily, weekly, monthly, or create a custom recurrence pattern.'
    },
    {
      question: 'How do I organize tasks by priority?',
      answer: 'Use the Eisenhower Matrix view to organize tasks by urgency and importance, or mark tasks as important with the star icon.'
    },
    {
      question: 'Can I share task lists with others?',
      answer: 'Task list sharing is coming soon! You\'ll be able to collaborate with team members and family.'
    },
    {
      question: 'How do I backup my data?',
      answer: 'Your data is automatically synced to the cloud. You can also export your data from Settings > Privacy > Export My Data.'
    }
  ];

  const keyboardShortcuts = [
    { keys: ['Ctrl', 'N'], description: 'Create new task' },
    { keys: ['Ctrl', 'Enter'], description: 'Save task' },
    { keys: ['Escape'], description: 'Cancel/Close' },
    { keys: ['Tab'], description: 'Navigate between fields' },
    { keys: ['Ctrl', '/'], description: 'Search tasks' },
    { keys: ['Ctrl', '1'], description: 'Go to My Day' },
    { keys: ['Ctrl', '2'], description: 'Go to Important' },
    { keys: ['Ctrl', '3'], description: 'Go to Planned' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {success && (
        <div className="p-2 sm:p-3 lg:p-4 text-xs sm:text-sm lg:text-base text-green-800 border border-green-200 rounded-md bg-green-50">
          Support request submitted successfully! We'll get back to you soon.
        </div>
      )}

      {/* Quick Help */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Quick Help</CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Get help with common questions and tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 lg:space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base"
            onClick={() => window.open('/docs', '_blank')}
          >
            <Book className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 mr-2" />
            User Guide
            <ExternalLink className="h-3 w-3 sm:h-3 sm:w-3 lg:h-4 lg:w-4 ml-auto" />
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base"
            onClick={() => {/* Show keyboard shortcuts modal */}}
          >
            <Keyboard className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 mr-2" />
            Keyboard Shortcuts
            <ChevronRight className="h-3 w-3 sm:h-3 sm:w-3 lg:h-4 lg:w-4 ml-auto" />
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base"
            onClick={() => window.open('/changelog', '_blank')}
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 mr-2" />
            What's New
            <ExternalLink className="h-3 w-3 sm:h-3 sm:w-3 lg:h-4 lg:w-4 ml-auto" />
          </Button>
        </CardContent>
      </Card>

      {/* Frequently Asked Questions */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Find answers to common questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
          {faqItems.map((item, index) => (
            <div key={index} className="space-y-1 sm:space-y-2">
              <h4 className="text-xs sm:text-sm lg:text-base font-medium">{item.question}</h4>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
            <Keyboard className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            Keyboard Shortcuts
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Speed up your workflow with these shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
            {keyboardShortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between p-2 sm:p-3 rounded-md bg-muted/50">
                <span className="text-xs sm:text-sm lg:text-base">{shortcut.description}</span>
                <div className="flex items-center space-x-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <span key={keyIndex} className="inline-flex items-center">
                      <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-mono bg-background border rounded">
                        {key}
                      </kbd>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span className="mx-1 text-xs text-muted-foreground">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            Contact Support
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Need more help? Get in touch with our support team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <Button
              variant="outline"
              className="h-12 sm:h-14 lg:h-16 flex-col space-y-1 sm:space-y-2"
              onClick={() => window.open('mailto:support@todopro.com')}
            >
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              <span className="text-xs sm:text-sm lg:text-base">Email Support</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 sm:h-14 lg:h-16 flex-col space-y-1 sm:space-y-2"
              onClick={() => window.open('tel:+1-555-TODO-PRO')}
            >
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              <span className="text-xs sm:text-sm lg:text-base">Phone Support</span>
            </Button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm lg:text-base font-medium">Subject</label>
              <Input
                value={supportForm.subject}
                onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                className="h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm lg:text-base font-medium">Message</label>
              <Textarea
                value={supportForm.message}
                onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Describe your issue in detail..."
                rows={4}
                className="text-xs sm:text-sm lg:text-base resize-none"
              />
            </div>

            <Button
              onClick={handleSupportSubmit}
              disabled={isLoading || !supportForm.subject || !supportForm.message}
              className="w-full sm:w-auto h-8 sm:h-9 lg:h-10 text-xs sm:text-sm lg:text-base"
            >
              {isLoading ? 'Sending...' : 'Send Support Request'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="text-center space-y-1 sm:space-y-2">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold">Todo Pro</h3>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">Version 1.0.0</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              © 2024 Todo Pro. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}