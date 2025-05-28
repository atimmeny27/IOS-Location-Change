
export class RouteControl {
  constructor(mapManager) {
    this.mapManager = mapManager;

    this.pointA = null;
    this.pointB = null;

    this.markerA = null;
    this.markerB = null;

    this.routePreview = null;
    this.routeActive = null;

    this.isRouteActive = false;
    this.routeInfo = null; // only valid if isRouteActive is true
  }

  selectPointA() {
    toastr.info("Click on the map to select Point A.");
    this.mapManager.map.once("click", (e) => this.setPointA(e.latlng));
  }
  selectPointB() {
    toastr.info("Click on the map to select Point B.");
    this.mapManager.map.once("click", (e) => this.setPointB(e.latlng));
  }

  setPointA(latlng) {
    this.pointA = latlng;
    if (this.markerA) this.markerA.setLatLng(latlng);
    else
      this.markerA = L.marker([latlng.lat, latlng.lng], {
        title: "Point A",
        color: "red",
      })
      .bindTooltip("A", {
        permanent: true,
        direction: "top",
      })
      .addTo(this.mapManager.map);
    this.clearRoutePreview();
    toastr.success("Point A selected.");
  }
  setPointB(latlng) {
    this.pointB = latlng;
    if (this.markerB) this.markerB.setLatLng(latlng);
    else
      this.markerB = L.marker([latlng.lat, latlng.lng], {
        title: "Point B",
        color: "blue",
      })
      .bindTooltip("B", {
        permanent: true,
        direction: "top",
      })
      .addTo(this.mapManager.map);
    this.clearRoutePreview();
    toastr.success("Point B selected.");
  }

  clearPointA() {
    this.pointA = null;
    if (this.markerA) {
      this.markerA.remove();
      this.markerA = null;
    }
    this.clearRoutePreview();
    toastr.info("Point A cleared.");
  }
  clearPointB() {
    this.pointB = null;
    if (this.markerB) {
      this.markerB.remove();
      this.markerB = null;
    }
    this.clearRoutePreview();
    toastr.info("Point B cleared.");
  }

  clearRoutePreview() {
    if(this.routePreview) {
      this.routePreview.remove();
      this.routePreview = null;
    }
  }
  clearActiveRoutePreview() {
    if(this.routeActive) {
      this.routeActive.remove();
      this.routeActive = null;
    }
  }

  getPolylineFormat(route) {
    var coordinates = route.routes[0].geometry.coordinates;
    return coordinates.map(function(coord) {
        return [coord[1], coord[0]];
    });
  }

  previewRoute() {
    if (!this.pointA) {
      toastr.error("Please select at least 1 point.");
      return;
    }
    
    let pts = [this.mapManager.getDeviceOrLaptopLocation(), this.pointA];
    if (this.pointB) pts.push(this.pointB);

    fetch("/preview_route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: pts }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data from previewRoute", data);
        if (data.error) {
          toastr.error(data.error);
        } else {
          if (this.routePreview) this.routePreview.remove();
          this.routePreview = L.polyline(this.getPolylineFormat(data.data), { 
            color: "gray",
            weight: 5,
          }).addTo(
            this.mapManager.map,
          );
          toastr.success(data.status);
        }
      })
      .catch((error) => toastr.error(error.message));
  }

  startRoute() {
    if (!this.pointA) {
      toastr.error("Please select at least 1 point.");
      return;
    }

    let pts = [this.mapManager.getDeviceOrLaptopLocation(), this.pointA];
    if (this.pointB) pts.push(this.pointB);

    fetch("/start_route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: pts }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          toastr.error(data.error);
        } else {
          this.clearRoutePreview();
          this.isRouteActive = true;

          if (this.routeActive) this.routeActive.remove();
          this.routeActive = L.polyline(this.getPolylineFormat(data.data), { 
            color: "green",
            weight: 5,
          }).addTo(
            this.mapManager.map,
          );

          // put map into view
          this.mapManager.map.fitBounds(this.routeActive.getBounds());
            
          toastr.success(data.status);
        }
      })
      .catch((error) => toastr.error(error.message));
  }

  stopRoute() {
    this.clearActiveRoutePreview();
    fetch("/stop_route", { method: "POST" })
      .then((response) => response.json())
      .then((data) => {
        if(data.error) {
          toastr.error(data.error);
        } else {
          this.isRouteActive = false;
          toastr.success(data.status);
        }
      })
      .catch((error) => toastr.error(error));
  }

  updateRouteInfo(route) {
    this.routeInfo = route;
  }
  updateRouteInfoVisual() {
    // show route info on the page
    // routeInfo contains distance, duration, segment_speed
    if(this.isRouteActive) {
      document.getElementById("routeInfo").style.display = "block";
      
      document.getElementById("routeDistance").innerText = this.routeInfo.distance;
      document.getElementById("routeDuration").innerText = this.routeInfo.duration;
      document.getElementById("routeSpeed").innerText = this.routeInfo.segment_speed;
      document.getElementById("routeProgress").innerText = this.routeInfo.progress;
    } else {
      document.getElementById("routeInfo").style.display = "none";
    }
  }
}
