from mongoengine import *
import datetime
import json
from enum import Enum

class Strategy(Enum):
    QUERY = 1
    ANSWER = 2
    INSPIRE = 3

class Session(Document):
    date_modified = DateTimeField(default=datetime.datetime.now)
    context = []
    messages = []
    strategy  = Strategy.QUERY


def CreateSession():
    newSession = Session()
    newSession.save()
    return newSession.to_json()

def GetSession(id):
    retr = Session.objects.get(id = id)
    return retr.to_json()
    
def AddMessage(message, id,  sentByBot = False):
    retr = Session.objects.get(id = id)
    retr.messages.append(message)
