import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AddAppointmentDialog = () => {
  const [name, setName] = useState("");
  const [datetime, setDatetime] = useState("");
  const [type, setType] = useState("");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user.id) return;

    const { error } = await supabase
      .from('appointments')
      .insert([
        { 
          patient_name: name,
          datetime,
          type,
          created_by: session.session.user.id
        }
      ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to schedule appointment. Please try again.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Appointment has been scheduled successfully",
    });
    setOpen(false);
    setName("");
    setDatetime("");
    setType("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Schedule New Appointment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule New Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Patient Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="datetime">Date and Time</Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Type of Appointment</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="check-up">Check-up</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Schedule Appointment</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAppointmentDialog;