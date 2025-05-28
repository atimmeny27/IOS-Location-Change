import { MapManager } from './MapManager.js';
import { RouteControl } from './RouteControl.js';

const mapManager = new MapManager('map');
const routeControl = new RouteControl(mapManager);
mapManager.setRouteControl(routeControl);

document.getElementById("laptopLocButton").addEventListener("click", () => mapManager.showLaptopLocation());
document.getElementById("clearLocationButton").addEventListener("click", () => mapManager.clearDeviceLocation());

document.getElementById("selectPointAButton").addEventListener("click", () => routeControl.selectPointA());
document.getElementById("clearPointAButton").addEventListener("click", () => routeControl.clearPointA());
document.getElementById("selectPointBButton").addEventListener("click", () => routeControl.selectPointB());
document.getElementById("clearPointBButton").addEventListener("click", () => routeControl.clearPointB());
document.getElementById("previewRouteButton").addEventListener("click", () => routeControl.previewRoute());
document.getElementById("startRouteButton").addEventListener("click", () => routeControl.startRoute());
document.getElementById("stopRouteButton").addEventListener("click", () => routeControl.stopRoute());

// Periodically update the current location on the map
setInterval(() => {
    fetch('/current_status')
    .then(response => response.json())
    .then(data => {
        if (!data.error) {
            mapManager.updateDeviceLocation(data.lat, data.lng);
            if(data.route) {
                routeControl.isRouteActive = true;
                routeControl.updateRouteInfo(data.route);
            } else {
                routeControl.isRouteActive = false;
            }
            routeControl.updateRouteInfoVisual();
        }
    })
    .catch(console.error);
}, 2000);

mapManager.showLaptopLocation();
