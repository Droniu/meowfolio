import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =============================
    // 1) S3 Bucket
    // =============================
    const photoBucket = new s3.Bucket(this, "PhotoBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // =============================
    // 2) DynamoDB Table
    //    (If you need it for albums)
    // =============================
    const albumTable = new dynamodb.Table(this, "AlbumTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // =============================
    // 3) Lambda Functions
    // =============================
    const getSignedUrlsBulkLambda = new lambda.Function(
      this,
      "GetSignedUrlsBulkLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X, // or NODEJS_16_X, etc.
        code: lambda.Code.fromAsset("handlers"), // path to your handlers folder
        handler: "getSignedUrlsBulk.handler", // "filename.exportedFunction"
        environment: {
          BUCKET_NAME: photoBucket.bucketName,
        },
      }
    );
    photoBucket.grantPut(getSignedUrlsBulkLambda);

    const createAlbumLambda = new lambda.Function(this, "CreateAlbumLambda", {
      runtime: lambda.Runtime.NODEJS_18_X, // or NODEJS_16_X, etc.
      code: lambda.Code.fromAsset("handlers"), // directory containing createAlbum.ts
      handler: "createAlbum.handler", // "filename.exportName"
      environment: {
        TABLE_NAME: albumTable.tableName,
      },
    });
    albumTable.grantWriteData(createAlbumLambda);

    const addPhotosBulkLambda = new lambda.Function(
      this,
      "AddPhotosBulkLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset("handlers"),
        handler: "addPhotosBulk.handler",
        environment: {
          TABLE_NAME: albumTable.tableName,
        },
      }
    );
    albumTable.grantWriteData(addPhotosBulkLambda);

    const deletePhotoLambda = new lambda.Function(this, "DeletePhotoLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("handlers"), // Directory where deletePhoto.ts is located
      handler: "deletePhoto.handler",
      environment: {
        TABLE_NAME: albumTable.tableName,
      },
    });
    // Grant write data so it can delete items from DynamoDB
    albumTable.grantWriteData(deletePhotoLambda);

    // =============================
    // 4) API Gateway
    // =============================
    const api = new apigateway.RestApi(this, "PhotoApi", {
      restApiName: "Photo API",
    });

    /**
     *  POST /albums          -> createAlbumLambda
     *  POST /signed-urls     -> getSignedUrlsBulkLambda
     *  POST /albums/{id}/photos -> addPhotosBulkLambda
     */

    // /albums Resource
    const albumsResource = api.root.addResource("albums");
    albumsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createAlbumLambda)
    );

    // /signed-urls Resource
    const signedUrlsResource = api.root.addResource("signed-urls");
    signedUrlsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(getSignedUrlsBulkLambda)
    );

    // /albums/{id}/photos resource
    const albumIdResource = albumsResource.addResource("{id}");
    const photosResource = albumIdResource.addResource("photos");
    const photoIdResource = photosResource.addResource("{photoId}");
    // POST /albums/{id}/photos
    photosResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(addPhotosBulkLambda)
    );
    photoIdResource.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deletePhotoLambda)
    );

    // =============================
    // 5) Outputs
    // =============================
    new cdk.CfnOutput(this, "PhotoBucketName", {
      value: photoBucket.bucketName,
      description: "The name of the S3 bucket for photo storage.",
    });

    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: api.url,
      description: "The base URL of the API Gateway.",
    });
  }
}
