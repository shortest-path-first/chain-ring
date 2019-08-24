import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { registerElement } from "nativescript-angular/element-registry";
import * as app from "tns-core-modules/application";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { Place } from "./map";
import { Observable } from "rxjs";
import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums";
import { RouterExtensions } from "nativescript-angular/router";
import { Router, NavigationExtras } from "@angular/router";
import { Color } from "tns-core-modules/color/color";
const mapsModule = require("nativescript-google-maps-sdk");
const decodePolyline = require("decode-google-map-polyline");
import { Image } from "tns-core-modules/ui/image";
import { ImageSource } from "tns-core-modules/image-source";
import * as utils from "tns-core-modules/utils/utils";
import { knownFolders, Folder, File } from "tns-core-modules/file-system";
import {
    fromObject,
    fromObjectRecursive,
    PropertyChangeData
} from "tns-core-modules/data/observable";

declare var com: any;

let actualMap;
let markerLat;
let markerLng;
let directionsResponse;
let markers = [];
let turnBy;
let safeTurnBy;
let peterInfo;


registerElement("MapView", () => require("nativescript-google-maps-sdk").MapView);

@Component({
    selector: "Map",
    moduleId: module.id,
    templateUrl: "./map.component.html"
})
export class MapComponent implements OnInit {
    showDirections = false;
    compPoly;
    latitude = 30;
    longitude = -90.15;
    zoom = 13;
    markers = [];
    hazards = [];
    safeRideFlat;
    bottomButtonText = "Get Directions";
    markerSelected = false;
    readyToRide = false;
    turnByList: Array<object> = [];
    safeTurnByList: Array<object> = [];
    userAvoidMarkers = [
        { lat: 29.971742, lng: -90.066258 },
        { lat: 29.973568, lng: -90.057576 }
    ];
    latLng;
    selectedRoute;
    safePoly;
    safest = false;
    shortest = true;
    safeRidePolyline;
    potholeIcon = null;
    closeIcon = null;
    avoidIcon = null;
    crashIcon = null;
    stolenIcon = null;

    readonly ROOT_URL = "http://ceabe4e9.ngrok.io";

    places: Observable<Array<Place>>;

    constructor(
        private http: HttpClient,
        private router: Router,
        private routerExtensions: RouterExtensions
    ) {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        // Init your component properties here.

        geolocation.enableLocationRequest();
        geolocation
            .getCurrentLocation({
                desiredAccuracy: Accuracy.high,
                maximumAge: 5000,
                timeout: 20000
            })
            .then(result => {
                // console.log(result);
                this.latitude = result.latitude;
                this.longitude = result.longitude;
            });
        const potholeImageSource = new ImageSource();
        this.potholeIcon = new Image();
        potholeImageSource.loadFromFile("~/app/images/mapPotHole.png");
        this.potholeIcon.imageSource = potholeImageSource;

        const closeImageSource = new ImageSource();
        this.closeIcon = new Image();
        closeImageSource.loadFromFile("~/app/images/mapNearMiss.png");
        this.closeIcon.imageSource = closeImageSource;

        const avoidImageSource = new ImageSource();
        this.avoidIcon = new Image();
        avoidImageSource.loadFromFile("~/app/images/mapAvoid.png");
        this.avoidIcon.imageSource = avoidImageSource;

        const crashImageSource = new ImageSource();
        this.crashIcon = new Image();
        crashImageSource.loadFromFile("~/app/images/mapHit.png");
        this.crashIcon.imageSource = crashImageSource;

        const stolenImageSource = new ImageSource();
        this.stolenIcon = new Image();
        stolenImageSource.loadFromFile("~/app/images/mapStolen.png");
        this.stolenIcon.imageSource = stolenImageSource;
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    getPlaces(text) {
        // search params from search bar
        this.readyToRide = false;

        const params = new HttpParams()
            .set("place", text)
            .set("userLoc", `${this.latitude},${this.longitude}`);
        const headers = new HttpHeaders().set(
            "Access-Control-Allow-Origin",
            "*"
        );
        const stuff = { params, headers };

        this.markers.forEach(marker => {
            marker.visible = false;
        });
        this.markers = [];
        markers = [];

        // http request using the text provided
        this.http
            .get<Array<Place>>(this.ROOT_URL + "/mapSearch", stuff)
            .subscribe(
                response => {
                    // assigning response info to markers array and then placing each marker on our map
                    this.markers = response;
                    const padding = 150;
                    const builder = new com.google.android.gms.maps.model.LatLngBounds.Builder();
                    this.markers.forEach(place => {
                        const { lat, lng } = place[0];
                        console.log("marker added");
                        const marker = new mapsModule.Marker({});
                        marker.position = mapsModule.Position.positionFromLatLng(
                            lat,
                            lng
                        );
                        marker.title = place[1];
                        marker.snippet = place[2];
                        this.markers.push(marker);
                        markers.push(marker);
                        builder.include(marker.android.getPosition());
                        actualMap.addMarker(marker);
                    });
                    // recenter map over choices
                    const bounds = builder.build();
                    const newBounds = com.google.android.gms.maps.CameraUpdateFactory.newLatLngBounds(
                        bounds,
                        padding
                    );
                    actualMap.gMap.animateCamera(newBounds);
                },
                err => {
                    console.log(err);
                },
                () => {
                    console.log("completed");
                }
            );
    }

    onMarkerPick(args) {
        // sets marker selected to marker on component
        markerLat = args.marker.position.latitude;
        markerLng = args.marker.position.longitude;
        this.markerSelected = true;
        this.readyToRide = false;
        this.bottomButtonText = "Get Directions";
    }

    removeGetDirections() {
        this.markerSelected = false;
        this.markers.forEach(marker => {
            marker.visible = false;
        });
        this.markers = [];
        markers = [];
        this.showDirections = false;
        if (this.compPoly) {
            this.compPoly.visible = false;
        }
        if (this.safePoly) {
            this.safePoly.visible = false;
        }
        this.turnByList = [];
        this.safeTurnByList = [];
        this.selectedRoute = null;
    }

    onMapReady(args) {
        // assigns the map to acutalMap on component
        console.log("map reassign");
        actualMap = args.object;
        const gMap = actualMap.gMap;
        const uiSettings = gMap.getUiSettings();
        uiSettings.setMyLocationButtonEnabled(true);
        uiSettings.setCompassEnabled(true);
        uiSettings.setMapToolbarEnabled(false);
        uiSettings.setZoomControlsEnabled(true);
        uiSettings.setCompassEnabled(true);
        gMap.setMyLocationEnabled(true);
    }

    getAlternative() {
        const params = new HttpParams()
            .set("place", `${markerLat},${markerLng}`)
            .set("userLoc", `${this.latitude},${this.longitude}`)
            .set(
                "wayPoint",
                `${this.userAvoidMarkers[1].lat - 0.003}, ${this
                    .userAvoidMarkers[1].lng - 0.003}`
            );
        this.http
            .get<Array<Place>>(this.ROOT_URL + "/mapPolyline", { params })
            .subscribe(response => {
                let alternativeResponse = response;
            });
    }

    onRouteTap(str) {
        this.selectedRoute = str;
        this.safest = !this.safest;
        this.shortest = !this.shortest;
        if (this.shortest === true) {
            this.safePoly.visible = true;
            this.compPoly.visible = false;
            console.log(this.selectedRoute);
        } else {
            this.safePoly.visible = false;
            this.compPoly.visible = true;
            console.log(this.selectedRoute);
        }
    }

    getDirections() {
        if (this.readyToRide === false) {
            this.removeGetDirections();
            this.showDirections = true;
            // params are set to the marker selected, info coming from component
            // tslint:disable-next-line: max-line-length
            const params = new HttpParams()
                .set("place", `${markerLat},${markerLng}`)
                .set("userLoc", `${this.latitude},${this.longitude}`);
            // http request to get directions between user point and marker selected

                for (let i = 0; safePath.length; i++) {
                    const coord = safePath[i];
                    wayPointPath.addPoint(mapsModule.Position.positionFromLatLng(coord.lat, coord.lng));
                }
                // let wayPointLatLngs = [];
                // if(wayPointArr){
                //     wayPointArr.forEach((waypoint)=>{
                //     wayPointLatLngs.push(new com.google.android.gms.maps.model.LatLng(waypoint[0], waypoint[1]));
                //     //let locObj = {location: "", stopover: false};
                //     //locObj.location = latlng;
                //     //console.log(locObj);
                  
                //     })
                 //   console.log("waypoints:", wayPointLatLngs);
                //}

              
                path.visible = false;
                safePathPolyLine.visible = true;
                //wayPointPath.visible = true;
                path.width = 10;
                safePathPolyLine.width = 10;
                //wayPointPath.visible = true;
                path.geodesic = false;
                safePathPolyLine.geodesic = false;
                wayPointPath.geodesic = false;
                const padding = 150;
                
                const builder = new com.google.android.gms.maps.model.LatLngBounds.Builder();
                const start = new mapsModule.Marker({});
                // tslint:disable-next-line: max-line-length
                start.position = mapsModule.Position.positionFromLatLng(bikePath[0].lat, bikePath[0].lng);
                start.title = "Start";
                start.snippet = "3, 2, 1, GO";
                start.color = "green";
                this.markers.push(start);
                builder.include(start.android.getPosition());
                actualMap.addMarker(start);
                const finish = new mapsModule.Marker({});
                // tslint:disable-next-line: max-line-length
                finish.position = mapsModule.Position.positionFromLatLng(bikePath[bikePath.length - 1].lat, bikePath[bikePath.length - 1].lng);
                finish.title = "End";
                finish.snippet = "Your Final Destination";
                this.markers.push(finish);
                builder.include(finish.android.getPosition());
                path.color = new Color("black");
                safePathPolyLine.color = new Color("red");
                //wayPointPath.color = new Color("pink");
                actualMap.addMarker(finish);
                actualMap.addPolyline(path);
                actualMap.addPolyline(safePathPolyLine);
                actualMap.addPolyline(wayPointPath);
                const bounds = builder.build();
                const newBounds = com.google.android.gms.maps.CameraUpdateFactory.newLatLngBounds(bounds, padding);
                actualMap.gMap.animateCamera(newBounds);
                this.readyToRide = true;
                this.markerSelected = true;
                this.bottomButtonText = "Go Now!";
            }, (err) => {
                console.log("error", err.message);
            }, () => {
                console.log("completed");
            });
        } else if (this.readyToRide === true) {
            console.log("tapped");
            let { polyLine, peterRide } = directionsResponse;
            if (this.selectedRoute === "shortest") {
                let parsedPeter = JSON.stringify(peterInfo);
                const params: NavigationExtras = {
                    queryParams: {
                        polyLine,
                        parsedPeter
                    }
                };
                this.routerExtensions.navigate(["/ride"], params);
            } else if (this.selectedRoute === "safest") {
                let parsedPeter = JSON.stringify(this.safeRideFlat);
                const { safePolyline } = directionsResponse;
                polyLine = this.safeRidePolyline;
                console.log("hit");
                const params: NavigationExtras = {
                    queryParams: {
                        polyLine,
                        parsedPeter
                    }
                };
                this.routerExtensions.navigate(["/ride"], params);
            }
        }
    }

    homeTap(navItemRoute: string): void {
        this.routerExtensions.navigate([navItemRoute], {
            transition: {
                name: "fade"
            }
        });
    }

    displayHazards() {
        console.log("yes");
        this.http.get<Array<Place>>(this.ROOT_URL + "/marker").subscribe(
            response => {
                // assigning response info to markers array and then placing each marker on our map
                this.hazards = response;
                console.log(this.hazards);
                console.log("<==================>");
                const padding = 150;
                const builder = new com.google.android.gms.maps.model.LatLngBounds.Builder();

                this.hazards.forEach(hazard => {
                    const lat = hazard.markerLat;
                    const lng = hazard.markerLon;
                    const pinType = hazard.type;
                    console.log(lat, lng, pinType);
                    const marker = new mapsModule.Marker({});
                    marker.position = mapsModule.Position.positionFromLatLng(
                        lat,
                        lng
                    );
                    if (pinType === "pothole") {
                        marker.icon = this.potholeIcon;
                    } else if (pinType === "close") {
                        marker.icon = this.closeIcon;
                    } else if (pinType === "avoid") {
                        marker.icon = this.avoidIcon;
                    } else if (pinType === "crash") {
                        marker.icon = this.crashIcon;
                    } else if (pinType === "stolen") {
                        marker.icon = this.stolenIcon;
                    }
                    builder.include(marker.android.getPosition());
                    actualMap.addMarker(marker);
                });
                // recenter map over choices
                const bounds = builder.build();
                console.log("<====******====>");
                const newBounds = com.google.android.gms.maps.CameraUpdateFactory.newLatLngBounds(
                    bounds,
                    padding
                );
                actualMap.gMap.animateCamera(newBounds);
            },
            err => {
                console.log(err);
            },
            () => {
                console.log("completed");
            }
        );
    }
}
