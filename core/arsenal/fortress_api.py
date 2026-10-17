from flask import Flask, jsonify, request
import subprocess
import threading

app = Flask(__name__)

@app.route('/status')
def status():
    return jsonify({"status":"running"})

@app.route('/logs')
def logs():
    try:
        with open("fortress_activity.log") as f:
            return jsonify({"logs": f.readlines()[-50:] })
    except:
        return jsonify({"error": "Could not read logs"}), 500

@app.route('/start_module', methods=['POST'])
def start_module():
    m = request.json.get("module")
    if m not in ["tarpit.py", "sentinel.py", "canary_listener.py"]:
        return jsonify({"error":"Invalid module"}), 400
    threading.Thread(target=lambda: subprocess.call(["python", m])).start()
    return jsonify({"started": m})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)