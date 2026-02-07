

from typing import Optional


def slice_wallet_address(wallet_address: Optional[str], prefix_length: int = 6, suffix_length: int = 4) -> str:
    if not wallet_address:
        return "Unknown"

    if len(wallet_address) <= prefix_length + suffix_length:
        return wallet_address

    return f"{wallet_address[:prefix_length]}...{wallet_address[-suffix_length:]}"
