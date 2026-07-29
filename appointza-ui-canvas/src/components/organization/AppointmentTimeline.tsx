
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface TimelineItem {
  id: number;
  type: "appointment" | "task" | "note";
  title: string;
  description: string;
  timestamp: Date;
  staff: string;
}

interface AppointmentTimelineProps {
  timeline: TimelineItem[];
}

const AppointmentTimeline = ({ timeline }: AppointmentTimelineProps) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4" />;
      case "task":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "appointment":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Appointment</Badge>;
      case "task":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Task</Badge>;
      default:
        return <Badge variant="secondary">Note</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {timeline.map((item, index) => (
            <div key={item.id} className="relative">
              {/* Timeline line */}
              {index < timeline.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
              )}
              
              <div className="flex space-x-4">
                {/* Timeline icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                    {getTypeIcon(item.type)}
                  </div>
                </div>
                
                {/* Timeline content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    {getTypeBadge(item.type)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(item.timestamp, "h:mm a")}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{item.staff}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {timeline.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No timeline entries yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentTimeline;
