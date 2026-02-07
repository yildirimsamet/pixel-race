

import os
import json
import logging
from typing import Dict, Any, Optional

import httpx

logger = logging.getLogger(__name__)


class NFTStorageService:


    def __init__(self):
        self.api_key = os.getenv("NFT_STORAGE_API_KEY")
        self.api_url = "https://api.nft.storage"

        if not self.api_key:
            logger.warning(
                "NFT_STORAGE_API_KEY not set. Get free API key at https://nft.storage"
            )

        logger.info("NFTStorageService initialized")

    async def upload_json(self, data: Dict[str, Any], filename: str) -> str:

        if not self.api_key:
            raise Exception(
                "NFT_STORAGE_API_KEY not configured. "
                "Get free API key at https://nft.storage"
            )

        try:
            logger.info(f"Uploading JSON to NFT.Storage: {filename}")

            json_bytes = json.dumps(data, indent=2).encode('utf-8')

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.api_url}/upload",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                    },
                    files={
                        "file": (filename, json_bytes, "application/json")
                    }
                )

                response.raise_for_status()
                result = response.json()

            cid = result["value"]["cid"]
            ipfs_uri = f"ipfs://{cid}"

            logger.info(f"✅ JSON uploaded to NFT.Storage: {ipfs_uri}")
            logger.debug(f"Gateway URL: https://nftstorage.link/ipfs/{cid}")

            return ipfs_uri

        except httpx.HTTPError as e:
            logger.error(f"NFT.Storage upload failed: {e}")
            raise Exception(f"Failed to upload JSON to NFT.Storage: {e}")

    async def upload_image(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str = "image/png"
    ) -> str:

        if not self.api_key:
            raise Exception(
                "NFT_STORAGE_API_KEY not configured. "
                "Get free API key at https://nft.storage"
            )

        try:
            logger.info(f"Uploading image to NFT.Storage: {filename} ({len(image_bytes)} bytes)")

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.api_url}/upload",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                    },
                    files={
                        "file": (filename, image_bytes, content_type)
                    }
                )

                response.raise_for_status()
                result = response.json()

            cid = result["value"]["cid"]
            ipfs_uri = f"ipfs://{cid}"

            logger.info(f"✅ Image uploaded to NFT.Storage: {ipfs_uri}")
            logger.debug(f"Gateway URL: https://nftstorage.link/ipfs/{cid}")

            return ipfs_uri

        except httpx.HTTPError as e:
            logger.error(f"NFT.Storage upload failed: {e}")
            raise Exception(f"Failed to upload image to NFT.Storage: {e}")

    def get_gateway_url(self, cid: str) -> str:

        return f"https://nftstorage.link/ipfs/{cid}"

    def get_cid_from_uri(self, ipfs_uri: str) -> str:

        return ipfs_uri.replace("ipfs://", "")

    async def get_upload_status(self, cid: str) -> Optional[Dict[str, Any]]:

        if not self.api_key:
            return None

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.api_url}/check/{cid}",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                    }
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"Upload status check failed for {cid}: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"Failed to check upload status: {e}")
            return None