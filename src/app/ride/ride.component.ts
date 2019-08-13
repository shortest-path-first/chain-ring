import { ActivatedRoute, Router } from "@angular/router";
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
import { SpeechRecognition } from "nativescript-speech-recognition";
// var accelerometer = require("nativescript-accelerometer");
//const style = require("../../../App_Resources/style.json")

var mapsModule = require("nativescript-google-maps-sdk");
const decodePolyline = require('decode-google-map-polyline');
const polylineEncoder = require('google-polyline')

let rideMarkers = {markers: []};
let polylineHolder;

registerElement("MapView", () => require("nativescript-google-maps-sdk").MapView);

@Component({
    selector: "Ride",
    moduleId: module.id,
    templateUrl: "./ride.component.html"
})
export class RideComponent implements OnInit {

    readonly ROOT_URL = "https://3c712b5f.ngrok.io";

    // tslint:disable-next-line: max-line-length
    constructor(private http: HttpClient, private router: Router, private routerExtensions: RouterExtensions, private route: ActivatedRoute) {
        // Use the component constructor to inject providers.
        this.route.queryParams.subscribe((params) => {
            const {polyLine} = params;
            polylineHolder = polyLine;
        });
    }
    
    mapView;
    watchId;
    show;
    speed = 0; 
    topSpeed = 0;
    allSpeeds = [];
    currentSpeed = 0;
    speedString = '';
    newPathCoords = [];
    totalDistance = 0.0;
    distanceString = "0.0";
    speechRecognition = new SpeechRecognition();
    
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
            })
    }

    onHomeTap(): void {
        this.routerExtensions.navigate(['/home'], {
            transition: {
                name: "fade"
            }
    });
}
   
    calculateDistance(lat1, lon1, lat2, lon2): number {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            let dist = 0;
            return dist;
        }
        else {
            var radlat1 = Math.PI * lat1 / 180;
            var radlat2 = Math.PI * lat2 / 180;
            var theta = lon1 - lon2;
            var radtheta = Math.PI * theta / 180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
    }
    return Number(dist.toFixed(2));
}

    findSpeedBreakdown(speeds): any[] {
        let breakdown = speeds.reduce((tally, speed) => {
            if (speed < .25 * this.topSpeed) {
                if (tally['0'] === undefined) {
                    tally['0'] = 1;
                } else {
                    tally['0']++
                }
            } else if (speed < .50 * this.topSpeed) {
                if (tally['1'] === undefined) {
                    tally['1'] = 1;
                } else {
                    tally['1']++;
                }
            } else if (speed < .75 * this.topSpeed) {
                if (tally['2'] === undefined) {
                    tally['2'] = 1;
                } else {
                    tally['2']++;
                }
            } else {
                if (tally['3'] === undefined) {
                    tally['3'] = 1
                } else {
                    tally['3']++;
                }
            }
            return tally;
        }, {});
        let portions = [];
        for (var key in breakdown) {
            portions.push((breakdown[key] / speeds.length * 100).toFixed(1));
        }
        return portions;
    }

    onStopTap(): void {
        geolocation.clearWatch(this.watchId);
        this.speechRecognition.stopListening()
        .then(()=>{
            console.log('stopped listening')
        })
        let avgSpeed = (this.speed * 2.23694)/ this.allSpeeds.length;
        let speedBreakdown = this.findSpeedBreakdown(this.allSpeeds);
        let pathPolyline = polylineEncoder.encode(this.newPathCoords);
        let first = this.newPathCoords[0];
        let last = this.newPathCoords[this.newPathCoords.length - 1];
        let start = first.time.getTime();
        let stop = last.time.getTime();
    
        let duration = stop - start;
        duration = duration/ 10000;
        console.log("duration", duration);
        this.http.post(this.ROOT_URL + "/marker", rideMarkers, {
            headers: new HttpHeaders({  
                'Content-Type': 'application/json',
            })})
            .subscribe(()=>{
                console.log("success"); 
            });
        let info = {pathPolyline, first, last, avgSpeed, duration, speedBreakdown,
            topSpeed: this.topSpeed, totalDistance: this.totalDistance};
        this.http.post(this.ROOT_URL + "/ride", info, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            })
        })
        .subscribe(()=>{
            console.log('ride');   
        });
        
            this.routerExtensions.navigate(['/stats'], { 
            queryParams: {avgSpeed},
            transition: {
                name: "fade"
            }, 
        });
    } 

    onSpeedTap(): void {
        console.log("called");
        if(this.show === undefined){
            this.show = true;
        } else{
            this.show = !this.show;
        }
    } 

    drawUserPath(): void {
        let newPath = new mapsModule.Polyline();
        
        this.watchId = geolocation.watchLocation((loc) => {
            this.handleSpeech();
            if (loc) {
                this.currentSpeed = loc.speed * 2.23694;
                this.speedString = this.currentSpeed.toFixed(1);
                if(this.currentSpeed > this.topSpeed){
                    this.topSpeed = this.currentSpeed;
                }
                this.allSpeeds.push(this.currentSpeed);
                this.speed += loc.speed;
                let lat = loc.latitude;
                let long = loc.longitude;
                let time = loc.timestamp;
                
                if (this.newPathCoords.length === 0) {
                    this.newPathCoords.push({ lat, long, time });
                    this.mapView.latitude = lat;
                    this.mapView.longitude = long;
                    this.mapView.bearing = loc.direction;
                } else if (this.newPathCoords[this.newPathCoords.length - 1].lat !== lat && this.newPathCoords[this.newPathCoords.length - 1].long !== long) {
                    let lastLat = this.newPathCoords[this.newPathCoords.length - 1].lat;
                    let lastLng = this.newPathCoords[this.newPathCoords.length - 1].long
                    this.totalDistance += this.calculateDistance(lat, long, lastLat, lastLng);
                    this.distanceString = this.totalDistance.toFixed(1);
                    this.newPathCoords.push({ lat, long, time });
                    newPath.addPoint(mapsModule.Position.positionFromLatLng(lat, long));
                    newPath.visible = true;
                    newPath.width = 10;
                    newPath.geodesic = false;
                    //newPath.color = new Color("red");
                    this.mapView.addPolyline(newPath);
                    this.mapView.latitude = loc.latitude;
                    this.mapView.longitude = loc.longitude;
                    this.mapView.bearing = loc.direction;
                }
            }
        }, (e) => {
            console.log("Error: " + e.message);
        }, {
                desiredAccuracy: Accuracy.high,
                updateTime: 3000,
                updateDistance: 0.1,
                minimumUpdateTime: 100
            });
    }

    handleSpeech(){
        this.speechRecognition.startListening(
            {
                // optional, uses the device locale by default
                locale: "en-US",
                // set to true to get results back continuously
                returnPartialResults: true,
                // this callback will be invoked repeatedly during recognition
                onResult: (transcription) => {
                
                    if (transcription.text.includes("speedometer")) {
                    this.onSpeedTap();
                    console.log('speed!', this.show)
                    } else if(transcription.text.includes("pothole")){
                        this.onPinTap();
                    
                    }
                },
                onError: (error) => {
                
                    // - iOS: A 'string', describing the issue. 
                    // - Android: A 'number', referencing an 'ERROR_*' constant from https://developer.android.com/reference/android/speech/SpeechRecognizer.
                    //            If that code is either 6 or 7 you may want to restart listening.
                }
            }
        ).then(
            (started) => { console.log(`started listening`) },
            (errorMessage) => { console.log(`Error: ${errorMessage}`); }
        )
            .catch((error) => {
                // same as the 'onError' handler, but this may not return if the error occurs after listening has successfully started (because that resolves the promise,
                // hence the' onError' handler was created.
                console.error("Wherror",error);
            });
             this.speechRecognition.stopListening()
             .then(()=>{
                 //this.handleSpeech();
             })
             .catch((err)=>{
                console.log(err);
             })
}
    

    onMapReady(args){
        this.mapView = args.object; 
        //this.show = false;
        
        this.speechRecognition.available().then(
            (available: boolean) => console.log(available ? "YES!" : "NO"),
            (err: string) => console.log(err)
        ); 
        
        const line = polylineHolder;
        if(line !== undefined){
        var flightPlanCoordinates = decodePolyline(line);
            const polyline = new mapsModule.Polyline();
            for (let i = 0; i < flightPlanCoordinates.length; i++){
                let coord = flightPlanCoordinates[i];
                polyline.addPoint(mapsModule.Position.positionFromLatLng(coord.lat, coord.lng));
            }
             polyline.visible = true;
             polyline.width = 10;
             polyline.geodesic = false;
             //polyline.color = new Color("purple");
             this.mapView.latitude = flightPlanCoordinates[0].lat;
             this.mapView.longitude = flightPlanCoordinates[0].lng;        
             this.mapView.addPolyline(polyline);
        } 

        this.mapView.mapAnimationsEnabled = true;
        this.mapView.zoom = 15;
        this.mapView.tilt = 45;
        this.mapView.myLocationButtonEnabled = true;
        geolocation.getCurrentLocation({ desiredAccuracy: Accuracy.high, maximumAge: 5000, timeout: 20000 })
            .then((result) => {
                let marker = new mapsModule.Marker();
                // var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
                // marker.icon = image;
                marker.position = mapsModule.Position.positionFromLatLng(result.latitude, result.longitude);
                this.mapView.addMarker(marker);
                this.mapView.latitude = result.latitude;
                this.mapView.longitude = result.longitude;
            });
      
        this.drawUserPath();
    }
}
