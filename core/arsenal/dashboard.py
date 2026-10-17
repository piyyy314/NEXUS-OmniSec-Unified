from flask import Flask, request, jsonify
app = Flask(__name__)

pending_actions = []

@app.route('/alert', methods=['POST'])
def alert():
    action = request.json
    pending_actions.append(action)
    # Optionally trigger Slack/email here
    return jsonify({"status": "queued"})

@app.route('/approve', methods=['POST'])
def approve():
    idx = int(request.json["index"])
    # Call your response controller here
    return jsonify({"status": "executed"})