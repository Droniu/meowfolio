import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any) => {
  const albumId = event.pathParameters?.id;
  const { photos } = JSON.parse(event.body);

  if (!albumId || !photos || !Array.isArray(photos)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Album ID and a valid photos array are required",
      }),
    };
  }

  const photoItems = photos.map((photo: any) => ({
    PutRequest: {
      Item: {
        PK: `PHOTO#${albumId}#${photo.id}`,
        SK: `PHOTO#${photo.id}`,
        src: photo.src,
        alt: photo.alt,
      },
    },
  }));

  const chunks = [];
  const chunkSize = 25; // DynamoDB allows max 25 items per batch
  for (let i = 0; i < photoItems.length; i += chunkSize) {
    chunks.push(photoItems.slice(i, i + chunkSize));
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
    statusCode: 201,
    body: JSON.stringify({ message: "Photos added in bulk" }),
  };
};
