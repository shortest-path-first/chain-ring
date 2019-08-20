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
const mapsModule = require("nativescript-google-maps-sdk");
const decodePolyline = require("decode-google-map-polyline");
import { Image } from "tns-core-modules/ui/image";
import { ImageSource } from "tns-core-modules/image-source";

declare var com: any;

let actualMap;
let markerLat;
let markerLng;
let directionsResponse;
let markers = [];
let turnBy;

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
    bottomButtonText = "Get Directions";
    markerSelected = false;
    readyToRide = false;
    turnByList: Array<object> = [];

    readonly ROOT_URL = "https://53e76063.ngrok.io";

    places: Observable<Array<Place>>;

    constructor(private http: HttpClient, private router: Router, private routerExtensions: RouterExtensions) {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        // Init your component properties here.
        geolocation.enableLocationRequest();
        geolocation.getCurrentLocation({ desiredAccuracy: Accuracy.high, maximumAge: 5000, timeout: 20000 })
            .then((result) => {
                // console.log(result);
                this.latitude = result.latitude;
                this.longitude = result.longitude;
            });
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    getPlaces(text) {
        // search params from search bar
        this.readyToRide = false;
        

        const params = new HttpParams().set("place", text).set("userLoc", `${this.latitude},${this.longitude}`);
        const headers = new HttpHeaders().set("Access-Control-Allow-Origin", "*");
        const stuff = { params, headers};

        this.markers.forEach((marker) => {marker.visible = false; });
        this.markers = [];
        markers = [];

        // http request using the text provided
        this.http.get<Array<Place>>(this.ROOT_URL + "/mapSearch", stuff).subscribe((response) => {
            // assigning response info to markers array and then placing each marker on our map
            this.markers = response;
            const padding = 150;
            const builder = new com.google.android.gms.maps.model.LatLngBounds.Builder();
            this.markers.forEach((place) => {
                const {lat, lng} = place[0];
                console.log("marker added");
                const marker = new mapsModule.Marker({});
                marker.position = mapsModule.Position.positionFromLatLng(lat, lng);
                marker.title = place[1];
                marker.snippet = place[2];
                this.markers.push(marker);
                markers.push(marker);
                builder.include(marker.android.getPosition());
                actualMap.addMarker(marker);
            });
            // recenter map over choices
            const bounds = builder.build();
            const newBounds = com.google.android.gms.maps.CameraUpdateFactory.newLatLngBounds(bounds, padding);
            actualMap.gMap.animateCamera(newBounds);
        }, (err) => {
            console.log(err);
        }, () => {
            console.log("completed");
        });
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
        this.markers.forEach((marker) => { marker.visible = false; });
        this.markers = [];
        markers = [];
        this.showDirections = false;
        if (this.compPoly) {
            this.compPoly.visible = false;
        }
        this.turnByList = [];
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

    getDirections() {
        if (this.readyToRide === false) {
            this.removeGetDirections();

            // params are set to the marker selected, info coming from component
            // tslint:disable-next-line: max-line-length
            const params = new HttpParams().set("place", `${markerLat},${markerLng}`).set("userLoc", `${this.latitude},${this.longitude}`);
            // http request to get directions between user point and marker selected
            
            this.http.get<Array<Place>>(this.ROOT_URL + "/mapPolyline", { params }).subscribe((response) => {
                // reassigns response to variable to avoid dealing with "<Place[]>"
                console.log(response);
                directionsResponse = response;
                const { polyLine, turnByTurn } = directionsResponse;
                turnBy = turnByTurn;
                this.turnByList = turnBy;
                const bikePath = decodePolyline(polyLine);
                console.log(bikePath);
                const path = new mapsModule.Polyline();
                this.compPoly = path;
                // tslint:disable-next-line: prefer-for-of
                for (let i = 0; i < bikePath.length; i++) {
                    const coord = bikePath[i];
                    path.addPoint(mapsModule.Position.positionFromLatLng(coord.lat, coord.lng));
                }
                path.visible = true;
                path.width = 10;
                path.geodesic = false;
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
                actualMap.addMarker(finish);
                actualMap.addPolyline(path);
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
            const { polyLine } = directionsResponse;
            const params: NavigationExtras = {
                queryParams: {
                    polyLine
                }
            };
            this.routerExtensions.navigate(["/ride"], params);
    }
    }

    homeTap(navItemRoute: string): void {
        this.routerExtensions.navigate([navItemRoute], {
            transition: {
                name: "fade"
            }
        });
    }
}
