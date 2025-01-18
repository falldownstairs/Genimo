from flask import Flask, request
import atexit 
from dbhandler import dbclient
import sys
import dbhandler

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


# def shutdown():
#     dbc.CloseClient()
# atexit.register(shutdown)

# auth section
@app.route("/getsession")
def getSession():
    session = request.args.get('session')

    if session != None:
        if True:
            return  200
        else:
            return "Session not found" , 404
    else:
        return "No Session specificed",  400
