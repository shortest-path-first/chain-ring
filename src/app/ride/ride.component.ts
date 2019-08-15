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
    callCount = 0;
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
    left;
    right;
    straight;
    colorCount = 0;
    vibrator = new Vibrate();
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
                                "text": "102 ft",
                                "value": 31
                            },
                            "duration": {
                                "text": "1 min",
                                "value": 5
                            },
                            "end_location": {
                                "lat": 29.9775096,
                                "lng": -90.08047979999999
                            },
                            "html_instructions": "Head <b>south</b> on <b>N White St</b> toward <b>Esplanade Ave</b>",
                            "polyline": {
                                "points": "a`~uDhyxdP`@JPH"
                            },
                            "start_location": {
                                "lat": 29.977767,
                                "lng": -90.08036919999999
                            },
                            "travel_mode": "BICYCLING"
                        },
                        {
                            "distance": {
                                "text": "1.4 mi",
                                "value": 2306
                            },
                            "duration": {
                                "text": "10 mins",
                                "value": 583
                            },
                            "end_location": {
                                "lat": 29.9645726,
                                "lng": -90.0617776
                            },
                            "html_instructions": "Turn <b>left</b> onto <b>Esplanade Ave</b>",
                            "maneuver": "turn-left",
                            "polyline": {
                                "points": "m~}uD~yxdPf@w@p@iAT_@T_@dAcBl@aAl@_AN[h@aA`A_Bx@qARYt@oAp@gA|@uAbAaBr@kAnAuBf@y@Ze@TWV[@CNWLQBGLUp@kA`AaBzBmDvBmDtBoDhB}CJM?A@A@AFK@AFI?ALQz@yAT_@T_@p@cA`@m@Xc@jBaDXc@hAoB|AcCT_@j@_A^k@p@gANWd@u@vA_CJUNU|AgC"
                            },
                            "start_location": {
                                "lat": 29.9775096,
                                "lng": -90.08047979999999
                            },
                            "travel_mode": "BICYCLING"
                        },
                        {
                            "distance": {
                                "text": "0.3 mi",
                                "value": 552
                            },
                            "duration": {
                                "text": "2 mins",
                                "value": 125
                            },
                            "end_location": {
                                "lat": 29.9655835,
                                "lng": -90.0564631
                            },
                            "html_instructions": "Turn <b>left</b> onto <b>Dauphine St</b>",
                            "maneuver": "turn-left",
                            "polyline": {
                                "points": "qm{uDbeudPWUuBiBACACAGAIGeDKcFOcFMeFAy@"
                            },
                            "start_location": {
                                "lat": 29.9645726,
                                "lng": -90.0617776
                            },
                            "travel_mode": "BICYCLING"
                        },
                        {
                            "distance": {
                                "text": "0.1 mi",
                                "value": 208
                            },
                            "duration": {
                                "text": "1 min",
                                "value": 68
                            },
                            "end_location": {
                                "lat": 29.9674466,
                                "lng": -90.0566286
                            },
                            "html_instructions": "Turn <b>left</b> onto <b>Elysian Fields Ave</b><div style=\"font-size:0.9em\">Destination will be on the right</div>",
                            "maneuver": "turn-left",
                            "polyline": {
                                "points": "{s{uDzctdPeERoDL"
                            },
                            "start_location": {
                                "lat": 29.9655835,
                                "lng": -90.0564631
                            },
                            "travel_mode": "BICYCLING"
                        },
                        {
                            "distance": {
                                "text": "0.1 mi",
                                "value": 235
                            },
                            "duration": {
                                "text": "1 min",
                                "value": 83
                            },
                            "end_location": {
                                "lat": 29.9695523,
                                "lng": -90.05670889999999
                            },
                            "html_instructions": "Head <b>north</b> on <b>Elysian Fields Ave</b> toward <b>N Rampart St</b>",
                            "polyline": {
                                "points": "q_|uD|dtdPS@o@ByCJ_@BeA?UAk@C]?"
                            },
                            "start_location": {
                                "lat": 29.9674466,
                                "lng": -90.0566286
                            },
                            "travel_mode": "BICYCLING"
                        },
                        {
                            "distance": {
                                "text": "0.3 mi",
                                "value": 446
                            },
                            "duration": {
                                "text": "1 min",
                                "value": 78
                            },
                            "end_location": {
                                "lat": 29.9698407,
                                "lng": -90.0520937
                            },
                            "html_instructions": "Turn <b>right</b> onto <b>Marais St</b>",
                            "maneuver": "turn-right",
                            "polyline": {
                                "points": "ul|uDletdPO}EKaFK_FKeDCc@?YAW"
                            },
                            "start_location": {
                                "lat": 29.9695523,
                                "lng": -90.05670889999999
                            },
                            "travel_mode": "BICYCLING"
                        },
                        {
                            "distance": {
                                "text": "0.2 mi",
                                "value": 398
                            },
                            "duration": {
                                "text": "2 mins",
                                "value": 125
                            },
                            "end_location": {
                                "lat": 29.9734092,
                                "lng": -90.0523748
                            },
                            "html_instructions": "Turn <b>left</b> onto <b>St Roch Ave</b><div style=\"font-size:0.9em\">Destination will be on the right</div>",
                            "maneuver": "turn-left",
                            "polyline": {
                                "points": "on|uDphsdPgDLa@BmELiENgBF"
                            },
                            "start_location": {
                                "lat": 29.9698407,
                                "lng": -90.0520937
                            },
                            "travel_mode": "BICYCLING"
                        }
                    ]
    

    readonly ROOT_URL = "https://1161b504.ngrok.io";

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
        
        geolocation.clearWatch(this.watchId);
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

    directionsParser(): void{
        this.steps = this.steps.reverse();
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
            this.checkForManeuver(10, 10);
    }

    onStopTap(): void {
        
        geolocation.clearWatch(this.watchId);
        clearTimeout(this.timeoutId);
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
       
        if(this.show === undefined){
            this.show = true;
        } else{
            this.show = !this.show;
        }
    } 

    checkForManeuver(lat, long){
        if(this.turnPoints.length){
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

        if(lat >= this.turnPoints[0].lat - .0001 && lat <= this.turnPoints[0].lat + .0001
            && long >= this.turnPoints[0].lng - .0001 && long <= this.turnPoints[0].lng + .0001){
                this.directionWords.unshift();
                this.directionDistances.unshift();
                this.turnPoints.unshift();
            }
        }
        // check if position is within a block of turn
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
                    this.mapView.addPolyline(newPath);
                    this.mapView.latitude = lat;
                    this.mapView.longitude = long;
                    this.mapView.bearing = loc.direction;
                    this.mapView.zoom = 18;
                   
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
        this.callCount++;
        this.speechRecognition.available().then(
            (available: boolean) => console.log(available ? "YES!" : "NO"),
            (err: string) => console.log(err)
        ); 
        //this.handleSpeech();
        this.listen = true;
        this.directionsParser();
        
        // const line = polylineHolder;
        const line = "a`~uDhyxdPr@TxAaC~CeFhD}FtDcGdGyJbA_Bl@s@b@u@~@aB|DoGbJiOBEzAeC~BqDhFyI~DoG~DuGZk@|AgCWUwBmBCKIoD[gMO_HuJ`@}FT{AAiACs@eYC}@AWgDLoFPqHV";
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
