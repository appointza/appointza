
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, Calendar, DollarSign, Phone } from "lucide-react";
import { Appoinment } from "@/models/appoinment.model";
import { format } from "date-fns";

// Dummy data for testing
const dummyAppointments: Appoinment[] = [
  {
    id: 1,
    userid: 101,
    organizationid: 456,
    organisationlocationid: 1,
    appoinmentdate: new Date("2024-06-10T10:00:00"),
    fromtime: new Date("2024-06-10T10:00:00"),
    totime: new Date("2024-06-10T11:30:00"),
    staffid: 1,
    staffname: "John Doe",
    notes: "Regular customer, prefers morning appointments",
    isactive: true,
    status: 1,
    statuscode: "completed",
    issuspended: false,
    isfactory: false,
    version: 1,
    createdby: 1,
    createdon: new Date("2024-06-01"),
    modifiedby: 1,
    modifiedon: new Date("2024-06-01"),
    ispaid: true,
    attributes: {
      servicelist: [
        {
          id: 1,
          servicename: "Hair Cut",
          serviceprice: 25,
          servicetimetaken: 45,
          iscombo: false
        },
        {
          id: 2,
          servicename: "Hair Wash",
          serviceprice: 15,
          servicetimetaken: 20,
          iscombo: false
        }
      ]
    }
  },
  {
    id: 2,
    userid: 101,
    organizationid: 456,
    organisationlocationid: 1,
    appoinmentdate: new Date("2024-06-15T14:00:00"),
    fromtime: new Date("2024-06-15T14:00:00"),
    totime: new Date("2024-06-15T15:00:00"),
    staffid: 2,
    staffname: "Jane Smith",
    notes: "Requested specific styling",
    isactive: true,
    status: 0,
    statuscode: "upcoming",
    issuspended: false,
    isfactory: false,
    version: 1,
    createdby: 1,
    createdon: new Date("2024-06-05"),
    modifiedby: 1,
    modifiedon: new Date("2024-06-05"),
    ispaid: false,
    attributes: {
      servicelist: [
        {
          id: 3,
          servicename: "Hair Styling",
          serviceprice: 35,
          servicetimetaken: 60,
          iscombo: false
        }
      ]
    }
  },
  {
    id: 3,
    userid: 102,
    organizationid: 456,
    organisationlocationid: 1,
    appoinmentdate: new Date("2024-06-12T09:00:00"),
    fromtime: new Date("2024-06-12T09:00:00"),
    totime: new Date("2024-06-12T10:30:00"),
    staffid: 1,
    staffname: "John Doe",
    notes: "First time customer",
    isactive: true,
    status: 1,
    statuscode: "completed",
    issuspended: false,
    isfactory: false,
    version: 1,
    createdby: 1,
    createdon: new Date("2024-06-08"),
    modifiedby: 1,
    modifiedon: new Date("2024-06-08"),
    ispaid: true,
    attributes: {
      servicelist: [
        {
          id: 1,
          servicename: "Hair Cut",
          serviceprice: 25,
          servicetimetaken: 45,
          iscombo: false
        },
        {
          id: 4,
          servicename: "Beard Trim",
          serviceprice: 20,
          servicetimetaken: 30,
          iscombo: false
        }
      ]
    }
  }
];

// Dummy user data mapping mobile numbers to user IDs
const dummyUsers = {
  "9876543210": { userid: 101, name: "Alice Johnson" },
  "8765432109": { userid: 102, name: "Bob Wilson" },
  "7654321098": { userid: 103, name: "Carol Brown" }
};

const UserSearch = () => {
  const [searchMobile, setSearchMobile] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ userid: number; name: string; mobile: string } | null>(null);

  const handleSearch = () => {
    const userData = dummyUsers[searchMobile as keyof typeof dummyUsers];
    if (userData) {
      setSelectedUser({
        userid: userData.userid,
        name: userData.name,
        mobile: searchMobile
      });
    } else {
      setSelectedUser(null);
    }
  };

  const userAppointments = selectedUser ? 
    dummyAppointments.filter(appointment => appointment.userid === selectedUser.userid)
      .sort((a, b) => new Date(b.appoinmentdate).getTime() - new Date(a.appoinmentdate).getTime()) 
    : [];

  const getServiceDetails = (appointment: Appoinment) => {
    if (appointment.attributes?.servicelist?.length > 0) {
      return appointment.attributes.servicelist.map(service => (
        <div key={service.id} className="text-sm">
          <span className="font-medium">{service.servicename}</span>
          <span className="text-muted-foreground ml-2">
            ₹{service.serviceprice} • {service.servicetimetaken}min
          </span>
        </div>
      ));
    }
    return <span className="text-sm text-muted-foreground">No services specified</span>;
  };

  const getTotalPrice = (appointment: Appoinment) => {
    if (appointment.attributes?.servicelist?.length > 0) {
      return appointment.attributes.servicelist.reduce((total, service) => total + service.serviceprice, 0);
    }
    return 0;
  };

  const getStatusBadge = (appointment: Appoinment) => {
    const appointmentDate = new Date(appointment.appoinmentdate);
    const isUpcoming = appointmentDate >= new Date();
    
    if (!appointment.isactive) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
    } else if (isUpcoming) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
    }
  };

  const totalSpent = userAppointments
    .filter(appointment => appointment.isactive)
    .reduce((total, appointment) => total + getTotalPrice(appointment), 0);

  const completedAppointments = userAppointments.filter(
    appointment => new Date(appointment.appoinmentdate) < new Date() && appointment.isactive
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="mr-2 h-5 w-5" />
          User Search & Service History
        </CardTitle>
        <CardDescription>
          Search for users by mobile number and track their service history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Section */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter mobile number to search (e.g., 9876543210)..."
              className="pl-8"
              value={searchMobile}
              onChange={(e) => setSearchMobile(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        {/* Demo Numbers Helper */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">Demo Mobile Numbers:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(dummyUsers).map(([mobile, user]) => (
              <button
                key={mobile}
                onClick={() => {
                  setSearchMobile(mobile);
                  setSelectedUser({ userid: user.userid, name: user.name, mobile });
                }}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
              >
                {mobile} ({user.name})
              </button>
            ))}
          </div>
        </div>

        {/* User Summary */}
        {selectedUser && userAppointments.length > 0 && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{selectedUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.mobile}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{completedAppointments.length}</p>
                  <p className="text-sm text-muted-foreground">Completed Visits</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">₹{totalSpent}</p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Service History Table */}
        {selectedUser && (
          <div>
            {userAppointments.length > 0 ? (
              <div>
                <h3 className="text-lg font-medium mb-4">Service History for {selectedUser.name}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Services Used</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {format(new Date(appointment.appoinmentdate), "MMM dd, yyyy")}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(appointment.appoinmentdate), "h:mm a")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getServiceDetails(appointment)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {appointment.staffname || "Not assigned"}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">₹{getTotalPrice(appointment)}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(appointment)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm">
                            {appointment.notes || "No notes"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              selectedUser && (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No appointments found</h3>
                  <p className="text-muted-foreground mt-2">
                    {selectedUser.name} has no appointment history with your organization.
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedUser && (
          <div className="text-center py-8">
            <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">Search for a user</h3>
            <p className="text-muted-foreground mt-2">
              Enter a mobile number above to view their complete service history and track their appointments.
            </p>
          </div>
        )}

        {/* Not Found State */}
        {searchMobile && !selectedUser && searchMobile.length >= 10 && (
          <div className="text-center py-8">
            <Phone className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">User not found</h3>
            <p className="text-muted-foreground mt-2">
              No user found with mobile number "{searchMobile}". Try one of the demo numbers above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSearch;
