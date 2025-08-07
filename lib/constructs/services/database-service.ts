import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export class DatabaseService {
  private docClient: DynamoDBDocumentClient;

  constructor(private tableName: string) {
    this.docClient = DynamoDBDocumentClient.from(new DynamoDBClient());
  }

  async createItem(item: Record<string, unknown>) {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item,
    }));
    return item;
  }

  async getITem(pk: string, sk:string) {
    const result = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk },
    }));
    return result.Item;
  }
}
