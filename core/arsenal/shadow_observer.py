import requests
from fortress_config import ABUSEIPDB_KEY, SHODAN_KEY

def abuseipdb_lookup(ip_address):
    url = "https://api.abuseipdb.com/api/v2/check"
    headers = {"Accept": "application/json", "Key": ABUSEIPDB_KEY}
    params = {'ipAddress': ip_address, 'maxAgeInDays': '90'}
    try:
        response = requests.get(url, headers=headers, params=params)
        data = response.json()['data']
        return f"[ABUSEIPDB] Score:{data['abuseConfidenceScore']} ISP:{data['isp']} Usage:{data['usageType']}"
    except Exception as e:
        return f"[ABUSEIPDB] Failed: {e}"

def shodan_lookup(ip_address):
    url = f"https://api.shodan.io/shodan/host/{ip_address}?key={SHODAN_KEY}"
    try:
        response = requests.get(url)
        data = response.json()
        open_ports = ','.join(map(str, data.get('ports', [])))
        return f"[SHODAN] Ports:{open_ports} Hostnames:{data.get('hostnames', [])}"
    except Exception as e:
        return f"[SHODAN] Failed: {e}"

def shadow_observe(ip_address):
    print(f"[INTEL] Gathering threat data for {ip_address}...")
    print(abuseipdb_lookup(ip_address))
    print(shodan_lookup(ip_address))