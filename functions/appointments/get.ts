import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment } from "../shared/types/appointment";

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (event: {
   pathParameters?: { therapyId?: string; appointmentId?: string };
  }): Promise<ApiResponse> => {
    const { therapyId, appointmentId } = event.pathParameters || {};

    if (!therapyId || !appointmentId) {
      return error(400, 'Therapy id and Appointment id are required');
    }

    try {
      const appointment = await dbService.getItem(
        `THERAPY#${therapyId}`,
        `APPOINTMENT#${appointmentId}`
      );

      if (!appointment) return error(404, 'Appointment not found');

      return success(appointment);
    } catch (err) {
      console.error('Error fetching appointment:', err);
      return error(500, 'Internal Server Error');
    }
  }
