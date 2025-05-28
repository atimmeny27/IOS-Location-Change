from flask import Flask, jsonify, request, render_template
from LocationSimulator import LocationSimulator

class AppServer:
    def __init__(self, host, port):
        self.host = host
        self.port = port

        self.app = Flask(__name__)
        self.location_simulator: LocationSimulator

        self.setup_routes()

    def setup_routes(self):
        @self.app.route("/")
        def index():
            return render_template("index.html")

        @self.app.route("/preview_route", methods=["POST"])
        def preview_route():
            data = request.json
            points = data.get("points")
            print(points)

            # TODO: Add validation for points

            try:
                out, data = self.location_simulator.preview_route(points)
                return jsonify({"status": out, "data": data}), 200
            except self.location_simulator.SingleRouteException as e:
                return jsonify({"error": str(e)}), 400

        @self.app.route("/start_route", methods=["POST"])
        def start_route():
            data = request.json
            points = data.get("points")

            # TODO: Add validation for points
            
            try:
                out, data = self.location_simulator.start_route(points)
                return jsonify({"status": out, "data": data}), 200
            except self.location_simulator.SingleRouteException as e:
                return jsonify({"error": str(e)}), 400


        @self.app.route("/stop_route", methods=["POST"])
        def stop_route():
            try:
                out = self.location_simulator.stop_route()
                return jsonify({"status": out }), 200
            except self.location_simulator.SingleRouteException as e:
                return jsonify({"error": str(e)}), 400


        @self.app.route("/set_location", methods=["POST"])
        def set_location():
            data = request.json
            try:
                lat = float(data.get("lat"))
                lng = float(data.get("lng"))
            except ValueError:
                return jsonify({"error": "Invalid latitude or longitude"}), 400

            if lat is None or lng is None:
                return jsonify({"error": "Latitude and Longitude are required"}), 400

            out = self.location_simulator.set_location(lat, lng)
            return jsonify({"status": out}), 200


        @self.app.route("/clear_location", methods=["POST"])
        def clear_location():
            out = self.location_simulator.clear_location()
            return jsonify({"status": out}), 200


        @self.app.route("/current_status", methods=["GET"])
        def get_current_status():
            try:
                loc_data = self.location_simulator.get_location()
                route_data = self.location_simulator.get_route_data()
                return jsonify({"lat": loc_data['lat'], "lng": loc_data['lng'], "route": route_data}), 200
            except self.location_simulator.NoLocData as e:
                return jsonify({"error": str(e)}), 400


    def run(self, debug=False):
        self.app.run(host=self.host, port=self.port, debug=debug)

