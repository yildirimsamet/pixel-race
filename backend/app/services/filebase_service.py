

import os
import json
import logging
from typing import Dict, Any

import aioboto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class FilebaseService:


    def __init__(self):
        self.access_key = os.getenv("FILEBASE_ACCESS_KEY", "3F6E13F9B29FA681CB27")
        self.secret_key = os.getenv("FILEBASE_SECRET_KEY", "oTwg7PPt1jn342kGIiPuiSHPQskcbjV5n2Af1k2F")
        self.bucket_name = os.getenv("FILEBASE_BUCKET", "pixel-race-nfts")
        self.endpoint_url = 'https://s3.filebase.com'

        logger.info(f"FilebaseService initialized (bucket: {self.bucket_name})")

    async def _ensure_bucket_exists(self, s3_client):

        try:
            await s3_client.head_bucket(Bucket=self.bucket_name)
            logger.debug(f"Bucket {self.bucket_name} exists")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                logger.info(f"Creating bucket {self.bucket_name}...")
                try:
                    await s3_client.create_bucket(Bucket=self.bucket_name)
                    logger.info(f"Bucket {self.bucket_name} created successfully")
                except ClientError as create_error:
                    logger.error(f"Failed to create bucket: {create_error}")
            else:
                logger.error(f"Error checking bucket: {e}")

    async def upload_json(self, data: Dict[str, Any], filename: str) -> str:

        try:
            json_bytes = json.dumps(data, indent=2).encode('utf-8')

            logger.info(f"Uploading JSON to Filebase: {filename} ({len(json_bytes)} bytes)")

            session = aioboto3.Session()
            async with session.client(
                's3',
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key
            ) as s3_client:
                await self._ensure_bucket_exists(s3_client)

                response = await s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=filename,
                    Body=json_bytes,
                    ContentType='application/json',
                    Metadata={
                        'Content-Type': 'application/json'
                    }
                )

                cid = response['ResponseMetadata']['HTTPHeaders'].get('x-amz-meta-cid')

                if not cid:
                    logger.error(f"CID not found in response headers: {response['ResponseMetadata']['HTTPHeaders']}")
                    raise Exception("CID not returned by Filebase")

                ipfs_uri = f"ipfs://{cid}"

                logger.info(f"JSON uploaded successfully: {ipfs_uri}")
                logger.debug(f"Accessible at: https://ipfs.filebase.io/ipfs/{cid}")

                return ipfs_uri

        except ClientError as e:
            logger.error(f"Filebase upload failed: {e}")
            raise Exception(f"Failed to upload JSON to IPFS: {e}")

    async def upload_image(self, image_bytes: bytes, filename: str, content_type: str = "image/png") -> str:

        try:
            logger.info(f"Uploading image to Filebase: {filename} ({len(image_bytes)} bytes)")

            session = aioboto3.Session()
            async with session.client(
                's3',
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key
            ) as s3_client:
                await self._ensure_bucket_exists(s3_client)

                response = await s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=filename,
                    Body=image_bytes,
                    ContentType=content_type,
                    Metadata={
                        'Content-Type': content_type
                    }
                )

                cid = response['ResponseMetadata']['HTTPHeaders'].get('x-amz-meta-cid')

                if not cid:
                    logger.error(f"CID not found in response headers: {response['ResponseMetadata']['HTTPHeaders']}")
                    raise Exception("CID not returned by Filebase")

                ipfs_uri = f"ipfs://{cid}"

                logger.info(f"Image uploaded successfully: {ipfs_uri}")
                logger.debug(f"Accessible at: https://ipfs.filebase.io/ipfs/{cid}")

                return ipfs_uri

        except ClientError as e:
            logger.error(f"Filebase upload failed: {e}")
            raise Exception(f"Failed to upload image to IPFS: {e}")

    def get_gateway_url(self, cid: str) -> str:

        return f"https://ipfs.filebase.io/ipfs/{cid}"

    def get_cid_from_uri(self, ipfs_uri: str) -> str:

        return ipfs_uri.replace("ipfs://", "")