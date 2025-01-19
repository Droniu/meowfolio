import AWS from "aws-sdk";
import { v4 as uuid } from "uuid";

const s3 = new AWS.S3();

export const handler = async (event: any) => {
  const albumId = event.pathParameters?.id;
  const { files } = JSON.parse(event.body); // Array of { fileName, fileType }

  if (!albumId || !files || !Array.isArray(files)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Album ID and files array are required" }),
    };
  }

  const bucketName = process.env.BUCKET_NAME!;
  const signedUrls = files.map(
    (file: { fileName: string; fileType: string }) => {
      const photoId = uuid();
      const key = `albums/${albumId}/${photoId}-${file.fileName}`;
      const signedUrl = s3.getSignedUrl("putObject", {
        Bucket: bucketName,
        Key: key,
        ContentType: file.fileType,
        Expires: 300, // 5 minutes
      });

      return { signedUrl, key }; // Return the signed URL and key
    }
  );

  return {
    statusCode: 200,
    body: JSON.stringify(signedUrls),
  };
};
