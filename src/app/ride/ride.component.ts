import { NavigationEnd, Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http"
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

let watchId;
let ticks = 0;
let rideMarkers = {markers: []};



registerElement("MapView", () => require("nativescript-google-maps-sdk").MapView);

@Component({
    selector: "Ride",
    moduleId: module.id,
    templateUrl: "./ride.component.html"
})
export class RideComponent implements OnInit {

    readonly ROOT_URL = "https://6fc76d3d.ngrok.io"

    places: Observable<Ride[]>;
   
    constructor(private http: HttpClient, private router: Router, private routerExtensions: RouterExtensions) {
        // Use the component constructor to inject providers.
    }

    mapView;
    show = false; 
    speed = 0;
    currentSpeed = 0;
    newPathCoords = [];

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
                this.mapView.addMarker(marker);
                rideMarkers.markers.push({markerLat: result.latitude, markerLon: result.longitude});
                console.log(rideMarkers);               
            })
    
    }
    
    onStopTap(): void {
        geolocation.clearWatch(watchId);
        let avgSpeed = (this.speed * 2.23694)/ ticks;
         console.log(this.newPathCoords);
        let pathPolyline = polylineEncoder.encode(this.newPathCoords);
        let first = this.newPathCoords[0];
        let last = this.newPathCoords[this.newPathCoords.length - 1];
        let start = first.time.getTime();
        let stop = last.time.getTime();
        let direction = [];
        let spd = [];
        this.newPathCoords.forEach((blip) => {
            direction.push(blip.direction);
            spd.push(blip.nowSpeed);  
        })
        let duration = stop - start;
        console.log("duration",duration, start, stop);
        this.http.post(this.ROOT_URL + "/marker", rideMarkers, {
            headers: new HttpHeaders({  
                'Content-Type': 'application/json',
            })})
            .subscribe(()=>{
                console.log("success"); 
            });

        let info = {pathPolyline, first, last, avgSpeed, direction, spd};
        this.http.post(this.ROOT_URL + "/ride", info, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            })
        })
        .subscribe(()=>{
            console.log('ride');   
        });
            this.routerExtensions.navigate(['/browse'], { 
            queryParams: {avgSpeed},
            transition: {
                name: "fade"
            }, 
        });
    } 

    onSpeedTap(): void {
        this.show = !this.show;
        
    } 

    drawUserPath(): void {
        let newPath = new mapsModule.Polyline();
        
        watchId = geolocation.watchLocation((loc) => {
            if (loc) {
                this.currentSpeed = loc.direction;
                console.log(loc.speed);
                this.speed += loc.speed;
                ticks++;
                let lat = loc.latitude;
                let long = loc.longitude;
                let time = loc.timestamp;
                let direction = loc.direction;
                let nowSpeed = this.currentSpeed;
                if (this.newPathCoords.length === 0) {
                    this.newPathCoords.push({ lat, long, time, direction, nowSpeed });
                    this.mapView.latitiude = lat;
                    this.mapView.longitude = long;
                } else if (this.newPathCoords[this.newPathCoords.length - 1].lat !== lat && this.newPathCoords[this.newPathCoords.length - 1].long !== long) {
                    this.newPathCoords.push({ lat, long, time, direction, nowSpeed });
                    newPath.addPoint(mapsModule.Position.positionFromLatLng(lat, long));
                    newPath.visible = true;
                    newPath.width = 10;
                    newPath.geodesic = false;
                    newPath.color = new Color("red");
                    this.mapView.addPolyline(newPath);
                    this.mapView.latitiude = loc.latitude;
                    this.mapView.longitude = loc.longitude;
                }
            }
        }, (e) => {
            console.log("Error: " + e.message);
        }, {
                desiredAccuracy: Accuracy.high,
                updateTime: 1000,
                minimumUpdateTime: 100
            });
    }


    onMapReady(args){
        this.mapView = args.object;  
        let newPath = new mapsModule.Polyline();
    
        let line = "a`~uDhyxdPr@TxAaC~CeFhD}FtDcGdGyJbA_Bl@s@b@u@~@aB|DoGbJiOBEPW?ALQYWsBcBiEsD}HaHUW_@y@E_@KyFKyFQiHQeGSaJGkBPeAZw@p@qAV}@OaG[iMAQgBF"
        
        var flightPlanCoordinates = decodePolyline(line);
      
       const polyline = new mapsModule.Polyline();
       for (let i = 0; i < flightPlanCoordinates.length; i++){
           let coord = flightPlanCoordinates[i];
           polyline.addPoint(mapsModule.Position.positionFromLatLng(coord.lat, coord.lng));
       }
        polyline.visible = true;
        polyline.width = 10;
        polyline.geodesic = false;
        polyline.color = new Color("purple");
        this.mapView.latitude = flightPlanCoordinates[0].lat;
        this.mapView.longitude = flightPlanCoordinates[0].lng;        
        this.mapView.zoom = 20;
        this.mapView.tilt = 45;
        this.mapView.addPolyline(polyline);
        geolocation.getCurrentLocation({ desiredAccuracy: Accuracy.high, maximumAge: 5000, timeout: 20000 })
            .then((result) => {
                let marker = new mapsModule.Marker();
                marker.position = mapsModule.Position.positionFromLatLng(result.latitude, result.longitude);
                this.mapView.addMarker(marker);
            });
        // accelerometer.startAccelerometerUpdates(function (data) {
        //     //  console.log("x: " + data.x + "y: " + data.y + "z: " + data.z);
            
        // }, { sensorDelay: "normal" });
        this.drawUserPath();

     }
}
