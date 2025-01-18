from pymongo import MongoClient, server_api
import os

GlobalClient = None

def InitClient():
    GlobalClient = MongoClient(os.environ['CONNECTION_STRING'], server_api=server_api.ServerApi(
 version="1", strict=True, deprecation_errors=True))

def CloseClient():
    if GlobalClient != None: 
        GlobalClient.close()