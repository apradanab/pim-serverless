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
