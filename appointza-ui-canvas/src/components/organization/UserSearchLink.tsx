
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Search } from "lucide-react";

const UserSearchLink = () => {
  return (
    <Link to="/organization/user-search">
      <Button variant="outline" className="w-full justify-start">
        <Search className="mr-2 h-4 w-4" />
        User Search & Service History
      </Button>
    </Link>
  );
};

export default UserSearchLink;
