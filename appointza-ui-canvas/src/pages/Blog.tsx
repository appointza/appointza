
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

interface BlogPostProps {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  featured?: boolean;
}

const BlogPost = ({ title, excerpt, author, date, category, readTime, featured }: BlogPostProps) => {
  return (
    <Card className={`hover:shadow-lg transition-shadow ${featured ? 'border-appointza-teal border-2' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant={featured ? "default" : "secondary"} className={featured ? "bg-appointza-teal" : ""}>
            {category}
          </Badge>
          {featured && <TrendingUp className="w-4 h-4 text-appointza-teal" />}
        </div>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        <CardDescription className="line-clamp-3">{excerpt}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{date}</span>
            </div>
          </div>
          <span>{readTime}</span>
        </div>
        <Button variant="link" className="p-0 h-auto mt-3 text-appointza-teal">
          Read More <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

const Blog = () => {
  const blogPosts = [
    {
      title: "10 Ways to Reduce No-Shows in Your Appointment Business",
      excerpt: "Learn proven strategies to minimize appointment cancellations and improve your booking rates with automated reminders, deposits, and more.",
      author: "Priya Sharma",
      date: "Jan 15, 2025",
      category: "Business Tips",
      readTime: "5 min read",
      featured: true
    },
    {
      title: "The Complete Guide to Online Appointment Booking",
      excerpt: "Everything you need to know about setting up and optimizing your online booking system to grow your business.",
      author: "Rajesh Kumar",
      date: "Jan 12, 2025",
      category: "Guides",
      readTime: "8 min read",
      featured: true
    },
    {
      title: "Healthcare Appointment Management: Best Practices",
      excerpt: "Discover how medical practices can streamline patient scheduling and improve healthcare delivery with digital solutions.",
      author: "Dr. Anjali Patel",
      date: "Jan 10, 2025",
      category: "Healthcare",
      readTime: "6 min read"
    },
    {
      title: "Salon & Spa Booking: Trends for 2025",
      excerpt: "Stay ahead of the curve with the latest trends in beauty and wellness appointment booking technology.",
      author: "Meera Singh",
      date: "Jan 8, 2025",
      category: "Beauty & Wellness",
      readTime: "4 min read"
    },
    {
      title: "Building Customer Loyalty Through Better Booking",
      excerpt: "Learn how a smooth booking experience can turn first-time customers into loyal clients who keep coming back.",
      author: "Amit Verma",
      date: "Jan 5, 2025",
      category: "Customer Experience",
      readTime: "7 min read"
    },
    {
      title: "Small Business Success: From Manual to Digital Scheduling",
      excerpt: "Real stories of small businesses that transformed their operations by switching from manual to digital appointment booking.",
      author: "Kavya Nair",
      date: "Jan 3, 2025",
      category: "Case Studies",
      readTime: "9 min read"
    },
    {
      title: "Payment Integration: Secure Online Transactions",
      excerpt: "Understanding payment security and how to integrate secure payment processing into your booking system.",
      author: "Ravi Agarwal",
      date: "Dec 30, 2024",
      category: "Technology",
      readTime: "5 min read"
    },
    {
      title: "Mobile-First Booking: Why It Matters",
      excerpt: "Why mobile optimization is crucial for appointment booking and how to ensure your customers can book from any device.",
      author: "Shruti Joshi",
      date: "Dec 28, 2024",
      category: "Mobile",
      readTime: "6 min read"
    }
  ];

  const categories = ["All", "Business Tips", "Guides", "Healthcare", "Beauty & Wellness", "Customer Experience", "Case Studies", "Technology", "Mobile"];

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Blog - Appointza</title>
      </Helmet>
      
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-appointza-navy mb-4">
              Appointza Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Insights, tips, and success stories to help you grow your appointment-based business.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map((category) => (
              <Badge 
                key={category} 
                variant={category === "All" ? "default" : "outline"}
                className={`cursor-pointer hover:bg-appointza-teal hover:text-white ${
                  category === "All" ? "bg-appointza-teal" : ""
                }`}
              >
                {category}
              </Badge>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {blogPosts.map((post, index) => (
              <BlogPost key={index} {...post} />
            ))}
          </div>
          
          <div className="text-center">
            <Button variant="outline" size="lg">
              Load More Articles
            </Button>
          </div>
          
          <div className="mt-16">
            <Card className="bg-appointza-teal text-white">
              <CardHeader className="text-center">
                <CardTitle className="text-white">Stay Updated</CardTitle>
                <CardDescription className="text-gray-100">
                  Subscribe to our newsletter for the latest tips, updates, and industry insights.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-md text-gray-900"
                  />
                  <Button variant="secondary">
                    Subscribe
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

export default Blog;
