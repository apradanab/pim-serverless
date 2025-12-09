import { DatabaseService } from "../../lib/constructs/services/database-service";
import { Appointment, AppointmentStatus } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (): Promise<{ deleted: number; errors: number }> => {

  try {
    const now = new Date();
    const allAppts = await dbService.queryByType('Appointment');

    const expiredAvailableAppts = allAppts.filter(appt => {
      if (appt.status !== AppointmentStatus.AVAILABLE) return false;

      if (!appt.date || !appt.endTime) return false;

      const endDateTime = new Date(`${appt.date}T${appt.endTime}:00Z`);
      if (endDateTime >= now) return false;

      const maxParticipants = appt.maxParticipants ?? 0;
      const isGroupAppt = maxParticipants > 1;
      const hasParticipants = (appt.participants?.length ?? 0) > 0;

      if (isGroupAppt && hasParticipants) return false;

      return true;
    });

    let deleted = 0;
    let errors = 0;

    for (const appointment of expiredAvailableAppts) {
      try {
        await dbService.deleteItem(
          appointment.PK,
          appointment.SK
        );
        deleted++;

      } catch (err) {
        console.error(`Failed to complete appointment: ${appointment.appointmentId}`, err);
        errors++;
      }
    }

    console.log(`Completed ${deleted} expired available appointments. Errors: ${errors}`);
    return { deleted, errors };
  } catch (err) {
    console.error('Error running delete-expired-appointments:', err);
    throw err;
  }
}
