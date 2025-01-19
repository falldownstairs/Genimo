from mongoengine import connect
import os

def InitClient():
    connect(host=os.environ['CONNECTION_STRING'])
    print("connection successful")

def CloseClient():
    pass