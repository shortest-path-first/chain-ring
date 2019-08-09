import { NavigationEnd, Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { HttpClient, HttpParams } from "@angular/common/http"
import { Observable } from 'rxjs';
import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { registerElement } from "nativescript-angular/element-registry";
import * as app from "tns-core-modules/application";
import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums"; 
import { Color } from "tns-core-modules/color/color";
import { Ride } from "./ride"
var accelerometer = require("nativescript-accelerometer");
//const style = require("../../../App_Resources/style.json")

var mapsModule = require("nativescript-google-maps-sdk");
const decodePolyline = require('decode-google-map-polyline');
const polylineEncoder = require('google-polyline')

let mapView;
let watchId;
let speed = 0;
let ticks = 0;
let rideMarkers = {markers: []};

registerElement("MapView", () => require("nativescript-google-maps-sdk").MapView);

@Component({
    selector: "Ride",
    moduleId: module.id,
    templateUrl: "./ride.component.html"
})
export class RideComponent implements OnInit {

    readonly ROOT_URL = "https://7be0faec.ngrok.io"

    places: Observable<Ride[]>;
   
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

    onPinTap(): void {
        geolocation.getCurrentLocation({ desiredAccuracy: Accuracy.high, maximumAge: 5000, timeout: 20000 })
            .then((result) => {
                let marker = new mapsModule.Marker();
               
                marker.position = mapsModule.Position.positionFromLatLng(result.latitude, result.longitude);
                mapView.addMarker(marker);
                rideMarkers.markers.push({lat: result.latitude, lng: result.longitude});
                console.log(rideMarkers);               
            });
    }
    
    onStopTap(): void {
        geolocation.clearWatch(watchId);
        console.log("stopped ride");
    }

    drawUserPath(): void {
        let newPath = new mapsModule.Polyline();
        let newPathCoords = [];
        watchId = geolocation.watchLocation((loc) => {
            if (loc) {
                let lat = loc.latitude;
                let long = loc.longitude;
                if (newPathCoords.length === 0) {
                    newPathCoords.push({ lat, long });
                    mapView.latitiude = lat;
                    mapView.longitude = long;
                } else if (newPathCoords[newPathCoords.length - 1].lat !== lat && newPathCoords[newPathCoords.length - 1].long !== long) {
                    if(loc.speed !== 0){
                        speed += loc.speed;
                    }
                    newPath.addPoint(mapsModule.Position.positionFromLatLng(lat, long));
                    newPath.visible = true;
                    newPath.width = 10;
                    newPath.geodesic = false;
                    newPath.color = new Color("red")
                    mapView.addPolyline(newPath)
                    mapView.latitiude = loc.latitude;
                    mapView.longitude = loc.longitude;
                }
            }
        }, (e) => {
            console.log("Error: " + e.message);
        }, {
                desiredAccuracy: Accuracy.high,
                updateDistance: 0.1,
                updateTime: 3000,
                minimumUpdateTime: 100
            });
    }


    onMapReady(args){
        mapView = args.object;  
        let newPath = new mapsModule.Polyline();
        let newPathCoords = [];
        let line = "a`~uDhyxdPr@TxAaC~CeFhD}FtDcGdGyJbA_Bl@s@b@u@~@aB|DoGbJiOBEPW?ALQYWsBcBiEsD}HaHUW_@y@E_@KyFKyFQiHQeGSaJGkBPeAZw@p@qAV}@OaG[iMAQgBF"
        var flightPlanCoordinates = decodePolyline(line);
        let testLine = polylineEncoder.encode(flightPlanCoordinates);
       
       const polyline = new mapsModule.Polyline();
       for (let i = 0; i < flightPlanCoordinates.length; i++){
           let coord = flightPlanCoordinates[i];
           polyline.addPoint(mapsModule.Position.positionFromLatLng(coord.lat, coord.lng));
       }
        polyline.visible = true;
        polyline.width = 10;
        polyline.geodesic = false;
        polyline.color = new Color("purple");
        mapView.latitude = flightPlanCoordinates[0].lat;
        mapView.longitude = flightPlanCoordinates[0].lng;        
        mapView.zoom = 20;
        mapView.tilt = 45;
        mapView.addPolyline(polyline);
        geolocation.getCurrentLocation({ desiredAccuracy: Accuracy.high, maximumAge: 5000, timeout: 20000 })
            .then((result) => {
                let marker = new mapsModule.Marker();
                marker.position = mapsModule.Position.positionFromLatLng(result.latitude, result.longitude);
                mapView.addMarker(marker);
            });
        // accelerometer.startAccelerometerUpdates(function (data) {
        //     //  console.log("x: " + data.x + "y: " + data.y + "z: " + data.z);
            
        // }, { sensorDelay: "normal" });
        this.drawUserPath();
    //         watchId = geolocation.watchLocation((loc) => {
    //         if (loc) {
    //             let lat = loc.latitude;
    //             let long = loc.longitude;
    //             if(newPathCoords.length === 0){
    //                 newPathCoords.push({lat, long});
    //                 mapView.latitiude = lat;
    //                 mapView.longitude = long; 
    //             } else if (newPathCoords[newPathCoords.length - 1].lat !== lat && newPathCoords[newPathCoords.length - 1].long !== long){
    //                 newPath.addPoint(mapsModule.Position.positionFromLatLng(lat, long));
    //                 newPath.visible = true;
    //                 newPath.width = 10;
    //                 newPath.geodesic = false;
    //                 newPath.color = new Color("red")
    //                 mapView.addPolyline(newPath)
    //                 mapView.latitiude = loc.latitude;
    //                 mapView.longitude = loc.longitude;
    //             }

    //         }
    //     }, (e) => {
    //         console.log("Error: " + e.message);
    //     }, {
    //             desiredAccuracy: Accuracy.high,
    //             updateDistance: 0.1,
    //             updateTime: 3000,
    //             minimumUpdateTime: 100
    //         });
     }
}
