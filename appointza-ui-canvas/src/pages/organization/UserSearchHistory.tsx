
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, Calendar, DollarSign, Phone, Plus, FileText, ClipboardList } from "lucide-react";
import OrganizationLayout from "@/components/layout/OrganizationLayout";
import { format } from "date-fns";
import AddClientForm from "@/components/organization/AddClientForm";
import UserAppointmentDetails from "@/components/organization/UserAppointmentDetails";
import { Appoinment } from "@/models/appoinment.model";

// Extended dummy data with more clients and detailed service history
const dummyUsers = {
  "9876543210": { 
    userid: 101, 
    name: "Alice Johnson", 
    email: "alice.johnson@email.com",
    joinDate: new Date("2024-01-15"),
    totalVisits: 8,
    totalSpent: 420,
    lastVisit: new Date("2024-12-10")
  },
  "8765432109": { 
    userid: 102, 
    name: "Bob Wilson", 
    email: "bob.wilson@email.com",
    joinDate: new Date("2024-03-22"),
    totalVisits: 3,
    totalSpent: 180,
    lastVisit: new Date("2024-11-25")
  },
  "7654321098": { 
    userid: 103, 
    name: "Carol Brown", 
    email: "carol.brown@email.com",
    joinDate: new Date("2024-02-10"),
    totalVisits: 12,
    totalSpent: 650,
    lastVisit: new Date("2024-12-08")
  },
  "6543210987": { 
    userid: 104, 
    name: "David Smith", 
    email: "david.smith@email.com",
    joinDate: new Date("2024-05-18"),
    totalVisits: 5,
    totalSpent: 275,
    lastVisit: new Date("2024-11-30")
  }
};

const dummyAppointments: Appoinment[] = [
  {
    id: 1,
    userid: 101,
    organizationid: 456,
    organisationlocationid: 1,
    appoinmentdate: new Date("2024-12-10T10:00:00"),
    fromtime: new Date("2024-12-10T10:00:00"),
    totime: new Date("2024-12-10T11:30:00"),
    staffid: 1,
    staffname: "John Doe",
    notes: "Regular customer, prefers morning appointments. Client mentioned shoulder tension.",
    isactive: true,
    status: 1,
    statuscode: "completed",
    issuspended: false,
    isfactory: false,
    version: 1,
    createdby: 1,
    createdon: new Date("2024-12-01"),
    modifiedby: 1,
    modifiedon: new Date("2024-12-01"),
    ispaid: true,
    attributes: {
      servicelist: [
        {
          id: 1,
          servicename: "Hair Cut & Styling",
          serviceprice: 50,
          servicetimetaken: 60,
          iscombo: false
        },
        {
          id: 2,
          servicename: "Hair Wash",
          serviceprice: 20,
          servicetimetaken: 30,
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
    appoinmentdate: new Date("2024-11-15T14:00:00"),
    fromtime: new Date("2024-11-15T14:00:00"),
    totime: new Date("2024-11-15T15:00:00"),
    staffid: 2,
    staffname: "Jane Smith",
    notes: "Follow-up appointment. Client satisfied with previous service.",
    isactive: true,
    status: 1,
    statuscode: "completed",
    issuspended: false,
    isfactory: false,
    version: 1,
    createdby: 1,
    createdon: new Date("2024-11-05"),
    modifiedby: 1,
    modifiedon: new Date("2024-11-05"),
    ispaid: true,
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
    appoinmentdate: new Date("2024-11-25T09:00:00"),
    fromtime: new Date("2024-11-25T09:00:00"),
    totime: new Date("2024-11-25T10:30:00"),
    staffid: 1,
    staffname: "John Doe",
    notes: "First time customer. Recommended premium package for next visit.",
    isactive: true,
    status: 1,
    statuscode: "completed",
    issuspended: false,
    isfactory: false,
    version: 1,
    createdby: 1,
    createdon: new Date("2024-11-20"),
    modifiedby: 1,
    modifiedon: new Date("2024-11-20"),
    ispaid: true,
    attributes: {
      servicelist: [
        {
          id: 1,
          servicename: "Hair Cut & Styling",
          serviceprice: 50,
          servicetimetaken: 90,
          iscombo: false
        }
      ]
    }
  }
];

const UserSearchHistory = () => {
  const [searchMobile, setSearchMobile] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ 
    userid: number; 
    name: string; 
    mobile: string; 
    email: string;
    joinDate: Date;
    totalVisits: number;
    totalSpent: number;
    lastVisit: Date;
  } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appoinment | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);

  const handleSearch = () => {
    const userData = dummyUsers[searchMobile as keyof typeof dummyUsers];
    if (userData) {
      setSelectedUser({
        userid: userData.userid,
        name: userData.name,
        mobile: searchMobile,
        email: userData.email,
        joinDate: userData.joinDate,
        totalVisits: userData.totalVisits,
        totalSpent: userData.totalSpent,
        lastVisit: userData.lastVisit
      });
    } else {
      setSelectedUser(null);
    }
  };

  const userAppointments = selectedUser ? 
    dummyAppointments.filter(appointment => appointment.userid === selectedUser.userid)
      .sort((a, b) => new Date(b.appoinmentdate).getTime() - new Date(a.appoinmentdate).getTime()) 
    : [];

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

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Search & Service History</h2>
            <p className="text-muted-foreground">
              Search for clients and manage their complete service history and appointments.
            </p>
          </div>
          <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <Plus className="mr-2 h-4 w-4" />
                Add New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Register a new client to your organization's database.
                </DialogDescription>
              </DialogHeader>
              <AddClientForm onClose={() => setShowAddClient(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Client Search
            </CardTitle>
            <CardDescription>
              Search for clients by mobile number to view their service history
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
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
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
                      setSelectedUser({
                        userid: user.userid,
                        name: user.name,
                        mobile,
                        email: user.email,
                        joinDate: user.joinDate,
                        totalVisits: user.totalVisits,
                        totalSpent: user.totalSpent,
                        lastVisit: user.lastVisit
                      });
                    }}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
                  >
                    {mobile} ({user.name})
                  </button>
                ))}
              </div>
            </div>

            {/* Client Profile Summary */}
            {selectedUser && (
              <div className="space-y-6">
                <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">
                          {selectedUser.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                        <p className="text-muted-foreground">{selectedUser.mobile}</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Client since {format(selectedUser.joinDate, "MMM yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Last Visit</p>
                      <p className="font-medium">{format(selectedUser.lastVisit, "MMM dd, yyyy")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold">{selectedUser.totalVisits}</p>
                          <p className="text-sm text-muted-foreground">Total Visits</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-semibold">₹{selectedUser.totalSpent}</p>
                          <p className="text-sm text-muted-foreground">Total Spent</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-semibold">VIP</p>
                          <p className="text-sm text-muted-foreground">Client Status</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="history" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="history">Service History</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="notes">Notes & Tasks</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="history" className="space-y-4">
                    {userAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {userAppointments.map((appointment) => (
                          <Card key={appointment.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => setSelectedAppointment(appointment)}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="text-center">
                                    <p className="font-semibold">
                                      {format(new Date(appointment.appoinmentdate), "MMM dd")}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(appointment.appoinmentdate), "yyyy")}
                                    </p>
                                  </div>
                                  <div>
                                    <div className="space-y-1">
                                      {appointment.attributes?.servicelist?.map(service => (
                                        <div key={service.id} className="text-sm">
                                          <span className="font-medium">{service.servicename}</span>
                                          <span className="text-muted-foreground ml-2">
                                            ₹{service.serviceprice} • {service.servicetimetaken}min
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      with {appointment.staffname}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right space-y-2">
                                  <div className="font-semibold">₹{getTotalPrice(appointment)}</div>
                                  {getStatusBadge(appointment)}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                        <h3 className="mt-4 text-lg font-medium">No service history</h3>
                        <p className="text-muted-foreground mt-2">
                          {selectedUser.name} has no appointment history yet.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="documents" className="space-y-4">
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No documents uploaded</h3>
                      <p className="text-muted-foreground mt-2">
                        Documents like prescriptions and reports will appear here.
                      </p>
                      <Button className="mt-4" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Upload Document
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="notes" className="space-y-4">
                    <div className="text-center py-8">
                      <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No notes or tasks</h3>
                      <p className="text-muted-foreground mt-2">
                        Add notes and tasks to track client care and follow-ups.
                      </p>
                      <Button className="mt-4" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Note
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Empty State */}
            {!selectedUser && !searchMobile && (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">Search for a client</h3>
                <p className="text-muted-foreground mt-2">
                  Enter a mobile number above to view client information and service history.
                </p>
              </div>
            )}

            {/* Not Found State */}
            {searchMobile && !selectedUser && searchMobile.length >= 10 && (
              <div className="text-center py-8">
                <Phone className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">Client not found</h3>
                <p className="text-muted-foreground mt-2">
                  No client found with mobile number "{searchMobile}". Try one of the demo numbers above or add a new client.
                </p>
                <Button className="mt-4" onClick={() => setShowAddClient(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add as New Client
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <UserAppointmentDetails
            appointment={selectedAppointment}
            isOpen={!!selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
          />
        )}
      </div>
    </OrganizationLayout>
  );
};

export default UserSearchHistory;
