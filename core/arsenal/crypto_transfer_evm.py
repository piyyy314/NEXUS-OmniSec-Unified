from web3 import Web3

def send_evm(priv_key, to_addr, value, rpc_url, contract=None, decimals=18):
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    acct = w3.eth.account.privateKeyToAccount(priv_key)
    nonce = w3.eth.get_transaction_count(acct.address)
    chain = w3.eth.chain_id

    if contract is None:  # Native coin
        tx = {
            'nonce': nonce,
            'to': to_addr,
            'value': w3.to_wei(value, "ether"),
            'gas': 21000,
            'gasPrice': w3.to_wei("5", "gwei"),
            'chainId': chain
        }
        signed_tx = w3.eth.account.sign_transaction(tx, priv_key)
    else:  # ERC20 token
        abi = '[{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"type":"function"}]'
        contract_inst = w3.eth.contract(address=w3.to_checksum_address(contract), abi=abi)
        tx = contract_inst.functions.transfer(
            to_addr, int(float(value) * (10 ** decimals))
        ).build_transaction({
            'chainId': chain,
            'gas': 60000,
            'gasPrice': w3.to_wei('5', "gwei"),
            'nonce': nonce,
        })
        signed_tx = w3.eth.account.sign_transaction(tx, priv_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    print(f"[+] Sent! TxHash: {tx_hash.hex()}")
    return tx_hash.hex()