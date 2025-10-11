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
  headers?: { [key: string]: string}
}

export const success = (data: unknown): ApiResponse => ({
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  },
  body: JSON.stringify(data),
});

export const error = (code: number, message: string): ApiResponse => ({
  statusCode: code,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
  },
  body: JSON.stringify({ error: message }),
})

//Dynamo Types
export interface DynamoItem {
  PK: string;
  SK: string;
  [key: string]: unknown;
}
