import subprocess, os, signal, platform
from .log_util import log_event

def block_ip_response(context, dry_run=False):
    ip = context.get("ip")
    if ip:
        log_event(f"[ACTION] Block IP {ip} (dry_run={dry_run})")
        if dry_run:
            return
        if platform.system().lower() == "linux":
            subprocess.run(['iptables', '-A', 'INPUT', '-s', ip, '-j', 'DROP'], check=True)
        elif platform.system().lower() == "windows":
            subprocess.run(['netsh', 'advfirewall', 'firewall', 'add', 'rule', f'name=block_{ip}', f'dir=in', f'action=block', f'remoteip={ip}'], check=True)

def disable_user_response(context, dry_run=False):
    user = context.get("username")
    if user:
        log_event(f"[ACTION] Disable user {user} (dry_run={dry_run})")
        if dry_run:
            return
        if platform.system().lower() == "linux":
            subprocess.run(['usermod', '--expiredate', '1', user], check=True)
        elif platform.system().lower() == "windows":
            subprocess.run(['net', 'user', user, '/active:no'], check=True)

def kill_process_response(context, dry_run=False):
    pid = context.get("pid")
    if pid:
        log_event(f"[ACTION] Kill process {pid} (dry_run={dry_run})")
        if dry_run:
            return
        try:
            os.kill(int(pid), signal.SIGKILL)
        except Exception as e:
            log_event(f"Killing process {pid} failed: {e}")

def quarantine_instance_response(context, dry_run=False):
    # Cloud example (AWS)
    instance_id = context.get("instance_id")
    if instance_id:
        log_event(f"[ACTION] Quarantine cloud instance {instance_id} (dry_run={dry_run})")
        if dry_run:
            return
        import boto3
        ec2 = boto3.client('ec2')
        ec2.modify_instance_attribute(InstanceId=instance_id, Groups=['sg-QUARANTINE'])