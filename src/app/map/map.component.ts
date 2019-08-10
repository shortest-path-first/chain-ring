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
let linePlaceHolder
let markers = []

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

<<<<<<< HEAD
    readonly ROOT_URL = "https://6fc76d3d.ngrok.io"
=======
    readonly ROOT_URL = "https://2c7dbe02.ngrok.io"
>>>>>>> bf84c1b4f220741f658cf6e9feef8be13bfa5d90

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
        // search params from search bar
        let params = new HttpParams().set('place', text);
        this.markers.forEach((marker)=> {
            marker.visible = false;
        })

        // http request using the text provided
        this.http.get<Place[]>(this.ROOT_URL + "/mapSearch", {params}).subscribe(response => {
            // assigning response info to markers array and then placing each marker on our map
            this.markers = response

            var totalLat = 0;
            var totalLng = 0;

            this.markers.forEach((place) => {
                const {lat, lng} = place[0]
                totalLat += lat;
                totalLng += lng;
                console.log('markers added')
                let marker = new mapsModule.Marker({});
                    marker.position = mapsModule.Position.positionFromLatLng(lat, lng),
                    marker.title = place[1],
                    marker.snippet = place[2]
                    this.markers.push(marker);
                    markers.push(marker);
                actualMap.addMarker(marker)
            })  
            // recenter map over choices
            actualMap.latitude = (totalLat / markers.length)
            actualMap.longitude = (totalLng / markers.length)
        }, err => {
            console.log(err.message);
        }, () => {
            console.log("completed");
        })
    }

    onMarkerPick(args){
        // sets marker selected to marker on component
        markerLat = args.marker.position.latitude;
        markerLng = args.marker.position.longitude;
    }

    onMapReady(args) {
        // assigns the map to acutalMap on component
        console.log('map reassign');
        actualMap = args.object
    }

    getDirections(){
        this.markers.forEach((marker) => {
            marker.visible = false;
        })
        // params are set to the marker selected, info coming from component
        let params = new HttpParams().set('place', `${markerLat},${markerLng}`);
        // http request to get directions between user point and marker selected
        this.http.get<Place[]>(this.ROOT_URL + "/mapPolyline", { params }).subscribe(response => {
            // reassigns response to variable to avoid dealing with "<Place[]>"
            linePlaceHolder = response
            const { polyLine } = linePlaceHolder
            var flightPlanCoordinates = decodePolyline(polyLine)

            
            const path = new mapsModule.Polyline();
            for (let i = 0; i < flightPlanCoordinates.length; i++){
                let coord = flightPlanCoordinates[i];
                path.addPoint(mapsModule.Position.positionFromLatLng(coord.lat, coord.lng));
            }
            path.visible = true;
            path.width = 10;
            path.geodesic = false;
            actualMap.latitude = ((flightPlanCoordinates[0].lat + flightPlanCoordinates[flightPlanCoordinates.length - 1].lat) / 2); 
            actualMap.longitude = ((flightPlanCoordinates[0].lng + flightPlanCoordinates[flightPlanCoordinates.length - 1].lng) / 2);
            actualMap.zoom = 12;
            
            let start = new mapsModule.Marker({});
            start.position = mapsModule.Position.positionFromLatLng(flightPlanCoordinates[0].lat, flightPlanCoordinates[0].lng),
            start.title = 'Start',
            start.snippet = '3, 2, 1, GO'
            this.markers.push(start);
            actualMap.addMarker(start)

            let finish = new mapsModule.Marker({});
            finish.position = mapsModule.Position.positionFromLatLng(flightPlanCoordinates[flightPlanCoordinates.length - 1].lat, flightPlanCoordinates[flightPlanCoordinates.length - 1].lng),
                finish.title = 'End',
                finish.snippet = 'Your Final Destination'
            this.markers.push(finish);
            actualMap.addMarker(finish)
            
            actualMap.addPolyline(path);
        }, err => {
            console.log("error", err.message);
        }, () => {
            console.log("completed");
        })
    }
}
