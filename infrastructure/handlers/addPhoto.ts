import { v4 as uuid } from "uuid";
import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any) => {
  const albumId = event.pathParameters?.id;
  const { src, alt } = JSON.parse(event.body);

  if (!albumId || !src) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Album ID and photo source are required" }),
    };
  }

  const photoId = uuid();
  const photo = {
    id: photoId,
    src,
    alt,
  };

  await dynamodb
    .put({
      TableName: process.env.TABLE_NAME!,
      Item: {
        PK: `PHOTO#${albumId}#${photoId}`,
        SK: `PHOTO#${photoId}`,
        ...photo,
      },
    })
    .promise();

  return {
    statusCode: 201,
    body: JSON.stringify(photo),
  };
};
