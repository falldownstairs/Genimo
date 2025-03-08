import asyncio
import atexit
import json
import os

from flask import Flask, Response, abort, request, send_file
from flask_cors import CORS
from script import (
    concise_explanation,
    determine_strategy,
    explanation_to_code,
    extract_context,
    generate_answer_content,
    generate_code,
    generate_content,
    generate_inspire_content,
    generate_queryResp,
    moderate_input,
    query_to_explanation,
    render_video,
)

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
CORS(app, resources={r"/*": {"origins": "*"}})


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
        return {"msg": {"bot": bad_msg}}, 200
    else:
        no_understand_msg = "Sorry, I don't understand."
        sessions.AddMessage(no_understand_msg, session, sentByBot=True)
        return {"msg": {"bot": no_understand_msg}}, 200

    # identify context
    context = await extract_context(message)
    if context == "too many ideas":
        overload_msg = "Woah, slow down a bit."
        sessions.AddMessage(overload_msg, session, sentByBot=True)
        return {"msg": {"bot": overload_msg}}, 200
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
        queryMsg = await generate_queryResp(
            [f"{entry}" for entry in sessions.GetMessages(session)]
        )
        sessions.AddMessage(queryMsg, session, sentByBot=True)
        return {"msg": {"bot": queryMsg}}, 200
    else:
        print("generate!")
        promptToUse = "default"
        if currStrat == sessions.Strategy.ANSWER:
            print(sessions.GetContext(session))
            promptToUse = await generate_answer_content(sessions.GetContext(session))
        else:
            print(sessions.GetMessages(session))
            promptToUse = await generate_inspire_content(sessions.GetMessages(session))

        print(promptToUse)
        # Pass into video generator and return a response
        await generate_code(promptToUse)
        video_name = "Animation"  # hardcoded for now
        video_url = f"/video/{video_name}"  # Construct video URL
        return {"msg": {"bot": video_url}}, 200


@app.route("/messages", methods=["GET"])
def getMessages():
    session = request.args.get("session")
    return {"msgs": sessions.GetMessages(session)}, 200


def sync_generator(async_gen):
    loop = asyncio.new_event_loop()
    try:
        while True:
            yield loop.run_until_complete(anext(async_gen))
    except StopAsyncIteration:
        pass
    finally:
        loop.close()


@app.route("/messages/stream", methods=["GET"])
def processStreamMsg():
    message = request.args.get("msg")
    session = request.args.get("session")

    async def generate_async():
        # Send initial thinking status
        ymessage = "Thinking..."
        yield f"data: {json.dumps({'type': 'status', 'message': ymessage})}\n\n"

        # Moderation check
        moderate_clearance = await moderate_input(message)
        if moderate_clearance == "GOOD":
            sessions.AddMessage(message, session)
        elif moderate_clearance == "BAD":
            bad_msg = "Sorry, that is inappropriate."
            sessions.AddMessage(bad_msg, session, sentByBot=True)
            yield f"data: {json.dumps({'type': 'message', 'message': bad_msg})}\n\n"
            return
        else:
            no_understand_msg = "Sorry, I don't understand."
            sessions.AddMessage(no_understand_msg, session, sentByBot=True)
            yield f"data: {json.dumps({'type': 'message', 'message': no_understand_msg})}\n\n"
            return

        # Context identification
        context = await extract_context(message)
        if context == "too many ideas":
            overload_msg = "Woah, slow down a bit."
            sessions.AddMessage(overload_msg, session, sentByBot=True)
            yield f"data: {json.dumps({'type': 'message', 'message': overload_msg})}\n\n"
            return
        elif context == "no context":
            pass
        else:
            sessions.AddContext(context, session)

        # Strategy determination
        ctx = sessions.GetContext(session)
        newStrat = await determine_strategy(ctx)
        sessions.SetStrategy(int(newStrat), session)
        currStrat = sessions.GetStrategy(session)

        if currStrat == sessions.Strategy.QUERY:
            yield f"data: {json.dumps({'type': 'status', 'message': 'Let me ask you something...'})}\n\n"
            queryMsg = await generate_queryResp(
                [f"{entry}" for entry in sessions.GetMessages(session)]
            )
            sessions.AddMessage(queryMsg, session, sentByBot=True)
            yield f"data: {json.dumps({'type': 'message', 'message': queryMsg})}\n\n"
            return

        # Generate content
        promptToUse = "default"
        if currStrat == sessions.Strategy.ANSWER:
            promptToUse = await generate_answer_content(sessions.GetContext(session))
        else:
            promptToUse = await generate_inspire_content(sessions.GetMessages(session))

        ymessage += f"\n\nI'll explain about: {promptToUse}"

        yield f"data: {json.dumps({'type': 'status', 'message': ymessage})}\n\n"

        # Generate explanation
        ymessage += "\n\nI'm thinking of an explanation..."
        yield f"data: {json.dumps({'type': 'status', 'message': ymessage})}\n\n"

        explanation = await generate_content(promptToUse, query_to_explanation)
        concise_explanation_text = await concise_explanation(explanation)
        print("Received explanation")

        # Generate code
        ymessage += "\n\nI'm building the animations..."
        yield f"data: {json.dumps({'type': 'status', 'message': ymessage})}\n\n"

        code = await generate_content(explanation, explanation_to_code)
        code = code.replace("```python", "").replace("```", "")
        code += "\nscene = Animation()\nscene.render()\n"
        print("Received code")

        # Render video
        ymessage += "\n\nI'm rendering the video..."
        yield f"data: {json.dumps({'type': 'status', 'message': ymessage})}\n\n"
        yield f"data: {json.dumps({'type': 'vid_message', 'message': concise_explanation_text})}\n\n"

        render_video(code)
        print("Rendered video")

        video_name = "Animation"
        video_url = f"/video/{video_name}"
        yield f"data: {json.dumps({'type': 'video', 'url': video_url})}\n\n"

    return Response(sync_generator(generate_async()), mimetype="text/event-stream")


# Dynamic route to serve videos
@app.route("/video/<video_name>")
def get_video(video_name):
    video_name = f"{video_name}.mp4"
    # Get the absolute path to the media directory
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    video_path = os.path.join(base_dir, "media", "videos", "1080p60", video_name)

    try:
        # Serve the video file
        return send_file(video_path, mimetype="video/mp4")
    except FileNotFoundError:
        # Handle file not found
        abort(404, description="Video not found")


if __name__ == "__main__":
    app.run(port=os.getenv("PORT", 2341))
