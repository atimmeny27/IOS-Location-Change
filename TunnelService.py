import subprocess
import atexit
import time
import requests
import asyncio
import os

from pymobiledevice3.services.dvt.dvt_secure_socket_proxy import (
    DvtSecureSocketProxyService,
)
from pymobiledevice3.remote.remote_service_discovery import (
    RemoteServiceDiscoveryService,
)

class TunnelService:

    class NoDevicesError(Exception):
        pass

    def __init__(self):
        self.tunneld_process = None
        self.dvt = None
        atexit.register(self.shutdown_tunneld)

    def start_tunneld(self):
        self.tunneld_process = subprocess.Popen(
            ["sudo", "python3", "-m", "pymobiledevice3", "remote", "tunneld"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        for line in self.tunneld_process.stderr:
            print(line.strip())
            if "Uvicorn running on" in line:
                return self.tunneld_process

        _, error_output = self.tunneld_process.communicate()
        if error_output:
            print("Error starting tunneld server:", error_output)
        raise RuntimeError("Failed to start tunneld server.")

    def shutdown_tunneld(self):
        os.environ['DVT_INITIALIZED'] = 'False'
        if self.tunneld_process and self.tunneld_process.poll() is None:
            print("Shutting down tunneld server...")
            self.tunneld_process.terminate()  # Send SIGTERM for graceful shutdown
            try:
                self.tunneld_process.wait(timeout=5)  # Wait for up to 5 seconds
                print("tunneld server terminated gracefully.")
            except subprocess.TimeoutExpired:
                print("tunneld server did not terminate, force killing...")
                self.tunneld_process.kill()  # Force kill if not terminated
                print("tunneld server forcefully killed.")

    # Helper for initialize_dvt()
    def get_rpc_connection_info(self, retries=10, delay=2):
        for _ in range(retries):
            try:
                response = requests.get("http://127.0.0.1:49151")

                rpc_info = response.json()
                if rpc_info == {}:
                    raise self.NoDevicesError("No devices connected to Unicorn server.")

                device_id = list(rpc_info.keys())[0]  # assuming first device
                device_info = rpc_info[device_id][0]
                return device_info["tunnel-address"], device_info["tunnel-port"]
            except (
                requests.ConnectionError,
                requests.RequestException,
                self.NoDevicesError,
            ) as e:
                print(f"Failed to connect to Unicorn server: {e}. Retrying...")
                time.sleep(delay)

        raise ConnectionError(
            "Could not connect to the Unicorn server after multiple retries."
        )

    async def initialize_dvt(self):
        address, port = self.get_rpc_connection_info(retries=10, delay=2)
        self.rsd = RemoteServiceDiscoveryService((address, port))
        await self.rsd.connect()
        self.dvt = DvtSecureSocketProxyService(self.rsd)
        self.dvt.perform_handshake()

    def start_all(self):
        if os.getenv('DVT_INITIALIZED') != 'True':
            os.environ['DVT_INITIALIZED'] =  'True'
            self.start_tunneld()

        asyncio.run(self.initialize_dvt())
        return self.dvt
