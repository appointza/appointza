
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Phone } from "lucide-react";

interface ClientSearchProps {
  onSearch: (mobile: string) => void;
}

const ClientSearch = ({ onSearch }: ClientSearchProps) => {
  const [mobile, setMobile] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.trim()) {
      onSearch(mobile.trim());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base sm:text-lg">
          <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Client Search
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Search for clients by their mobile number
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-2">
          <Label htmlFor="mobile" className="text-sm sm:text-base">Mobile Number</Label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+1234567890"
                className="pl-10 h-10 sm:h-11"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full sm:w-auto justify-center h-10 sm:h-11 px-4 sm:px-6" 
              aria-label="Search"
            >
              <Search className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Search</span>
            </Button>
          </div>
        </form>

      </CardContent>
    </Card>
  );
};

export default ClientSearch;
