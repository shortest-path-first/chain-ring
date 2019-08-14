import { ActivatedRoute, Router, NavigationExtras } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { Component, OnInit,  NgZone } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { registerElement } from "nativescript-angular/element-registry";
import * as app from "tns-core-modules/application";
import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums";
import { Color } from "tns-core-modules/color/color";
import { SpeechRecognition, SpeechRecognitionTranscription } from "nativescript-speech-recognition";


//const style = require("../../../App_Resources/style.json")
var insomnia = require("nativescript-insomnia");
var mapsModule = require("nativescript-google-maps-sdk");
const decodePolyline = require('decode-google-map-polyline');
const polylineEncoder = require('google-polyline')
const rideMarkers = {markers: []};
let polylineHolder;


registerElement("MapView", () => require("nativescript-google-maps-sdk").MapView);

@Component({
    selector: "Ride",
    moduleId: module.id,
    templateUrl: "./ride.component.html"
})
export class RideComponent implements OnInit {

    mapView;
    watchId;
    show;
    listen = true;
    speed = 0; 
    topSpeed = 0;
    allSpeeds = [];
    currentSpeed = 0;
    speedString = '0';
    speedStringDecimal = '0';
    newPathCoords = [];
    totalDistance = 0.0;
    recognizedText;
    distanceString = "0"
    distanceStringDecimal = "0";
    speechRecognition = new SpeechRecognition();
    timeoutId;
    colorCount = 0;
    colorArray = ['#393ef9', '#4638f1', '#6036ea', '#7335e2', '#8533da', '#9532d2', '#9330ca', '#b02fc3',
    '#bb2dbb', '#b32ca2', '#ab2a8a', '#a42974', '#9c2760', '#a42974', '#ab2a8a', '#b32ca2', '#bb2dbb', 
    '#b02fc3', '#9330ca', '#9532d2', '#8533da', '#7335e2', '#6036ea', '#4638f1'];
    

    readonly ROOT_URL = "https://09b0a776.ngrok.io";

    // tslint:disable-next-line: max-line-length
    constructor(private http: HttpClient, private router: Router,
     private routerExtensions: RouterExtensions, private route: ActivatedRoute,
     private zone: NgZone) {
        // Use the component constructor to inject providers.
        this.route.queryParams.subscribe((params) => {
            const {polyLine} = params;
            polylineHolder = polyLine;
        });
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
                const marker = new mapsModule.Marker();
                marker.position = mapsModule.Position.positionFromLatLng(result.latitude, result.longitude);
                this.mapView.addMarker(marker);
                rideMarkers.markers.push({markerLat: result.latitude, markerLon: result.longitude});
            });
    }

    onHomeTap(): void {
        this.routerExtensions.navigate(["/home"], {
            transition: {
                name: "fade"
            }
    });
}
   
    calculateDistance(lat1, lon1, lat2, lon2): number {
        
        if ((lat1 == lat2) && (lon1 == lon2)) {
            var dist = 0;
            
            return dist;
        } else {
            let radlat1 = Math.PI * lat1 / 180;
            let radlat2 = Math.PI * lat2 / 180;
            let theta = lon1 - lon2;
            let radtheta = Math.PI * theta / 180;
            // tslint:disable-next-line: max-line-length
            let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
            console.log("dist", dist);
        return Number(dist.toFixed(2));
    }
}

    findSpeedBreakdown(speeds): Array<any> {

        const breakdown = speeds.reduce((tally, speed) => {
            if (speed < .25 * this.topSpeed) {
                if (tally["0"] === undefined) {
                    tally["0"] = 1;
                } else {
                    tally["0"]++;
                }
            } else if (speed < .50 * this.topSpeed) {
                if (tally["1"] === undefined) {
                    tally["1"] = 1;
                } else {
                    tally["1"]++;
                }
            } else if (speed < .75 * this.topSpeed) {
                if (tally["2"] === undefined) {
                    tally["2"] = 1;
                } else {
                    tally["2"]++;
                }
            } else {
                if (tally["3"] === undefined) {
                    tally["3"] = 1;
                } else {
                    tally["3"]++;
                }
            }
            return tally;
        }, {});
        const portions = [];
        if(breakdown){
            for (let key in breakdown) {
                portions.push((breakdown[key] / speeds.length * 100).toFixed(1));
            }
        }
        return portions;
    }

    onStopTap(): void {
        geolocation.clearWatch(this.watchId);
        clearTimeout(this.timeoutId);
        this.listen = false;
        //this.speechRecognition.stopListening()
        // .then(()=>{
        //     console.log('stopped listening')
        // }).catch((err)=>{
        //     console.error('Error stop listen:', err)
        // })
          insomnia.allowSleepAgain().then(function() {
        console.log("Insomnia is inactive, good night!");
        });
        let avgSpeed = (this.speed * 2.23694)/ this.allSpeeds.length;
        let speedBreakdown = this.findSpeedBreakdown(this.allSpeeds);
        let pathPolyline = polylineEncoder.encode(this.newPathCoords);
        let first = this.newPathCoords[0];
        let last = this.newPathCoords[this.newPathCoords.length - 1];
        let start = first.time.getTime();
        let stop = last.time.getTime();
    
        let duration = stop - start;
        duration = duration / 10000;
        console.log("duration", duration);
        this.http.post(this.ROOT_URL + "/marker", rideMarkers, {
            headers: new HttpHeaders({
                "Content-Type": "application/json",
            })})
            .subscribe(() => {
                console.log("success");
            });
        const info = {pathPolyline, first, last, avgSpeed, duration, speedBreakdown,
                    topSpeed: this.topSpeed, totalDistance: this.totalDistance};
        this.http.post(this.ROOT_URL + "/ride", info, {
            headers: new HttpHeaders({
                "Content-Type": "application/json",
            })
        })
        .subscribe(() => {
            console.log("ride");
        });
          const params: NavigationExtras = {
                queryParams: {
                    polyLine: pathPolyline,
                    average: avgSpeed,
                    duration,
                    breakdown: speedBreakdown,
                    totalDistance: this.totalDistance,
                    topSpeed: this.topSpeed,
                }
            };
      this.routerExtensions.navigate(["/stats"], params);
    }

    onSpeedTap(): void {
        console.log("called", new Date());
        if(this.show === undefined){
            this.show = true;
        } else{
            this.show = !this.show;
        }
    } 


    drawUserPath(): void {
        insomnia.keepAwake().then(function() {
        console.log("Insomnia is active");
        })

        this.watchId = geolocation.watchLocation((loc) => {
                const newPath = new mapsModule.Polyline();
            if (loc) {
                this.currentSpeed = loc.speed * 2.23694;

                this.speedString = this.currentSpeed.toFixed(1).slice(0, -2);
                this.speedStringDecimal = this.currentSpeed.toFixed(1).slice(-1);
               
                if(this.currentSpeed > this.topSpeed){
                    this.topSpeed = this.currentSpeed;
                }
                this.allSpeeds.push(this.currentSpeed);
                this.speed += loc.speed;
                const lat = loc.latitude;
                const long = loc.longitude;
                const time = loc.timestamp;
                
                if (this.newPathCoords.length === 0) {
                    this.newPathCoords.push({ lat, long, time });
                    this.mapView.latitude = lat;
                    this.mapView.longitude = long;
                    this.mapView.bearing = loc.direction;
                // tslint:disable-next-line: max-line-length
                } else if (this.newPathCoords[this.newPathCoords.length - 1].lat !== lat && this.newPathCoords[this.newPathCoords.length - 1].long !== long) {
                    const lastLat = this.newPathCoords[this.newPathCoords.length - 1].lat;
                    const lastLng = this.newPathCoords[this.newPathCoords.length - 1].long;
                    if(this.newPathCoords.length > 2){
                    this.totalDistance += this.calculateDistance(lat, long, lastLat, lastLng);
                    }
                    this.distanceString = this.totalDistance.toFixed(1).slice(0, -2);
                    this.distanceStringDecimal = this.totalDistance.toFixed(1).slice(-1);
                   
                    this.newPathCoords.push({ lat, long, time });
                    newPath.addPoint(mapsModule.Position.positionFromLatLng(lastLat, lastLng));
                    newPath.addPoint(mapsModule.Position.positionFromLatLng(lat, long));
                    newPath.visible = true;
                    newPath.width = 10;
                    newPath.geodesic = false;
                    if(this.colorCount <= this.colorArray.length - 1 ){
                        newPath.color = new Color(this.colorArray[this.colorCount])
                    } else if(this.colorCount > this.colorArray.length -1){
                        this.colorCount = 0;
                        //newPath.color = new Color(this.colorArray[this.colorCount]);
                    }
                    newPath.color = new Color("red");
                    this.mapView.addPolyline(newPath);
                    this.mapView.latitude = lat;
                    this.mapView.longitude = long;
                    this.mapView.bearing = loc.direction;
                    this.mapView.zoom = 18;
                    //const builder = new com.google.android.gms.maps.model.LatLng.Builder();
                    //const newLatLng = com.google.android.gms.maps.CameraUpdateFactory.newLatLng({lat, long});
                    //this.mapView.gMap.animateCamera();
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
        //console.log('SPEAK!', new Date())
        this.speechRecognition.startListening(
            {
                // optional, uses the device locale by default
                locale: "en-US",
                // set to true to get results back continuously
                returnPartialResults: true,
                // this callback will be invoked repeatedly during recognition
                onResult: (transcription: SpeechRecognitionTranscription) => {
                    console.log('Getting results');
                    this.zone.run(() => this.recognizedText = transcription.text);
                    if (transcription.text.includes("speedometer")) {
                    this.onSpeedTap();
                    } else if(transcription.text.includes("pothole")){
                        this.onPinTap();
                    } else if(transcription.text.includes("end ride")){
                        this.onStopTap();
                    }
                    if(this.listen === false){
                        this.speechRecognition.stopListening();
                    } else {
                            this.handleSpeech();
                    }
                },
                onError: (error) => {
                    if(this.listen === false){
                        this.speechRecognition.stopListening();
                    } else {
                        this.handleSpeech();
                    }
                    
                    // - iOS: A 'string', describing the issue. 
                    // - Android: A 'number', referencing an 'ERROR_*' constant from https://developer.android.com/reference/android/speech/SpeechRecognizer.
                    //            If that code is either 6 or 7 you may want to restart listening.
                }
            }
        ).then(
            (started) => { console.log(`started listening`) },
            (errorMessage) => { 
                //console.log(`Listen Error: ${errorMessage}`);
             if(this.listen === false){
                        this.speechRecognition.stopListening();
                    } else {
                            this.handleSpeech();
                }
             }
        )
            .catch((error) => {
                // same as the 'onError' handler, but this may not return if the error occurs after listening has successfully started (because that resolves the promise,
                // hence the' onError' handler was created.
                console.error("Where's the error",error);
            });
}
    
    onMapReady(args){
        this.mapView = args.object; 
        this.speechRecognition.available().then(
            (available: boolean) => console.log(available ? "YES!" : "NO"),
            (err: string) => console.log(err)
        ); 
        //this.handleSpeech();
        this.listen = true;
       
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
            polyline.color = new Color("#393ef9");
            this.mapView.latitude = flightPlanCoordinates[0].lat;
            this.mapView.longitude = flightPlanCoordinates[0].lng;        
            this.mapView.addPolyline(polyline);
        } 

        this.mapView.mapAnimationsEnabled = true;
        this.mapView.zoom = 18;
        
        this.mapView.tilt = 10;
        this.mapView.gMap.setMyLocationEnabled(true);
        const uiSettings = this.mapView.gMap.getUiSettings();
        uiSettings.setMyLocationButtonEnabled(true);
        geolocation.getCurrentLocation({ desiredAccuracy: Accuracy.high, maximumAge: 5000, timeout: 20000 })
            .then((result) => {
                const marker = new mapsModule.Marker();
                // tslint:disable-next-line: max-line-length
                // var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
                // marker.icon = image;
                marker.position = mapsModule.Position.positionFromLatLng(result.latitude, result.longitude);
                this.mapView.addMarker(marker);
                this.mapView.latitude = result.latitude;
                this.mapView.longitude = result.longitude;
            })
            .catch((err)=>{
                console.error("Get location error:", err);
            });
        this.drawUserPath();
    }
}
