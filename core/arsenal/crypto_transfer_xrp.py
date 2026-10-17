import xrpl
from xrpl.wallet import Wallet as XRPLWallet
from xrpl.clients import JsonRpcClient
from xrpl.transaction import safe_sign_and_autofill_transaction, send_reliable_submission
from xrpl.models.transactions import Payment
from xrpl.utils import xrp_to_drops

def send_xrp(seed, to_addr, value_xrp):
    client = JsonRpcClient("https://s1.ripple.com:51234/")
    wallet = XRPLWallet(seed, 0)
    account = wallet.classic_address
    payment = Payment(
        account=account,
        destination=to_addr,
        amount=str(xrp_to_drops(value_xrp))
    )
    signed_tx = safe_sign_and_autofill_transaction(payment, wallet, client)
    tx_response = send_reliable_submission(signed_tx, client)
    print(f"[+] XRP sent: https://livenet.xrpl.org/transactions/{tx_response.result['hash']}")
    return tx_response.result['hash']