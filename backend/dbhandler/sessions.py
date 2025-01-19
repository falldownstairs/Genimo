from mongoengine import *
import bson
import datetime
import json
from enum import Enum

class Strategy(Enum):
    QUERY = 1
    ANSWER = 2
    INSPIRE = 3

class Session(Document):
    date_modified = DateTimeField(default=datetime.datetime.now)
    context = ListField(StringField(), default=["no context"])
    messages = ListField(DictField(), default=[])
    strategy  = EnumField(Strategy, default=Strategy.QUERY)


def CreateSession():
    newSession = Session()
    newSession.save()
    return newSession.to_json()

def GetSession(sessionId):
    print(f"displaying:: {sessionId}")
    retr = Session.objects.get(id=bson.objectid.ObjectId(sessionId))
    return retr.to_json()
    
def AddMessage(message, sessionId,  sentByBot = False):
    retr = Session.objects.get(id=bson.objectid.ObjectId(sessionId))
    retr.messages.append(
        {"sender": "user" if not sentByBot else "bot",
         "message": message})
    retr.save()

def GetMessages(sessionId):
    retr = Session.objects.get(id=bson.objectid.ObjectId(sessionId))
    return retr.messages

def AddContext(ctx, sessionId):
    retr = Session.objects.get(id=bson.objectid.ObjectId(sessionId))
    retr.context.append(ctx)
    retr.save()

def GetContext(sessionId):
    retr = Session.objects.get(id=bson.objectid.ObjectId(sessionId))
    return retr.context

def SetStrategy(newStrat, sessionId):
    retr = Session.objects.get(id=bson.objectid.ObjectId(sessionId))
    retr.strategy = newStrat
    retr.save()

def GetStrategy(sessionId):
    retr = Session.objects.get(id=bson.objectid.ObjectId(sessionId))
    return retr.strategy