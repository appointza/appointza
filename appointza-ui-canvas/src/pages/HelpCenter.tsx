
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Book, Users, CreditCard, Settings, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: <Book className="w-6 h-6" />,
      title: "Getting Started",
      description: "Learn the basics of using Appointza",
      color: "bg-blue-100 text-blue-700"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Managing Appointments",
      description: "Book, modify, and track appointments",
      color: "bg-green-100 text-green-700"
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Billing & Payments",
      description: "Understand pricing and payment options",
      color: "bg-purple-100 text-purple-700"
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "Account Settings",
      description: "Manage your profile and preferences",
      color: "bg-orange-100 text-orange-700"
    }
  ];

  const faqs = [
    {
      category: "Getting Started",
      question: "How do I create my first appointment?",
      answer: "To create your first appointment, navigate to the 'Book Appointment' page, select your organization and services, choose a date and time, and confirm your booking. You'll receive a confirmation email once completed."
    },
    {
      category: "Getting Started", 
      question: "What information do I need to register?",
      answer: "You need a valid mobile number for OTP verification. For organizations, you'll also need to provide business details, address, and service information."
    },
    {
      category: "Managing Appointments",
      question: "Can I modify or cancel an appointment?",
      answer: "Yes, you can modify or cancel appointments from your dashboard. Please note that cancellation policies may vary by service provider."
    },
    {
      category: "Managing Appointments",
      question: "How do I set up automated reminders?",
      answer: "Organizations can configure automated reminders in their settings. You can set up SMS and email reminders to be sent at specific intervals before appointments."
    },
    {
      category: "Billing & Payments",
      question: "What does it cost to use Appointza?",
      answer: "Plans combine a monthly subscription plus a booking-linked fee—see Pricing (/plans). Sign up free with 50 bookings every month on the Free plan. Paid tiers include a larger monthly free-booking quota and lower per-booking fees (whichever is higher: a fixed rupee amount or a percentage). Ask us if you need custom terms."
    },
    {
      category: "Billing & Payments",
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, UPI, net banking, and digital wallets. Payments are processed securely through our payment partners."
    },
    {
      category: "Account Settings",
      question: "How do I update my business hours?",
      answer: "Organizations can update business hours in the 'Timing Setup' section of their dashboard. You can set different hours for each day and create exceptions for holidays."
    },
    {
      category: "Account Settings",
      question: "Can I add multiple staff members?",
      answer: "Yes, you can add and manage multiple staff members in the 'Staff' section. You can assign specific services to each staff member and manage their individual schedules."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Help Center - Appointza</title>
      </Helmet>
      
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-appointza-navy mb-4">
              Help Center
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Find answers to common questions and learn how to get the most out of Appointza.
            </p>
            
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mx-auto mb-2`}>
                    {category.icon}
                  </div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-appointza-navy">
                Frequently Asked Questions
              </h2>
              {searchQuery && (
                <Badge variant="secondary">
                  {filteredFaqs.length} results found
                </Badge>
              )}
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-white rounded-lg shadow-sm border">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {faq.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{faq.question}</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {filteredFaqs.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try different keywords or contact our support team.</p>
              </div>
            )}
          </div>
          
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle>Still need help?</CardTitle>
                <CardDescription>
                  Can't find what you're looking for? Our support team is here to help.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild variant="outline">
                    <Link to="/contact">Contact Support</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/demo">Request Demo</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HelpCenter;
