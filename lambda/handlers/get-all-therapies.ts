import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const command = new ScanCommand({
      TableName: process.env.TABLE_NAME,
      FilterExpression: '#type = :therapy',
      ExpressionAttributeNames: { '#type' : 'Type' },
      ExpressionAttributeValues: {
        ':therapy': { S: 'Therapy' },
      },
    });

    const response = await client.send(command);
    const items = response.Items?.map((item) => unmarshall(item)) ?? [];

    return {
      statusCode: 200,
      body: JSON.stringify(items),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error fetching therapies', error }),
    };
  }
}
