import { DatabaseService } from "../../lib/constructs/services/database-service";
import { Appointment, AppointmentStatus } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (): Promise<{ completed: number; errors: number }> => {

  try {
    const now = new Date();
    const AllAppointments = await dbService.queryByType('Appointment');

    const pastAppointments = AllAppointments.filter(apt => {
      if(
        apt.status !== AppointmentStatus.OCCUPIED ||
        !apt.date ||
        !apt.endTime
      ) return false;

      const endDateTime = new Date(`${apt.date}T${apt.endTime}:00Z`);
      return endDateTime < now;
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
