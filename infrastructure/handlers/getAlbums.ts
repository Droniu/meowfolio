import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async () => {
  const result = await dynamodb
    .query({
      TableName: process.env.TABLE_NAME!,
      KeyConditionExpression: "SK = :album",
      ExpressionAttributeValues: {
        ":album": "ALBUM",
      },
    })
    .promise();

  const albums = result.Items || [];

  return {
    statusCode: 200,
    body: JSON.stringify(albums),
  };
};
