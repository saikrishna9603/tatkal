from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/test', methods=['GET', 'POST', 'OPTIONS'])
def test():
    return {'status': 'ok', 'message': 'CORS is working!'}

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=9999, debug=True)
