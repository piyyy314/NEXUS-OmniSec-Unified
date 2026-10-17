from web3 import Web3

def send_bnb(priv_key, to_addr, bnb_amt, rpc_url="https://bsc-dataseed.binance.org/"):
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    acct = w3.eth.account.privateKeyToAccount(priv_key)
    nonce = w3.eth.get_transaction_count(acct.address)
    tx = {
        'nonce': nonce,
        'to': to_addr,
        'value': w3.to_wei(bnb_amt, "ether"),
        'gas': 21000,
        'gasPrice': w3.to_wei("5", "gwei"),
        'chainId': 56
    }
    signed = w3.eth.account.sign_transaction(tx, priv_key)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    print(f"[+] BNB TxHash: {tx_hash.hex()}")
    return tx_hash.hex()

def send_shiba(priv_key, to_addr, shiba_amt, rpc_url="https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY"):
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    acct = w3.eth.account.privateKeyToAccount(priv_key)
    nonce = w3.eth.get_transaction_count(acct.address)
    shiba = w3.to_checksum_address("0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE")
    abi = '[{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"type":"function"}]'
    contract = w3.eth.contract(address=shiba, abi=abi)
    tx = contract.functions.transfer(to_addr, int(float(shiba_amt)*1e18)).build_transaction({
        'chainId': 1,
        'gas': 60000,
        'gasPrice': w3.to_wei('5',"gwei"),
        'nonce': nonce,
    })
    signed = w3.eth.account.sign_transaction(tx, priv_key)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    print(f"[+] SHIBA TxHash: {tx_hash.hex()}")
    return tx_hash.hex()