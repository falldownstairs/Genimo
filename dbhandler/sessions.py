from mongoengine import *
import datetime
import json
from enum import Enum

class Strategy(Enum):
    SEARCH = 1
    ANSWER = 2
    INSPIRE = 3

class Session(Document):
    date_modified = DateTimeField(default=datetime.datetime.now)
    context = []
    messages = []
    strategy  = Strategy.SEARCH


def CreateSession():
    newSession = Session()
    newSession.save()
    return newSession.to_json()

def GetSession(id):
    retr = Session.objects.get(id = id)
    return retr.to_json()
    
