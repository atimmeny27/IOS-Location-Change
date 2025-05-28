
export class MapManager {
  constructor(mapContainerId) {
    this.map = L.map(mapContainerId).setView([37.7749, -122.4194], 13);
    this.routeControl = null;

    this.deviceMarker = null;
    this.deviceLoc = null;

    this.laptopMarker = null;
    this.laptopLoc = null;

    this.initMap();
  }

  setRouteControl(routeControl) {
    this.routeControl = routeControl;
  }

  initMap() {
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(this.map);

    this.map.on("dblclick", this.onMapDoubleClick.bind(this));
  }

  onMapDoubleClick(e) {
    if(this.routeControl.isRouteActive) {
      toastr.error("Cannot set location while route is active.");
      return;
    }

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    this.setDeviceLocation(lat, lng);
  }

  // DEVICE STUFF
  updateDeviceLocation(lat, lng) {
    if (this.deviceMarker) {
      this.deviceMarker.setLatLng([lat, lng]);
    } else {
      this.deviceMarker = L.circleMarker([lat, lng], {
        color: "blue",
        fillColor: "#30a3e6",
        fillOpacity: 0.5,
        radius: 10,
      }).addTo(this.map);
    }
    this.deviceLoc = { lat: lat, lng: lng };
  }

  setDeviceLocation(lat, lng) {
    fetch("/set_location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: lat, lng: lng }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          toastr.error(data.error);
        } else {
          toastr.success("Location set successfully!");
          this.updateDeviceLocation(lat, lng);
        }
      });

    this.routeControl.clearRoutePreview();
  }

  clearDeviceLocation() {
    fetch("/clear_location", { method: "POST", headers: { "Content-Type": "application/json" } })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          toastr.error(data.error);
        } else {
          toastr.success("Location cleared successfully!");
          if (this.deviceMarker) {
            this.deviceMarker.remove();
            this.deviceMarker = null;
          }
          this.deviceLoc = null;
        }
      })
      .catch((error) => {
        toastr.error(error.message);
      });
  }

  getDeviceOrLaptopLocation() {
    if(this.deviceLoc) {
      return this.deviceLoc;
    } else if(this.laptopLoc) {
      return this.laptopLoc;
    } else {
      return null;
    }
  }


  // LAPTOP STUFF
  updateLaptopLocation(lat, lng) {
    if (this.laptopMarker) {
      this.laptopMarker.setLatLng([lat, lng]);
    } else {
      this.laptopMarker = L.circleMarker([lat, lng], {
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.5,
        radius: 10,
      }).addTo(this.map);
      this.map.setView([lat, lng], 13);
    }
    this.laptopLoc = { lat: lat, lng: lng };
  }

  showLaptopLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.updateLaptopLocation(position.coords.latitude, position.coords.longitude)

          // hide laptopLocButton
          document.getElementById("laptopLocButton").style.display = "none";
          // re-loop if successful
          setTimeout(() => this.showLaptopLocation(), 5000);
        },
        (error) => {
          toastr.error("Unable to retrieve location: " + error.message)
          // show laptopLocButton
          document.getElementById("laptopLocButton").style.display = "block";
        });
    } else {
      alert("Geolocation is not supported by this browser.");
      // show laptopLocButton
      document.getElementById("laptopLocButton").style.display = "block";
    }
  }
}
