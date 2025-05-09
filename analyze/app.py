from flask import Flask, jsonify, request
from flask_cors import CORS
import traceback
import logging
from analyze_today_all_devices import analyze_extremes_today
from recommendations import get_vacation_recommendations

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='flask_app.log'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS with more specific settings
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "OPTIONS"]}})

@app.route("/api/extremes", methods=["GET"])
def get_extremes():
    try:
        logger.info("Processing /api/extremes request")
        highest, lowest = analyze_extremes_today()

        # Validate the data before returning
        if not isinstance(highest, dict) or not isinstance(lowest, dict):
            logger.error(f"Invalid data format. highest: {type(highest)}, lowest: {type(lowest)}")
            return jsonify({"error": "Invalid data format from analyzer"}), 500

        response = {
            "highest": highest,
            "lowest": lowest
        }

        logger.info("Successfully processed extremes data")
        return jsonify(response)

    except Exception as e:
        logger.error(f"Error in get_extremes: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/api/recommendations", methods=["GET"])
def vacation_recommendations():
    try:
        logger.info("Processing /api/recommendations request")
        results = get_vacation_recommendations()

        if not results:
            logger.warning("Empty recommendations results")
            return jsonify({"recommendations": [], "message": "No recommendations available"}), 200

        logger.info("Successfully processed recommendations data")
        return jsonify(results)

    except Exception as e:
        logger.error(f"Error in vacation_recommendations: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    """Simple endpoint to check if the API is running"""
    return jsonify({"status": "ok"}), 200

@app.after_request
def after_request(response):
    """Log all responses"""
    logger.info(f"{request.remote_addr} - {request.method} {request.path} {response.status_code}")
    return response

if __name__ == "__main__":
    logger.info("Starting Flask application")
    app.run(debug=True, host="0.0.0.0", port=5000)