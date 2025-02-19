import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Doctor {
  id: string;
  name: string;
  experience: string;
  type: string;
}

interface Appointment {
  id: string;
  patient_name: string;
  datetime: string;
  type: string;
}

export const StatsCards = () => {
  const { state } = useApp();
  const [showDoctorsDialog, setShowDoctorsDialog] = useState(false);
  const [showAppointmentsDialog, setShowAppointmentsDialog] = useState(false);
  const [showPatientsDialog, setShowPatientsDialog] = useState(false);
  const { toast } = useToast();
  const [totalPatients, setTotalPatients] = useState(0);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetchData();
    const subscription = supabase
      .channel('appointments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    // Fetch total patients
    const { count: patientsCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact' });
    setTotalPatients(patientsCount || 0);

    // Fetch doctors
    const { data: doctorsData } = await supabase
      .from('doctors')
      .select('*');
    setDoctors(doctorsData || []);

    // Fetch today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select('*')
      .gte('datetime', today.toISOString())
      .lt('datetime', tomorrow.toISOString())
      .order('datetime', { ascending: true });
    setAppointments(appointmentsData || []);
  };

  const isAppointmentFinished = (datetime: string) => {
    return new Date(datetime) < new Date();
  };

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <Card 
        className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setShowPatientsDialog(true)}
      >
        <CardHeader>
          <CardTitle>Records of Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalPatients}</p>
          <p className="text-sm text-gray-500">Total patients</p>
        </CardContent>
      </Card>

      <Card 
        className="glass-card hover:shadow-lg transition-shadow cursor-pointer" 
        onClick={() => setShowDoctorsDialog(true)}
      >
        <CardHeader>
          <CardTitle>Scheduled Doctor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{doctors.length}</p>
          <p className="text-sm text-gray-500">Doctors available</p>
        </CardContent>
      </Card>

      <Card 
        className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setShowAppointmentsDialog(true)}
      >
        <CardHeader>
          <CardTitle>Appointment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{appointments.length}</p>
          <p className="text-sm text-gray-500">Appointments today</p>
        </CardContent>
      </Card>

      <Dialog open={showPatientsDialog} onOpenChange={setShowPatientsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Total Patients: {totalPatients}</DialogTitle>
          </DialogHeader>
          <p className="text-center text-gray-500">
            There are currently {totalPatients} patients registered in the system.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={showDoctorsDialog} onOpenChange={setShowDoctorsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Available Doctors</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="p-4 border rounded-lg">
                <h3 className="font-medium">{doctor.name}</h3>
                <p className="text-sm text-gray-500">{doctor.type}</p>
                <p className="text-sm text-gray-500">Experience: {doctor.experience}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAppointmentsDialog} onOpenChange={setShowAppointmentsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Today's Appointments Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Finished Appointments</h3>
              {appointments
                .filter(app => isAppointmentFinished(app.datetime))
                .map((appointment) => (
                  <div key={appointment.id} className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium">{appointment.patient_name}</h4>
                    <p className="text-sm text-gray-500">
                      {format(new Date(appointment.datetime), 'h:mm a')}
                    </p>
                    <p className="text-sm text-gray-500">{appointment.type}</p>
                  </div>
                ))}
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Upcoming Appointments</h3>
              {appointments
                .filter(app => !isAppointmentFinished(app.datetime))
                .map((appointment) => (
                  <div key={appointment.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium">{appointment.patient_name}</h4>
                    <p className="text-sm text-gray-500">
                      {format(new Date(appointment.datetime), 'h:mm a')}
                    </p>
                    <p className="text-sm text-gray-500">{appointment.type}</p>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};