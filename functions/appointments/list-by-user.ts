import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { Appointment } from "../shared/types/appointment";
import { User } from "../shared/types/user";

interface CognitoClaims {
  sub: string;
  'cognito:groups'?: string[];
}

const dbService = new DatabaseService<Appointment>(process.env.TABLE_NAME!);

export const handler = async (event: {
  pathParameters?: { userId?: string };
  requestContext?: {
    authorizer?: {
      claims?: CognitoClaims
    }
  };
}): Promise<ApiResponse> => {
  try {
    const claims = event.requestContext?.authorizer?.claims;
    if(!claims) return error(403, 'Unauthorized');

    const isAdmin = claims['cognito:groups']?.includes('ADMIN');
    let targetUserId = claims.sub;

    if (isAdmin && event.pathParameters?.userId) {
      const targetUser = await dbService.getItem(
        `USER#${event.pathParameters.userId}`,
        `USER#${event.pathParameters.userId}`
      ) as unknown as User;

      if (!targetUser?.cognitoId) return error(404, 'User not found');
      targetUserId = targetUser.cognitoId;
    }

    const [ownerAppts, allAppts] = await Promise.all([
      dbService.queryByUserId(targetUserId),
      dbService.queryByType('Appointment')
    ]);

    const participantAppts = allAppts.filter(appt => {
      const maxParticipants = appt.maxParticipants ?? 0;
      if (!appt.participants || maxParticipants <= 1) return false;
      return appt.participants.some(p => p.userId === targetUserId);
    })

    const combinedAppointments = [...ownerAppts, ...participantAppts];

    const appointmentMap = new Map<string, Appointment>();

    combinedAppointments.forEach((appt: Appointment) =>
      appointmentMap.set(appt.appointmentId, appt)
    );

    const finalAppointments = Array.from(appointmentMap.values());
    return success(finalAppointments);

  } catch (err) {
    console.error('Error fetching appointments', err);
    return error(500, 'Internal Server Error');
  }
};
