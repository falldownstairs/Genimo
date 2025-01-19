from flask import Flask, request
import atexit 
from dbhandler import dbclient, sessions
import sys

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
    session = request.args.get('session')

    if session != None:
        retr = sessions.GetSession(session)
        if retr:
            return  retr, 200
        else:
            return sessions.CreateSession(), 200
    else:
        return sessions.CreateSession(), 200

app.route("/messages", methods = ["POST"])
def processMsg():
    messageData = request.get_json()
    session = request.args.get('session')
    message = messageData.get("msg")
    # apply context filtering here, and determine if should add to context



    # respond with output


app.route("/messages", methods = ["GET"])
def getMessages():
    session = request.args.get('session')
    retr = sessions.GetSession()
    return retr["messages"], 200
