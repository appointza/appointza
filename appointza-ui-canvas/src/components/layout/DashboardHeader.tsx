import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Bell, Menu, User, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import DashboardSwitcher from './DashboardSwitcher';

const DashboardHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userType, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate('/');
  };

  const canSwitchRoles = userType === 'organization';

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-white shadow py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Left spacer (logo moved to sidebar) */}
        <div className="flex items-center">
          {canSwitchRoles && <DashboardSwitcher />}
        </div>

        {/* Right side nav */}
        <div className="hidden md:flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell size={20} />
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-appointza-navy"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white py-4 shadow-lg animate-fade-in">
          <nav className="container mx-auto px-4 flex flex-col space-y-4">
            {canSwitchRoles && (
              <DashboardSwitcher />
            )}
          
            {userType === 'organization' ? (
              <>
                <Link 
                  to="/organization/dashboard" 
                  className="px-4 py-2 text-appointza-navy hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/organization/templates" 
                  className="px-4 py-2 text-appointza-navy hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Templates
                </Link>
                <Link 
                  to="/organization/profile" 
                  className="px-4 py-2 text-appointza-navy hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link 
                  to="/organization/settings" 
                  className="px-4 py-2 text-appointza-navy hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/user/dashboard" 
                  className="px-4 py-2 text-appointza-navy hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Appointments
                </Link>
                <Link 
                  to="/explore" 
                  className="px-4 py-2 text-appointza-navy hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Explore Services
                </Link>
                <Link 
                  to="/user/profile" 
                  className="px-4 py-2 text-appointza-navy hover:bg-gray-100 rounded flex items-center space-x-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>
              </>
            )}
            
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-100 text-appointza-navy rounded font-medium text-center"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
