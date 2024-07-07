from flask import Flask, request, jsonify
import json
import os
import requests

app = Flask(__name__)

CONFIG_URL = os.environ.get('CONFIG_URL')

# CORS Allow
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return response

# Error handler
@app.errorhandler(404)
def page_not_found(e):
    return jsonify({'error': f'Not Found: {request.url}, method: {request.method}'}), 404

def get_config() -> dict:
    response = requests.get(CONFIG_URL)
    return response.json().get('items', {})
    # with open('./api/data.json') as f:
    #     return json.load(f)

def read_data() -> dict:
    # item = get_config().get('data', {})
    item = get_config().get('data', {})
    assert isinstance(item, dict)
    return item

def return_with_first_key(item: dict) -> dict:
    assert len(list(item.keys())) >= 1
    return item.get(list(item.keys())[-1], {})

def return_with_all_key(item: dict) -> dict:
    result = {}
    # try:
    for semester in item.keys():
        assert isinstance(item[semester], dict)
        for gpa in item[semester].keys():
            if(gpa not in result):
                result[gpa] = item[semester][gpa]
            else:
                for id in item[semester][gpa].keys():
                    if(id not in result[gpa]):
                        result[gpa][id] = item[semester][gpa][id]
                    else:
                        result[gpa][id] += item[semester][gpa][id]
    # except:
    #     return item
    return result

@app.route('/api/v1/test')
def test():
    return os.environ.get('CONFIG_URL')

@app.route('/api/v1/getCourses')
def getCourses():
    item = read_data()
    return jsonify(list(item.keys()))

@app.route('/api/v1/getSemesterByCourseName', methods=['POST'])
def getSemesterByCourseName():
    data = request.get_json()
    courseName = data.get('course_name')
    item = read_data()
    couseData = item.get(courseName, {})
    assert isinstance(couseData, dict)

    return jsonify(list(couseData.keys()))

@app.route('/api/v1/getGPAByCourseName', methods=['POST'])
def getGPAByCouseName():
    data = request.get_json()
    courseName = data.get('course_name')
    semester = data.get('semester')
    item = read_data()
    if(semester):
        return jsonify(item.get(courseName, {}).get(semester, {}))
    else:
        return jsonify(return_with_all_key(item.get(courseName, {})))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)