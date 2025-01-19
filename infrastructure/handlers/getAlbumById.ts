import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any) => {
  const albumId = event.pathParameters?.id;

  if (!albumId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Album ID is required" }),
    };
  }

  const result = await dynamodb
    .query({
      TableName: process.env.TABLE_NAME!,
      KeyConditionExpression: "PK = :albumId AND SK = :album",
      ExpressionAttributeValues: {
        ":albumId": `ALBUM#${albumId}`,
        ":album": "ALBUM",
      },
    })
    .promise();

  const album = result.Items?.[0];

  if (!album) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Album not found" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(album),
  };
};
