import mwapi
import requests
import json

session = mwapi.Session("https://ff14.huijiwiki.com", user_agent="myBot/0.0.1")

# 读取文件名列表
response = requests.get("https://ff14.huijiwiki.com/api/rest_v1/namespace/data?filter={%22data_type%22:%22Card%22}&sort_by=ID&pagesize=900")
data = json.loads(response.text)
filenames = ["{:0>6d}.png".format(int(item['卡面'])) for item in data["_embedded"]]

# 遍历文件名列表
for filename in filenames:
    response = session.get(action='query', prop='imageinfo', titles='File:'+filename, iiprop='url')
    page_id = list(response['query']['pages'].keys())[0]
    url = response['query']['pages'][page_id]['imageinfo'][0]['url']
    response = requests.get(url)
    open(filename, 'wb').write(response.content)
    print(filename + ' 下载完成')
