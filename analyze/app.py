from flask import Flask, jsonify
from flask_cors import CORS
from analyze_today_all_devices import analyze_extremes_today
from recommendations import get_vacation_recommendations

app = Flask(__name__)
CORS(app)

@app.route("/api/extremes", methods=["GET"])
def get_extremes():
    highest, lowest = analyze_extremes_today()
    return jsonify({
        "highest": highest,
        "lowest": lowest
    })

@app.route("/api/recommendations", methods=["GET"])
def vacation_recommendations():
    results = get_vacation_recommendations()
    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True)
