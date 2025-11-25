#!/bin/bash

echo "Waiting for LocalStack to be ready"
sleep 5

aws --endpoint-url=http://localhost:4566 s3 mb s3://eventsphere-uploads --region us-east-1

aws --endpoint-url=http://localhost:4566 s3api put-bucket-cors --bucket eventsphere-uploads --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}'

echo "S3 bucket 'eventsphere-uploads' created successfully!"
