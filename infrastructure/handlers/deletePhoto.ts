import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any) => {
  const albumId = event.pathParameters?.id;
  const photoId = event.pathParameters?.photoId;

  if (!albumId || !photoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Album ID and Photo ID are required" }),
    };
  }

  await dynamodb
    .delete({
      TableName: process.env.TABLE_NAME!,
      Key: {
        PK: `PHOTO#${albumId}#${photoId}`,
        SK: `PHOTO#${photoId}`,
      },
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Photo deleted" }),
  };
};
