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

  // Query for all photos in the album
  const photos = await dynamodb
    .query({
      TableName: process.env.TABLE_NAME!,
      KeyConditionExpression: "PK = :albumId AND begins_with(SK, :photoPrefix)",
      ExpressionAttributeValues: {
        ":albumId": `PHOTO#${albumId}`,
        ":photoPrefix": "PHOTO#",
      },
    })
    .promise();

  // Prepare delete requests for album and photos
  const deleteRequests = [
    {
      DeleteRequest: {
        Key: { PK: `ALBUM#${albumId}`, SK: "ALBUM" },
      },
    },
    ...photos.Items!.map((photo) => ({
      DeleteRequest: {
        Key: { PK: photo.PK, SK: photo.SK },
      },
    })),
  ];

  const chunks = [];
  const chunkSize = 25;
  for (let i = 0; i < deleteRequests.length; i += chunkSize) {
    chunks.push(deleteRequests.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    await dynamodb
      .batchWrite({
        RequestItems: {
          [process.env.TABLE_NAME!]: chunk,
        },
      })
      .promise();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Album and associated photos deleted" }),
  };
};
