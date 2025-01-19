import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for photo storage
    const photoBucket = new s3.Bucket(this, "PhotoBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Automatically delete bucket on stack deletion
      autoDeleteObjects: true, // Ensure objects are deleted with the bucket
    });

    // DynamoDB Table for Albums
    const albumTable = new dynamodb.Table(this, "AlbumTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Automatically delete table on stack deletion
    });

    // Lambda Function for API Logic
    const apiLambda = new lambda.Function(this, "ApiLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "index.handler",
      environment: {
        PHOTO_BUCKET: photoBucket.bucketName,
        ALBUM_TABLE: albumTable.tableName,
      },
    });

    // Grant Lambda permissions to access S3 and DynamoDB
    photoBucket.grantReadWrite(apiLambda);
    albumTable.grantFullAccess(apiLambda);

    // API Gateway for exposing endpoints
    const api = new apigateway.RestApi(this, "PhotoApi", {
      restApiName: "Photo API",
    });

    // Integrate API Gateway with Lambda
    const apiIntegration = new apigateway.LambdaIntegration(apiLambda);

    // Define API Endpoints
    const albumsResource = api.root.addResource("albums");
    albumsResource.addMethod("GET", apiIntegration); // GET /albums
    albumsResource.addMethod("POST", apiIntegration); // POST /albums

    const albumResource = albumsResource.addResource("{id}");
    albumResource.addMethod("GET", apiIntegration); // GET /albums/{id}
    albumResource.addMethod("PUT", apiIntegration); // PUT /albums/{id}
    albumResource.addMethod("DELETE", apiIntegration); // DELETE /albums/{id}

    const photosResource = api.root.addResource("photos");
    photosResource.addMethod("POST", apiIntegration); // POST /photos
    photosResource.addMethod("DELETE", apiIntegration); // DELETE /photos

    // Output important information
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
