from flask import Flask, request, jsonify
import json
import os
import requests

app = Flask(__name__)

CONFIG_URL = os.environ.get('EDGE_CONFIG')

# Error handler
@app.errorhandler(404)
def page_not_found(e):
    return jsonify({'error': f'Not Found: {request.url}, method: {request.method}'}), 404

def get_config() -> dict:
    response = requests.get(CONFIG_URL)
    return response.json()

def read_data() -> dict:
    item = get_config().get('items', {}).get('data', {})
    assert isinstance(item, dict)
    return item

def return_with_first_key(item: dict) -> dict:
    assert len(list(item.keys())) >= 1
    return item.get(list(item.keys())[0], {})

@app.route('/api/v1/getSemesterByCourseName', methods=['POST'])
def getSemesterByCourseName():
    data = request.get_json()
    courseName = data.get('course_name')
    item = read_data()
    couseData = item.get(courseName, {})
    assert isinstance(couseData, dict)

    return jsonify(list(couseData.keys()))

@app.route('/api/v1/getGPAByCouseName', methods=['POST'])
def getGPAByCouseName():
    data = request.get_json()
    courseName = data.get('course_name')
    semester = data.get('semester')
    item = read_data()
    if(semester):
        return jsonify(item.get(courseName, {}).get(semester, {}))
    else:
        return jsonify(return_with_first_key(item.get(courseName, {})))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)