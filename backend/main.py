import atexit
import sys

from flask import Flask, abort, request, send_file
from flask_cors import CORS

from dbhandler import dbclient, sessions
from script import (
    determine_strategy,
    extract_context,
    generate_answer_content,
    generate_code,
    generate_inspire_content,
    generate_queryResp,
    moderate_input,
)


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
CORS(app)


def shutdown():
    dbclient.CloseClient()


atexit.register(shutdown)


@app.route("/getsession")
def getSession():
    session = request.args.get("session")

    if session is not None:
        retr = sessions.GetSession(session)
        if retr:
            return retr, 200
        else:
            return sessions.CreateSession(), 200
    else:
        return sessions.CreateSession(), 200


@app.route("/messages", methods=["POST"])
async def processMsg():
    messageData = request.get_json()
    session = request.args.get("session")
    message = messageData.get("msg")
    # moderation
    moderate_clearance = await moderate_input(message)
    if moderate_clearance == "GOOD":
        sessions.AddMessage(message, session)
    elif moderate_clearance == "BAD":
        bad_msg = "Sorry, that is inappropriate."
        sessions.AddMessage(bad_msg, session, sentByBot=True)
        return {"msg": {"bot" : bad_msg}}, 200
    else:
        no_understand_msg = "Sorry, I don't understand."
        sessions.AddMessage(no_understand_msg, session, sentByBot=True)
        return {"msg": {"bot" :no_understand_msg}}, 200

    # identify context
    context = await extract_context(message)
    if context == "too many ideas":
        overload_msg = "Woah, slow down a bit."
        sessions.AddMessage(overload_msg, session, sentByBot=True)
        return {"msg": {"bot" :overload_msg}}, 200
    elif context == "no context":
        pass
    else:
        sessions.AddContext(context, session)
    # evaluate if enough context to generate and then respond accordingly
    ctx = sessions.GetContext(session)
    newStrat = await determine_strategy(ctx)
    sessions.SetStrategy(int(newStrat), session)
    currStrat = sessions.GetStrategy(session)
    print(f"finished strategizing: {currStrat}")
    if currStrat == sessions.Strategy.QUERY:
        print("query more!")
        queryMsg = await generate_queryResp([f"{entry}" for entry in sessions.GetMessages(session)])
        sessions.AddMessage(queryMsg, session,  sentByBot=True)
        return {"msg": {"bot" :queryMsg}}, 200
    else:
        print("generate!")
        promptToUse = "default"
        if currStrat == sessions.Strategy.ANSWER:
            promptToUse = await generate_answer_content(sessions.GetContext(session))
        else:
            promptToUse = await generate_inspire_content(
                sessions.GetMessages(session)
            )

        print(promptToUse)
        # Pass into video generator and return a response
        video_name = await generate_code(promptToUse)
        video_url = f"/video/{video_name}"  # Construct video URL
        return {"msg": {"bot" : video_url}}, 200


@app.route("/messages", methods=["GET"])
def getMessages():
    session = request.args.get("session")
    return {"msgs": sessions.GetMessages(session)}, 200


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


if __name__ == "__main__":
    app.run(debug=True, port=2341)
