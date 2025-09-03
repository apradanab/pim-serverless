import { DatabaseService } from "../../lib/constructs/services/database-service";
import { ApiResponse, error, success } from "../shared/dynamo";
import { CreateUserInput, User } from "../shared/types/user";
import { v4 as uuidv4 } from 'uuid';

const dbService = new DatabaseService<User>(process.env.TABLE_NAME!);

export const handler = async (event: { body?: string }): Promise<ApiResponse> => {
  try {
    const input = JSON.parse(event.body || '{}') as CreateUserInput;

    if (!input.name || !input.email || !input.message) {
      return error(400, 'Name, email and message are required');
    }

    const existingUsers = await dbService.queryByEmail(input.email);
    if (existingUsers.length > 0) {
      return error(409, 'User already exists with this email');
    }

    const userId = uuidv4();

    const newUser: User = {
      PK: `USER#${userId}`,
      SK: `USER#${userId}`,
      Type: 'User',
      userId,
      name: input.name,
      email: input.email,
      role: 'GUEST',
      approved: false,
      message: input.message,
      createdAt: new Date().toISOString(),
    };

    await dbService.createItem(newUser);

    return success({
      message: 'User created succesfully',
      userId,
      email: input.email
    });
  } catch (err) {
    console.error('Create user error:', err);
    return error(500, 'Error creating user')
  }
}
