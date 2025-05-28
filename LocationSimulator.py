import requests
import time
import threading

from pymobiledevice3.services.dvt.instruments.location_simulation import (
    LocationSimulation,
)


class LocationSimulator:
    class SingleRouteException(Exception):
        pass

    class NoLocData(Exception):
        pass

    def __init__(self, dvt):
        self.is_running = False
        self.current_location = None
        self.simulator = LocationSimulation(dvt)

        self.route_thread = None
        self.duration = 0
        self.distance = 0
        self.segment_speed = 0
        self.progress = 0

    def generate_gpx(self, points):
        # should work for multiple points (even >2)
        url = "http://router.project-osrm.org/route/v1/driving/"
        for _, point in enumerate(points):
            url += f"{point['lng']},{point['lat']};"
        url = url[:-1] + "?geometries=geojson&overview=full"
        response = requests.get(url)
        return response.json()

    def preview_route(self, points):
        data = self.generate_gpx(points)
        return "Route previewed successfully!", data

    def simulate_route(self, data):
        coordinates = data["routes"][0]["geometry"]["coordinates"]
        legs = data["routes"][0]["legs"]

        self.duration = data["routes"][0]["duration"]  # total route duration in seconds
        self.distance = data["routes"][0]["distance"]  # total route distance in meters

        print(
            f"Total route distance: {self.distance / 1000} km, duration: {self.duration / 60} minutes"
        )
        print(f"legs: {len(legs)}")

        for leg in legs:
            leg_distance = leg["distance"]
            leg_duration = leg["duration"]
            leg_coordinates = leg.get("geometry", {}).get("coordinates", coordinates)

            self.segment_speed = leg_distance / leg_duration if self.duration > 0 else 0
            print(f"Segment speed: {self.segment_speed * 2.23694} mph")

            for i in range(len(leg_coordinates) - 1):
                if not self.is_running:
                    print("Route simulation stopped.")
                    return

                current_coord = leg_coordinates[i]
                next_coord = leg_coordinates[i + 1]

                self.progress = (i + 1) / len(leg_coordinates)

                segment_distance = (
                    (next_coord[1] - current_coord[1]) ** 2
                    + (next_coord[0] - current_coord[0]) ** 2
                ) ** 0.5 * 111_139  # Roughly meters per degree

                segment_time = (
                    segment_distance / self.segment_speed
                    if self.segment_speed > 0
                    else 1
                )

                latitude, longitude = current_coord[1], current_coord[0]
                self.simulator.set(latitude, longitude)
                self.current_location = {"lat": latitude, "lng": longitude}

                time.sleep(segment_time)

        # Set final destination
        final_latitude, final_longitude = coordinates[-1][1], coordinates[-1][0]
        self.simulator.set(final_latitude, final_longitude)
        self.current_location = {"lat": final_latitude, "lng": final_longitude}

        print(f"Final destination: {final_latitude}, {final_longitude}")
        self.is_running = False

    def get_route_data(self):
        if self.is_running:
            return {
                # in miles
                "distance": round(self.distance / 1609.34, 2),
                # in minutes
                "duration": round(self.duration / 60, 2),
                # in mph
                "segment_speed": round(self.segment_speed * 2.23694, 2),
                "progress": round(self.progress * 100, 2),
            }
        else:
            return None

    def start_route(self, points):
        if self.is_running:
            raise self.SingleRouteException(
                "A route is already in progress. Stop it before starting a new one."
            )

        gpx_data = self.generate_gpx(points)
        self.is_running = True
        self.route_thread = threading.Thread(
            target=self.simulate_route, args=(gpx_data,)
        )
        self.route_thread.start()

        return "Route started successfully!", gpx_data

    def stop_route(self):
        if self.is_running:
            self.is_running = False
            self.route_thread.join()
            return "Route simulation stopped."
        else:
            raise self.SingleRouteException("No active route simulation to stop.")

    def set_location(self, lat, long):
        self.simulator.set(lat, long)
        self.current_location = {"lat": lat, "lng": long}
        return "Location set successfully."

    def clear_location(self):
        self.simulator.clear()
        self.current_location = None
        return "Location cleared successfully."

    def get_location(self):
        if self.current_location is None:
            raise self.NoLocData("No location available")
        return self.current_location
