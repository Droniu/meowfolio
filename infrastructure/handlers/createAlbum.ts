import { v4 as uuid } from "uuid";
import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any) => {
  const { title, description, cover } = JSON.parse(event.body);

  if (!title || !cover) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Title and cover are required" }),
    };
  }

  const albumId = uuid();
  const album = {
    id: albumId,
    title,
    description,
    cover,
  };

  await dynamodb
    .put({
      TableName: process.env.TABLE_NAME!,
      Item: {
        PK: `ALBUM#${albumId}`,
        SK: "ALBUM",
        ...album,
      },
    })
    .promise();

  return {
    statusCode: 201,
    body: JSON.stringify(album),
  };
};
