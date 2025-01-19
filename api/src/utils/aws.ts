import AWS from "aws-sdk";

const getSignedUrl = async (bucketName: string, key: string) => {
  const s3 = new AWS.S3(); // Instantiate within the function
  return s3.getSignedUrlPromise("putObject", {
    Bucket: bucketName,
    Key: key,
    Expires: 300, // 5 minutes
  });
};

const saveToDynamo = async (tableName: string, item: Record<string, any>) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient(); // Instantiate within the function
  return dynamodb
    .put({
      TableName: tableName,
      Item: item,
    })
    .promise();
};

export const handler = async (event: any) => {
  const bucketName = process.env.BUCKET_NAME!;
  const tableName = process.env.TABLE_NAME!;

  if (event.path === "/signed-url" && event.httpMethod === "GET") {
    const signedUrl = await getSignedUrl(bucketName, "example-photo.jpg");
    return {
      statusCode: 200,
      body: JSON.stringify({ signedUrl }),
    };
  }

  if (event.path === "/save" && event.httpMethod === "POST") {
    const item = JSON.parse(event.body);
    const result = await saveToDynamo(tableName, item);
    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ error: "Not Found" }),
  };
};
