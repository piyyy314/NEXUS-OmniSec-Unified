from tonpy import TonApi

def send_ton(mnemonic, to_addr, value_ton):
    ton = TonApi()  # Defaults to testnet, configure for mainnet
    wallet = ton.wallet.from_mnemonic(mnemonic)
    tx = wallet.transfer(to_addr, int(float(value_ton)*1e9))
    print(f"[+] TON sent: hash={tx['id']}")
    return tx['id']