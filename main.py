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

# auth section
@app.route("/getsession")
def getSession():
    session = request.args.get('session')

    if session != None:
        retr = sessions.GetSession(session)
        if retr:
            return  "Created long ago at " + retr, 200
        else:
            return "created " + sessions.CreateSession().date_modified, 200
    else:
        return "No Session specificed",  400

