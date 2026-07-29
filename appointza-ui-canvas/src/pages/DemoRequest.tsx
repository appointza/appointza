
import React, { useState } from 'react';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DemoRequest = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    industry: '',
    employeeCount: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Option 1: Send to email
      const emailBody = `
        Name: ${formData.name}
        Email: ${formData.email}
        Phone: ${formData.phone}
        Business Name: ${formData.businessName}
        Industry: ${formData.industry}
        Number of Employees: ${formData.employeeCount}
      `;
      
      // Send email using mailto
      window.location.href = `mailto:webzyhelps@gmail.com?subject=Demo Request from ${formData.name}&body=${encodeURIComponent(emailBody)}`;
      
      toast({
        title: "Demo request sent!",
        description: "Our team will contact you soon to schedule your personalized demo.",
      });
    } catch (error) {
      console.error("Error sending demo request:", error);
      toast({
        title: "Error submitting request",
        description: "There was an issue sending your demo request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="pt-32 pb-20 px-4 bg-appointza-light">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-appointza-navy mb-6">
                  Book a Personalized Demo
                </h1>
                <p className="text-lg text-gray-600">
                  See how Appointza can streamline your appointment scheduling process with a custom demo tailored to your business needs.
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input 
                        id="name"
                        name="name"
                        placeholder="John Smith"
                        required
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone"
                        name="phone"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input 
                        id="businessName"
                        name="businessName"
                        placeholder="Your Company Name"
                        required
                        value={formData.businessName}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) => handleSelectChange('industry', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="fitness">Fitness</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="employeeCount">Number of Employees</Label>
                      <Select
                        value={formData.employeeCount}
                        onValueChange={(value) => handleSelectChange('employeeCount', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-5">1-5</SelectItem>
                          <SelectItem value="6-20">6-20</SelectItem>
                          <SelectItem value="21-50">21-50</SelectItem>
                          <SelectItem value="51-100">51-100</SelectItem>
                          <SelectItem value="100+">100+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-gradient-appointza" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Schedule My Demo"}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const whatsappMessage = `I'd like to request a demo for Appointza.`;
                        window.open(`https://wa.me/919080539126?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                      }}
                    >
                      Contact on WhatsApp
                    </Button>
                  </div>
                  
                  <p className="text-center text-sm text-gray-500 pt-4">
                    By submitting this form, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DemoRequest;
