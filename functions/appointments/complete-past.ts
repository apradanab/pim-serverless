import { DatabaseService } from "../../lib/constructs/services/database-service";
import { Appointment, AppointmentStatus } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (): Promise<{ completed: number; errors: number }> => {

  try {
    const now = new Date();
    const AllAppointments = await dbService.queryByType('Appointment');

    const pastAppointments = AllAppointments.filter(appt => {
      if (appt.status === AppointmentStatus.COMPLETED ||
          appt.status === AppointmentStatus.CANCELLED ||
          appt.status === AppointmentStatus.PENDING ||
          appt.status === AppointmentStatus.CANCELLATION_PENDING) return false;

      const endDateTime = new Date(`${appt.date}T${appt.endTime}:00Z`);
      if (endDateTime >= now) return false;

      if (appt.status === AppointmentStatus.OCCUPIED) return true;

      if (appt.status === AppointmentStatus.AVAILABLE) {
        const maxParticipants = appt.maxParticipants ?? 0;
        const isGroupAppt = maxParticipants > 1;
        const hasParticipants = (appt.participants?.length ?? 0) > 0;

        if (isGroupAppt && hasParticipants) return true;
      }

      return false
    });

    let completed = 0;
    let errors = 0

    for (const appointment of pastAppointments) {
      try {
        await dbService.updateItem(
          appointment.PK,
          appointment.SK,
          { status: AppointmentStatus.COMPLETED }
        );
        completed++;
      } catch (err) {
        console.error(`Failed to complete appointment ${appointment.appointmentId}`, err);
        errors++;
      }
    }

    console.log(`Completed ${completed} past appointments. Errors: ${errors}`);
    return { completed, errors };
  } catch (err) {
    console.error('Error running complete-past-appointments:', err);
    throw err;
  }
}
