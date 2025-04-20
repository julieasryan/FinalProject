from flask import Flask, jsonify
from flask_cors import CORS
from analyze_today_all_devices import analyze_extremes_today

app = Flask(__name__)
CORS(app)

@app.route("/api/extremes", methods=["GET"])
def get_extremes():
    highest, lowest = analyze_extremes_today()
    return jsonify({
        "highest": highest,
        "lowest": lowest
    })

if __name__ == "__main__":
    app.run(debug=True)
