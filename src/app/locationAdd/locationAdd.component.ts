import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { registerElement } from "nativescript-angular/element-registry";
import { Observable } from "rxjs";
import { Place } from "./locationAdd";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums";
import { ActivatedRoute } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import * as Obser from "tns-core-modules/data/observable";
import { knownFolders, Folder, File } from "tns-core-modules/file-system";


declare var com: any;

const mapsModule = require("nativescript-google-maps-sdk");

let actualMap;
let markers = [];
let markerLat;
let markerLng;
let userEmail;

registerElement(
    "MapView",
    () => require("nativescript-google-maps-sdk").MapView
);

@Component({
    selector: "LocationAdd",
    moduleId: module.id,
    templateUrl: "./locationAdd.component.html"
})
export class LocationAddComponent implements OnInit {
    latitude = 30;
    longitude = -90.15;
    zoom = 13;
    readyToRide = false;
    markers = [];
    markerSelected = false;
    bottomButtonText = "Save Location";
    locName = "";

    vm = new Obser.Observable();
    documents: Folder = knownFolders.documents();
    folder: Folder = this.documents.getFolder(this.vm.get("src") || "src");
    file: File = this.folder.getFile(
        `${this.vm.get("token") || "token"}` + `.txt`
    );

    readonly ROOT_URL = "https://9d8d6231.ngrok.io";

    places: Observable<Array<Place>>;

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private routerExtensions: RouterExtensions
    ) {
        // Use the component constructor to inject providers.
        this.route.queryParams.subscribe((params) => {
            const { user } = params;
            userEmail = user;
        });
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
        const params = new HttpParams()
            .set("place", text)
            .set("userLoc", `${this.latitude},${this.longitude}`);
        this.markers.forEach((marker) => {
            marker.visible = false;
        });
        this.markers = [];
        markers = [];

        // http request using the text provided
        this.http
            .get<Array<Place>>(this.ROOT_URL + "/mapSearch", { params })
            .subscribe(
                (response) => {
                    // assigning response info to markers array and then placing each marker on our map
                    this.markers = response;
                    const padding = 150;
                    const builder = new com.google.android.gms.maps.model.LatLngBounds.Builder();
                    this.markers.forEach((place) => {
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
                (err) => {
                    console.log(err.message);
                },
                () => {
                    console.log("completed");
                }
            );
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

    onMarkerPick(args) {
        // sets marker selected to marker on component
        markerLat = args.marker.position.latitude;
        markerLng = args.marker.position.longitude;
        this.markerSelected = true;
        this.readyToRide = false;
    }

    removeGetDirections() {
        this.markerSelected = false;
        this.readyToRide = false;
        this.markers.forEach((marker) => {
            marker.visible = false;
        });
        this.markers = [];
        markers = [];
    }

    saveLocation() {
        console.log("button press");
        console.log(markerLat, markerLng, this.locName);
        const info = {};
        this.file.readText()
            .then((res) => {
                // tslint:disable-next-line: max-line-length
                const words = new HttpParams().set("token", `${res}`).set(`lat`, `${markerLat}`).set(`lng`, `${markerLng}`).set(`loc`, `${this.locName}`);
                
                const rideSubscription = this.http
                    .post(this.ROOT_URL + "/location", info, {
                        headers: new HttpHeaders({
                            "Content-Type": "application/json"
                        }),
                        params: words
                    })
                    .subscribe(() => {
                        console.log("ride");
                    });
                rideSubscription.unsubscribe();
            });
    }

    homeTap(navItemRoute: string): void {
        this.routerExtensions.navigate([navItemRoute], {
            transition: {
                name: "fade"
            }
        });
    }
    
}
