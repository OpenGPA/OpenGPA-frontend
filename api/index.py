from flask import Flask, request, jsonify
import json
import requests

app = Flask(__name__)

@app.route('/api/ping')
def ping():
    return 'pong'

# Error handler
@app.errorhandler(404)
def page_not_found(e):
    return jsonify({'error': '404 Not Found'}), 404