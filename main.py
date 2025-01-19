import os

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

from script import generate_code_sync

app = Flask(__name__)
CORS(app)


# Route to process the message and generate the video URL
@app.route("/messages", methods=["POST"])
def processMsg():
    messageData = request.get_json()
    message = messageData.get("msg")

    if not message:
        return "No message provided", 400

    # Simulate message processing
    if "bad" in message.lower():
        return jsonify({"response": "Sorry, that message is inappropriate."}), 200

    # video creation
    generate_code_sync(message)

    video_name = "Animation"  # * need to implement name creation
    video_url = f"/video/{video_name}"
    return jsonify({"video_url": video_url}), 200


@app.route("/video/<video_name>")
def get_video(video_name):
    print("test")
    # Get the absolute path to the video file
    base_dir = os.path.abspath(os.path.dirname(__file__))
    video_path = os.path.join(
        base_dir, "media", "videos", "1080p60", f"{video_name}.mp4"
    )

    try:
        return send_file(video_path, mimetype="video/mp4")
    except FileNotFoundError:
        return "Video not found", 404


if __name__ == "__main__":
    app.run(debug=True, port=2341)
