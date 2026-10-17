import subprocess
import threading

class ResponseController:
    def __init__(self):
        self.response_map = {}  # maps alert types to response functions

    def register_response(self, alert_type, func):
        self.response_map[alert_type] = func

    def handle_alert(self, alert_type, context):
        print(f"[RESPONSE_CONTROLLER] Received alert: {alert_type} | {context}")
        if alert_type in self.response_map:
            try:
                self.response_map[alert_type](context)
            except Exception as e:
                print(f"[RESPONSE_CONTROLLER] ERROR in response: {e}")
        else:
            print(f"[RESPONSE_CONTROLLER] No response registered for: {alert_type}")

# Example: Block IP on suspicious activity
def block_ip_response(context):
    ip = context.get("ip")
    if ip:
        print(f"[AUTO-RESPONSE] Blocking IP {ip}")
        subprocess.run(['iptables', '-A', 'INPUT', '-s', ip, '-j', 'DROP'])

# Example: Disable user account
def disable_user_response(context):
    user = context.get("username")
    if user:
        print(f"[AUTO-RESPONSE] Disabling user {user}")
        subprocess.run(['usermod', '--expiredate', '1', user])

# Usage:
rc = ResponseController()
rc.register_response("suspicious_ip", block_ip_response)
rc.register_response("compromised_user", disable_user_response)

# From a sensor, invoke as:
# rc.handle_alert("suspicious_ip", {"ip": "1.2.3.4"})
# rc.handle_alert("compromised_user", {"username": "alice"})