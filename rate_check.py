import requests
import json
import threading

def request_task():
  url = "http://192.168.37.152:3000/owner/login"

  payload = json.dumps({
    "email": "typescript@gmail.com",
    "password": "typescript",
    "deviceToken": "d0t7zZMiRdiJNQhMVUv1ay:APA91bHHBNjHx6sXjk3Ee8PvEr6YKq6LBqLfgNCGCwVTP-Sj_-GE6sx2Un9aMOrR8gUnq9sCEGj05GsevgCLCwzQ3u4AW3zQ1aVlUvu3Wj5Q74sACpE9d48z9vyr1UOvawJ8H_pQqfEv"
  })
  headers = {
    'Content-Type': 'application/json'
  }
  response = requests.post(url, headers=headers, data=payload)
  print(response.text)


def fire_and_forget():
  threading.Thread(target=request_task).start()


times = 1

for i in range(times):
  fire_and_forget()