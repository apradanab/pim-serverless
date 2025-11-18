import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoItem } from '../../../functions/shared/dynamo';

export class DatabaseService<T extends DynamoItem> {
  private docClient: DynamoDBDocumentClient;

  constructor(private tableName: string) {
    const region = process.env.AWS_REGION;
    this.docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
  }

  async createItem(item: T): Promise<T> {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item,
    }));
    return item;
  }

  async getItem(pk: string, sk:string): Promise<T> {
    const result = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk },
    }));
    return result.Item as T;
  }

  async updateItem(pk: string, sk:string, inputAttributes: Partial<T>): Promise<void> {
    const { PK: _PK, SK: _SK, ...restOfAttributes } = inputAttributes;
    const updatableAttributes = restOfAttributes;

    if (!Object.keys(updatableAttributes).length) {
      throw new Error('Noattributes provided')
    }

    const updateExpression = `SET ${Object.keys(updatableAttributes).map(k => `#${k} = :${k}`).join(', ')}`;

    const expressionAttributeNames = Object.keys(updatableAttributes).reduce((acc, key) => ({
      ...acc,
      [`#${key}`]: key
    }), {});

    const expressionAttributeValues = Object.keys(updatableAttributes).reduce((acc, key) => ({
      ...acc,
      [`:${key}`]: updatableAttributes[key as keyof typeof updatableAttributes]
    }), {});

    await this.docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }));
  }

  async deleteItem(pk: string, sk: string): Promise<void> {
    await this.docClient.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk},
    }));
  }

  async queryByType(type: string): Promise<T[]> {
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'TypeIndex',
        KeyConditionExpression: '#type = :type',
        ExpressionAttributeNames: { '#type': 'Type' },
        ExpressionAttributeValues: { ':type': type }
      }));

      return (result.Items || []) as T[];
    } catch (error) {
      console.error('Error querying by type:', error);
      throw error;
    }
  }

  async queryItems(pk: string, skPrefix: string): Promise<T[]> {
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': skPrefix
      }
    }))

    return (result.Items || [])as T[];
  }

  async queryByEmail(email: string): Promise<T[]> {
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: '#email = :email',
      ExpressionAttributeNames: {
        '#email': 'email'
      },
      ExpressionAttributeValues: {
        ':email': email
      }
    }));

    return (result.Items || []) as T[];
  }

  async queryByUserId(userId: string): Promise<T[]> {
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'UserAppointmentsIndex',
      KeyConditionExpression: 'GSI2PK = :gsi2pk',
      ExpressionAttributeValues: {
          ':gsi2pk': `USER#${userId}`
        }
    }));

    return (result.Items || []) as T[];
  }
}
