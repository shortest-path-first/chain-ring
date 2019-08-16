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
import { Vibrate } from 'nativescript-vibrate';
import { Image } from "tns-core-modules/ui/image";
import { ImageSource } from "tns-core-modules/image-source";


//const style = require("../../../App_Resources/style.json")
var insomnia = require("nativescript-insomnia");
var mapsModule = require("nativescript-google-maps-sdk");
const decodePolyline = require('decode-google-map-polyline');
const polylineEncoder = require('google-polyline')
const rideMarkers = {markers: []};
var flashlight = require("nativescript-flashlight");
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
    pinClicked = false;
    listen;
    speed = 0; 
    topSpeed = 0;
    allSpeeds = [];
    callCount = 0;
    currentSpeed = 0;
    speedString = '0';
    speedStringDecimal = '0';
    newPathCoords = [];
    totalDistance = 0.0;
    recognizedText;
    distanceString = "0";
    listenIntervalId;
    lightIntervalId;
    light = false;
    distanceStringDecimal = "0";
    speechRecognition = new SpeechRecognition();
    left;
    right;
    straight;
    vibrator = new Vibrate();
    colorCount = 0;
    colorArray = ['#393ef9', '#4638f1', '#6036ea', '#7335e2', '#8533da', '#9532d2', '#9330ca', '#b02fc3',
    '#bb2dbb', '#b32ca2', '#ab2a8a', '#a42974', '#9c2760', '#a42974', '#ab2a8a', '#b32ca2', '#bb2dbb', 
    '#b02fc3', '#9330ca', '#9532d2', '#8533da', '#7335e2', '#6036ea', '#4638f1'];
    directedRide = false;
    directionDistances = [];
    directionWords = [];
    turnPoints = [];
    steps = [
        {
            "distance": {
                "text": "66 ft",
                "value": 20
            },
            "duration": {
                "text": "1 min",
                "value": 3
            },
            "end_location": {
                "lat": 29.9776004,
                "lng": -90.0804337
            },
            "html_instructions": "Head <b>south</b> on <b>N White St</b> toward <b>Esplanade Ave</b>",
            "polyline": {
                "points": "a`~uDhyxdP`@J"
            },
            "start_location": {
                "lat": 29.977767,
                "lng": -90.08036919999999
            },
            "travel_mode": "BICYCLING"
        },
        {
            "distance": {
                "text": "0.2 mi",
                "value": 353
            },
            "duration": {
                "text": "1 min",
                "value": 89
            },
            "end_location": {
                "lat": 29.9795782,
                "lng": -90.0832971
            },
            "html_instructions": "Turn <b>right</b> onto <b>Esplanade Ave</b>",
            "maneuver": "turn-right",
            "polyline": {
                "points": "__~uDtyxdPeCdEiCbEe@x@uAxB"
            },
            "start_location": {
                "lat": 29.9776004,
                "lng": -90.0804337
            },
            "travel_mode": "BICYCLING"
        },
        {
            "distance": {
                "text": "262 ft",
                "value": 80
            },
            "duration": {
                "text": "1 min",
                "value": 13
            },
            "end_location": {
                "lat": 29.9803009,
                "lng": -90.08325839999999
            },
            "html_instructions": "Turn <b>right</b> onto <b>N Lopez St</b><div style=\"font-size:0.9em\">Destination will be on the right</div>",
            "maneuver": "turn-right",
            "polyline": {
                "points": "kk~uDrkydPq@C}AC"
            },
            "start_location": {
                "lat": 29.9795782,
                "lng": -90.0832971
            },
        },
        {
            "distance": {
            "text": "39 ft",
            "value": 12
            },
            "duration": {
                "text": "1 min",
                "value": 2
            },
            "end_location": {
                "lat": 29.980411,
                "lng": -90.0832537
            },
            "html_instructions": "Head <b>north</b> on <b>N Lopez St</b> toward <b>Ponce De Leon St</b>",
            "polyline": {
                "points": "{o~uDjkydPUA"
            },
            "start_location": {
                "lat": 29.9803009,
                "lng": -90.08325839999999
            },
            "travel_mode": "BICYCLING"
        },
        {
            "distance": {
                "text": "384 ft",
                "value": 117
            },
            "duration": {
                "text": "1 min",
                "value": 21
            },
            "end_location": {
                "lat": 29.9804536,
                "lng": -90.08447059999999
            },
            "html_instructions": "Turn <b>left</b> onto <b>Ponce De Leon St</b><div style=\"font-size:0.9em\">Destination will be on the right</div>",
            "maneuver": "turn-left",
            "polyline": {
                "points": "qp~uDhkydPGhF?H"
            },
            "start_location": {
                "lat": 29.980411,
                "lng": -90.0832537
            },
            "travel_mode": "BICYCLING"
        }
    ]
    

    readonly ROOT_URL = "https://5161accf.ngrok.io";

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
        this.pinClicked = !this.pinClicked;
    }

    onPinSelect(pinType): void {
        this.pinClicked = false;
        console.log(pinType);

        geolocation.getCurrentLocation({ desiredAccuracy: Accuracy.high, maximumAge: 5000, timeout: 20000 })
            .then((result) => {
                const marker = new mapsModule.Marker();
                const imageSource = new ImageSource();
                if(pinType === "pothole"){
                    imageSource.loadFromFile("~/app/images/mapPotHole.png");
                } else if (pinType === "close"){
                    imageSource.loadFromFile("~/app/images/mapNearMiss.png");
                } else if (pinType === "avoid"){
                    imageSource.loadFromFile("~/app/images/mapAvoid.png");
                } else if (pinType === "crash"){
                    imageSource.loadFromFile("~/app/images/mapHit.png");
                } else if (pinType === "stolen"){
                    imageSource.loadFromFile("~/app/images/mapStolen.png");
                }
                const icon = new Image();
                icon.imageSource = imageSource;
                marker.icon = icon;
                marker.position = mapsModule.Position.positionFromLatLng(result.latitude, result.longitude);
                this.mapView.addMarker(marker);
                rideMarkers.markers.push({markerLat: result.latitude, markerLon: result.longitude, type: pinType});
            });
    }

    onLightTap(): void {
        this.light = this.light!;
    
        console.log(flashlight);
        if(this.light){
            if (flashlight.isAvailable()) {
                // this.zone.runOutsideAngular(()=>{
                //     this.lightIntervalId = setInterval(()=>{
                //         flashlight.toggle();
                //     }, 500);
                // })
                flashlight.on();
              console.log("Flashlight Available")
            }

        } else {
            flashlight.off();
            clearInterval(this.lightIntervalId);
        }
    }

    onHomeTap(): void {
        
        geolocation.clearWatch(this.watchId);
        clearInterval(this.listenIntervalId);
        clearInterval(this.lightIntervalId);
        this.left = false;
        this.right = false;
        this.straight = false;
        this.listen = false;
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
            console.log("dist", dist, new Date());
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

    directionsParser(): void{
        this.steps.forEach((step)=>{
        this.directionDistances.push(step.distance.text);
        this.directionWords.push(step['html_instructions'].replace(/<\/?[^>]+(>|$)/g, ""));
        this.turnPoints.push(step['end_location']);
    })
    }

    onDirectionsTap(): void{
            
            this.directionWords = this.directionWords.slice(1);
            this.directionDistances = this.directionDistances.slice(1);
            this.turnPoints = this.turnPoints.slice(1);
            this.checkForManeuver(29.9778246, -90.0801914);
    }

    onStopTap(): void {
        console.log("stop:", this.watchId)
        geolocation.clearWatch(this.watchId);
        this.speechRecognition.stopListening();
        clearInterval(this.listenIntervalId);
        clearInterval(this.lightIntervalId);
        this.listen = false;
        this.left = false;
        this.right = false;
        this.straight = false;


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
        
    console.log("Speed Called")
        if(this.show === undefined){
            this.show = true;
        } else{
            this.show = !this.show;
        }
    } 

    checkForManeuver(lat, long){
        // check to make sure there are turnPoints
        if(this.turnPoints.length){
        // if the user's position is within .0001 latitude or longitude show signal
        if(lat >= this.turnPoints[0].lat - .001 && lat <= this.turnPoints[0].lat + .001
            && long >= this.turnPoints[0].lng - .001 && long <= this.turnPoints[0].lng + .001){
        
           if(this.directionWords[0].indexOf("left") !== -1){
                this.left = true;
                this.right = false;
                this.straight = false;
                this.vibrator.vibrate([3000, 2000, 1000]);
            } else if (this.directionWords[0].indexOf("right") !== -1){
                this.right = true;
                this.left = false;
                this.straight = false;
                this.vibrator.vibrate([1000, 2000, 3000]);
            } else if (this.directionWords[0].indexOf("straight") !== -1){
                this.straight = true;
                this.right = false;
                this.left = false;
            } else {
                this.left = false;
                this.right = false;
                this.straight = false;
            }
        } else {
                this.left = false;
                this.right = false;
                this.straight = false;
        }

        // if the user location is within .0001 degrees show next direction
        if(lat >= this.turnPoints[0].lat - .0001 && lat <= this.turnPoints[0].lat + .0001
            && long >= this.turnPoints[0].lng - .0001 && long <= this.turnPoints[0].lng + .0001){
                this.directionWords.unshift();
                this.directionDistances.unshift();
                this.turnPoints.unshift();
            }
        }
    }

    drawUserPath(): void {
        insomnia.keepAwake().then(function() {
        console.log("Insomnia is active");
        })
        
            this.watchId = geolocation.watchLocation((loc) => {
                    const newPath = new mapsModule.Polyline();
                if (loc && this.mapView !== null || loc && this.mapView !== undefined) {
                        if(this.listen === false && this.speechRecognition !== null){
                            this.speechRecognition.stopListening();
                        } else {
                       // this.handleSpeech();
                        }
                    //this.handleSpeech();
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
                    this.checkForManeuver(lat, long);
    
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
                            this.colorCount++;
                        } else if(this.colorCount > this.colorArray.length -1){
                            this.colorCount = 0;
                            newPath.color = new Color(this.colorArray[this.colorCount]);
                        }
                        //newPath.color = new Color("red");
                        if(this.mapView){
                        this.mapView.addPolyline(newPath);
                        }
                        this.mapView.latitude = lat;
                        this.mapView.longitude = long;
                        this.mapView.bearing = loc.direction;      
                    }
        }
            }, (e) => {
                console.log("Error: " + e.message);
            }, {
                    desiredAccuracy: Accuracy.high,
                    updateTime: 3000,
                    updateDistance: 0.1,
                    minimumUpdateTime: 1000
                });
            console.log("start", this.watchId, typeof this.watchId);
    }


    handleSpeech(){
       this.callCount++;
        console.log("speech:", this.callCount, new Date());
            if(this.speechRecognition !== null){
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
                        
                            this.onPinSelect('pothole');
                        } else if(transcription.text.includes("avoid")){
                            
                            this.onPinSelect('avoid');
                        } else if(transcription.text.includes("close call")){
                            this.onPinSelect('close');
                        } else if(transcription.text.includes("zoom in")){
                            this.mapView.zoom = 18;
                        } else if(transcription.text.includes("zoom out")){
                            this.mapView.zoom = 10;
                        } else if(transcription.text.includes("stop ride")){
                            this.zone.run(()=>{
                                this.onStopTap();
                            })

                        }
                            this.listen = false;
                    },
                    onError: (error) => {
                        this.listen = false;
                        // - iOS: A 'string', describing the issue. 
                        // - Android: A 'number', referencing an 'ERROR_*' constant from https://developer.android.com/reference/android/speech/SpeechRecognizer.
                        //            If that code is either 6 or 7 you may want to restart listening.
                    }
                }
            ).then(
                (started) => { console.log(`started listening`) 
                this.listen = false;
            },
                (errorMessage) => { 
                    //console.log(`Listen Error: ${errorMessage}`);
                        this.listen = false;
                }
            )
                .catch((error) => {
                    // same as the 'onError' handler, but this may not return if the error occurs after listening has successfully started (because that resolves the promise,
                    // hence the' onError' handler was created.
                    console.error("Where's the error",error);
                });
            }
     
}
    
    onMapReady(args){
        this.mapView = args.object; 
        this.speechRecognition.available().then(
            (available: boolean) => console.log(available ? "YES!" : "NO"),
            (err: string) => console.log(err)
        ); 
        for(let i = 0; i < 100; i++){
            clearInterval(i);
            geolocation.clearWatch(i);
        }
        this.listen = false;
        this.zone.runOutsideAngular(()=>{
            this.listenIntervalId = setInterval(()=>{
                if(this.listen === false){
                    this.listen = true;
                    this.handleSpeech();
                }
            }, 3000);
        })
        console.log('interval id:', this.listenIntervalId);
   
     
        // const line = polylineHolder;
        const line = "a`~uDhyxdP`@JeCdEoD|FuAxBq@CsBEGrF"
        if(line !== undefined){
            this.directedRide = true;
            this.directionsParser();
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
