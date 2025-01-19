import atexit
import sys

from flask import Flask, abort, request, send_file

from dbhandler import dbclient, sessions


def initialize_app():
    """
    This function will be executed once before the first request
    to your Flask application is handled.
    """
    print("Initializing the application...")
    dbclient.InitClient()


class MyFlaskApp(Flask):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        initialize_app()


app = MyFlaskApp(__name__)


def shutdown():
    dbclient.CloseClient()


atexit.register(shutdown)


@app.route("/getsession")
def getSession():
    session = request.args.get("session")

    if session != None:
        retr = sessions.GetSession(session)
        if retr:
            return retr, 200
        else:
            return sessions.CreateSession(), 200
    else:
        return sessions.CreateSession(), 200


app.route("/messages", methods=["POST"])


def processMsg():
    messageData = request.get_json()
    session = request.args.get("session")
    message = messageData.get("msg")
    # apply context filtering here, and determine if should add to context

    # respond with output


app.route("/messages", methods=["GET"])


def getMessages():
    session = request.args.get("session")
    retr = sessions.GetSession()
    return retr["messages"], 200


# Dynamic route to serve videos
@app.route("/video/<video_name>")
def get_video(video_name):
    # Construct the file path based on the variable
    video_path = f"media/videos/1080p60/{video_name}"

    try:
        # Serve the video file
        return send_file(video_path, mimetype="video/mp4")
    except FileNotFoundError:
        # Handle file not found
        abort(404, description="Video not found")
