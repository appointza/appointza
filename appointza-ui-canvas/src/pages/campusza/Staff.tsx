import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, ClipboardList, BookOpen, CheckCircle, Clock, Calendar, Users, FileText } from "lucide-react";

const CampuszaStaff = () => {
  const navigate = useNavigate();

  const staffOptions = [
    {
      id: "dashboard",
      title: "Dashboard",
      description: "View your schedule and tasks",
      icon: GraduationCap,
      color: "bg-blue-500",
      path: "/campusza/staff/dashboard",
    },
    {
      id: "classes",
      title: "My Classes",
      description: "View and manage your classes",
      icon: BookOpen,
      color: "bg-green-500",
      path: "/campusza/staff/classes",
    },
    {
      id: "students",
      title: "My Students",
      description: "View students in your classes",
      icon: Users,
      color: "bg-purple-500",
      path: "/campusza/staff/students",
    },
    {
      id: "attendance",
      title: "Attendance",
      description: "Mark and view attendance",
      icon: ClipboardList,
      color: "bg-orange-500",
      path: "/campusza/staff/attendance",
    },
    {
      id: "grades",
      title: "Grades",
      description: "Enter and manage grades",
      icon: CheckCircle,
      color: "bg-indigo-500",
      path: "/campusza/staff/grades",
    },
    {
      id: "schedule",
      title: "Schedule",
      description: "View your class schedule",
      icon: Calendar,
      color: "bg-pink-500",
      path: "/campusza/staff/schedule",
    },
    {
      id: "documents",
      title: "Documents",
      description: "Manage student documents",
      icon: FileText,
      color: "bg-teal-500",
      path: "/campusza/staff/documents",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Campusza Staff Portal</h1>
              <p className="text-sm text-gray-600">Manage your classes and students</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary"
                onClick={() => navigate(option.path)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`${option.color} p-3 rounded-lg text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {option.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">4</div>
              <div className="text-sm text-gray-600 mt-1">My Classes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">145</div>
              <div className="text-sm text-gray-600 mt-1">My Students</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">1/4</div>
              <div className="text-sm text-gray-600 mt-1">Attendance Marked</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">45 min</div>
              <div className="text-sm text-gray-600 mt-1">Next Class In</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampuszaStaff;
