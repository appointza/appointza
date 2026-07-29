import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthService } from "@/services/AuthService";
import { useToast } from "@/hooks/use-toast";
import { Filter, Search } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface OrganizationListItem {
  id: string;
  name: string;
  primaryCategory: string;
  rating: number;
  imageUrl?: string;
  description?: string;
}

const ExploreOrganizations = () => {
  // Mock organizations with primary categories
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([
    { 
      id: "1", 
      name: 'City General Hospital', 
      primaryCategory: 'Hospital', 
      rating: 4.7, 
      imageUrl: '/images/stock/hospital.webp',
      description: 'A comprehensive healthcare facility offering a wide range of medical services.'
    },
    { 
      id: "2", 
      name: 'Metro Health Center', 
      primaryCategory: 'Hospital', 
      rating: 4.5, 
      imageUrl: '/images/stock/clinic.webp',
      description: 'Specialized healthcare center with advanced medical facilities.' 
    },
    { 
      id: "3", 
      name: 'PixelPerfect Studios', 
      primaryCategory: 'Photography', 
      rating: 4.9, 
      imageUrl: '/images/stock/studio.webp',
      description: 'Professional photography studio specializing in portraits and events.' 
    },
    { 
      id: "4", 
      name: 'Capture Moments', 
      primaryCategory: 'Photography', 
      rating: 4.6, 
      imageUrl: '/images/stock/photography.webp',
      description: 'Creative photography service for weddings, parties and special occasions.' 
    },
    { 
      id: "5", 
      name: 'Community Medical Center', 
      primaryCategory: 'Hospital', 
      rating: 4.3, 
      imageUrl: '/images/stock/medical.webp',
      description: 'Neighborhood medical facility providing essential healthcare services.' 
    },
    { 
      id: "6", 
      name: 'LensLife Photography', 
      primaryCategory: 'Photography', 
      rating: 4.8, 
      imageUrl: '/images/stock/lens.webp',
      description: 'Modern photography studio with cutting-edge equipment and creative direction.' 
    },
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [ratingFilter, setRatingFilter] = useState([0]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const categories = ['All', 'Hospital', 'Photography'];

  const filteredOrganizations = organizations.filter(org => {
    const searchMatch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        org.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = selectedCategory === 'All' || org.primaryCategory === selectedCategory;
    const ratingMatch = org.rating >= ratingFilter[0];
    return searchMatch && categoryMatch && ratingMatch;
  });

  const handleOrganizationClick = (orgId: string) => {
    navigate(`/organization/${orgId}`);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            id="search"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="rating" className="block mb-2">Minimum Rating: {ratingFilter[0]}</Label>
        <Slider
          id="rating"
          defaultValue={ratingFilter}
          max={5}
          step={0.5}
          onValueChange={setRatingFilter}
          className="w-full"
        />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-4 px-4">
      {/* Mobile-friendly header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Explore Organizations</h1>
        
        {/* Mobile filter trigger */}
        <div className="flex flex-col sm:flex-row gap-4 md:hidden mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filter Organizations</SheetTitle>
                <SheetDescription>
                  Filter organizations by category and rating
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Tabs defaultValue="All" onValueChange={setSelectedCategory} className="w-full">
        {/* Mobile-friendly tabs */}
        <TabsList className="grid grid-cols-3 mb-6 w-full max-w-md mx-auto md:mx-0">
          {categories.map(category => (
            <TabsTrigger 
              key={category} 
              value={category}
              className="text-xs sm:text-sm"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop filters sidebar */}
          <div className="hidden md:block lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <FilterContent />
              </CardContent>
            </Card>
          </div>

          {/* Organizations grid - mobile responsive */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrganizations.length > 0 ? (
                filteredOrganizations.map(org => (
                  <Card 
                    key={org.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow touch-manipulation"
                    onClick={() => handleOrganizationClick(org.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-center mb-3">
                        <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                          <AvatarImage src={org.imageUrl} alt={org.name} />
                          <AvatarFallback>{org.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                      <CardTitle className="text-base sm:text-lg text-center">{org.name}</CardTitle>
                      <CardDescription className="text-center">{org.primaryCategory}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 text-center">
                        {org.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 4.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                          </svg>
                          <span className="ml-1 text-sm font-medium">{org.rating}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrganizationClick(org.id);
                          }}
                          className="text-xs sm:text-sm"
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No organizations found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default ExploreOrganizations;
