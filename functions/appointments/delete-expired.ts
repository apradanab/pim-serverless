import { DatabaseService } from "../../lib/constructs/services/database-service";
import { Appointment, AppointmentStatus } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (): Promise<{ deleted: number; errors: number }> => {

  try {
    const now = new Date();
    const allApts = await dbService.queryByType('Appointment');

    const expiredAvailableApts = allApts.filter(apt => {
      if (apt.status !== AppointmentStatus.AVAILABLE) {
        return false;
      }

      if (!apt.date || !apt.endTime) {
        return false;
      }

      const endDateTime = new Date(`${apt.date}T${apt.endTime}:00Z`);
      return endDateTime < now;
    });

    let deleted = 0;
    let errors = 0;

    for (const appointment of expiredAvailableApts) {
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
