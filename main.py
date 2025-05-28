import subprocess
from AppServer import AppServer
from LocationSimulator import LocationSimulator
from TunnelService import TunnelService

if __name__ == "__main__":

    tunnel_service = TunnelService()
    dvt = tunnel_service.start_all()
    location_simulator = LocationSimulator(dvt)

    app_server = AppServer(host="0.0.0.0", port=2787)
    app_server.location_simulator = location_simulator
    app_server.run(debug=False)
