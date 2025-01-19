import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export type CreateAlbumEvent = APIGatewayProxyEvent & {
  body: string; // JSON string containing album data
};

export type AddPhotosEvent = APIGatewayProxyEvent & {
  body: string; // JSON string containing photo data
  pathParameters: {
    id: string; // Album ID
  };
};

export type LambdaResponse = APIGatewayProxyResult;
