import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { registerElement } from "nativescript-angular/element-registry";
import * as app from "tns-core-modules/application";
import { HttpClient, HttpParams} from "@angular/common/http"
import { Place } from "./map";
import { Observable } from 'rxjs';
var mapsModule = require("nativescript-google-maps-sdk");
const decodePolyline = require('decode-google-map-polyline');


let actualMap
let markerLat
let markerLng
let holder

registerElement("MapView", () => require("nativescript-google-maps-sdk").MapView);


@Component({
    selector: "Map",
    moduleId: module.id,
    templateUrl: "./map.component.html"
})
export class MapComponent implements OnInit {

    latitude = 30
    longitude = -90.15
    zoom = 11
    markers = []

    readonly ROOT_URL = "https://6fc76d3d.ngrok.io"

    places: Observable<Place[]>;

    constructor(private http: HttpClient) {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        // Init your component properties here.
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    getPlaces(text) {
        let params = new HttpParams().set('place', text);
        this.http.get<Place[]>(this.ROOT_URL + "/mapSearch", {params}).subscribe(response => {
            //do something with response
            this.markers = response
            this.markers.forEach((place) => {
                const {lat, lng} = place[0]
                console.log('markers added')
                let marker = new mapsModule.Marker({});
                    marker.position = mapsModule.Position.positionFromLatLng(lat, lng),
                    marker.title = place[1],
                    marker.snippet = place[2]
                actualMap.addMarker(marker)
            })  
        }, err => {
            console.log(err.message);
        }, () => {
            console.log("completed");
        })
    }

    onMarkerPick(args){
        markerLat = args.marker.position.latitude;
        markerLng = args.marker.position.longitude;
    }

    onMapReady(args) {
        console.log('map reassign');
        actualMap = args.object
    }

    getDirections(){
        let params = new HttpParams().set('place', `${markerLat},${markerLng}`);
        this.http.get<Place[]>(this.ROOT_URL + "/mapPolyline", { params }).subscribe(response => {
            //do something with response
            holder = response
            const { polyLine } = holder
            console.log(polyLine);
            var flightPlanCoordinates = decodePolyline(polyLine)
            const path = new mapsModule.Polyline();
            for (let i = 0; i < flightPlanCoordinates.length; i++){
                let coord = flightPlanCoordinates[i];
                path.addPoint(mapsModule.Position.positionFromLatLng(coord.lat, coord.lng));
            }
            path.visible = true;
            path.width = 10;
            path.geodesic = false;
            actualMap.latitude = flightPlanCoordinates[0].lat;
            actualMap.longitude = flightPlanCoordinates[0].lng;
            actualMap.zoom = 15;
            actualMap.addPolyline(path);
        }, err => {
            console.log("error", err.message);
        }, () => {
            console.log("completed");
        })
    }
}
