from flask import Flask, request, jsonify
import json
import os
import requests

app = Flask(__name__)

@app.route('/api/v1/ping')
def ping():
    return 'pong'

@app.route('/api/v1/test')
def test():
    return jsonify(os.environ.get('EDGE_CONFIG'))

# Error handler
@app.errorhandler(404)
def page_not_found(e):
    return jsonify({'error': f'Not Found: {request.url}'}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)