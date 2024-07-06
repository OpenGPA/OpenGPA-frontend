import flask
import requests

app = flask.Flask(__name__)

@app.route('/api/query')
def query():
    # Get the query parameter
    query = flask.request.args.get('query')
    return query

# 404 error handler
@app.errorhandler(404)
def page_not_found(e):
    return '404 Not Found', 404