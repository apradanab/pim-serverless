//DynamoDB client
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export { docClient };

//Response helpers
export interface ApiResponse {
  statusCode: number;
  body: string;
}

export const success = (data: unknown): ApiResponse => ({
  statusCode: 200,
  body: JSON.stringify(data),
});

export const error = (code: number, message: string): ApiResponse => ({
  statusCode: code,
  body: JSON.stringify({ error: message }),
})

//Dynamo Types
export interface DynamoItem {
  PK: string;
  SK: string;
  [key: string]: unknown;
}
