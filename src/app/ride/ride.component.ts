import { ActivatedRoute, Router, NavigationExtras } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { Component, OnInit,  NgZone } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { registerElement } from "nativescript-angular/element-registry";
import * as app from "tns-core-modules/application";
import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums";
import { Color } from "tns-core-modules/color/color";
import { SpeechRecognition, SpeechRecognitionTranscription } from "nativescript-speech-recognition";
import { Vibrate } from "nativescript-vibrate";
import { Image } from "tns-core-modules/ui/image";
import { ImageSource } from "tns-core-modules/image-source";
import { Place } from "../map/map";
import * as utils from "tns-core-modules/utils/utils";
import { knownFolders, Folder, File } from "tns-core-modules/file-system";
import * as Obser from "tns-core-modules/data/observable";
//import { start } from "repl";

declare var com: any;

const style = require("../../../App_Resources/style.json")

const insomnia = require("nativescript-insomnia");
const mapsModule = require("nativescript-google-maps-sdk");

const decodePolyline = require("decode-google-map-polyline");
const polylineEncoder = require("google-polyline");
let rideMarkers = {markers: []};
let polylineHolder;
let topSpeedHolder;
let startTimeHolder;

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
    directionsResponse;
    maneuvers = [];
    listen;
    speed = 0;
    topSpeed = 0;
    allSpeeds = []
    callCount = 0;
    currentSpeed = 0;
    speedString = "0";
    speedStringDecimal = "0";
    newPathCoords = [];
    totalDistance = 0.0;
    recognizedText;
    distanceString = "0";
    listenIntervalId;
    light = false;
    distanceStringDecimal = "0";
    polyline;
    startZoom = 13;
    speechRecognition = new SpeechRecognition();
    startTime;
    stopTime;
    left;
    right;
    recognized;
    recognizedTimeoutId;
    straight;
    vibrator = new Vibrate();
    colorCount = 0;
    colorArray = [
        "#393ef9",
        "#4638f1",
        "#6036ea",
        "#7335e2",
        "#8533da",
        "#9532d2",
        "#9330ca",
        "#b02fc3",
        "#bb2dbb",
        "#b32ca2",
        "#ab2a8a",
        "#a42974",
        "#9c2760",
        "#a42974",
        "#ab2a8a",
        "#b32ca2",
        "#bb2dbb",
        "#b02fc3",
        "#9330ca",
        "#9532d2",
        "#8533da",
        "#7335e2",
        "#6036ea",
        "#4638f1"
    ];
    directedRide = false;
    destLat;
    destLng;
    turnPolyline;
    turnPolylines = [];
    directionDistances = [];
    directionWords = [];
    allDirectionWords = [];
    turnPoints = [];
    potholeIcon;
    closeIcon;
    avoidIcon;
    crashIcon;
    stolenIcon;
    direct = false;
    steps;

    vm = new Obser.Observable();
    documents: Folder = knownFolders.documents();
    folder: Folder = this.documents.getFolder(this.vm.get("src") || "src");
    file: File = this.folder.getFile(
        `${this.vm.get("token") || "token"}` + `.txt`
    );

    readonly ROOT_URL = "http://3.17.64.34:3000";

    // tslint:disable-next-line: max-line-length
    constructor(
        private http: HttpClient,
        private router: Router,
        private routerExtensions: RouterExtensions,
        private route: ActivatedRoute,
        private zone: NgZone
    ) {
        // Use the component constructor to inject providers.
        const paramSubscription = this.route.queryParams.subscribe((params) => {
            const { polyLine, parsedPeter } = params;
            const peterInfo = JSON.parse(parsedPeter);
            polylineHolder = polyLine;
            this.steps = peterInfo;
            console.log(params);
        });
        paramSubscription.unsubscribe();
    }

    ngOnInit(): void {
        // Init your component properties here.
        startTimeHolder = new Date();
        for (let i = 0; i < 100; i++) {
            clearInterval(i);
            geolocation.clearWatch(i);
        }
        this.listen = false;
        this.recognized = false;

       /**
        * This function starts the speech recognition interval
        */
        this.zone.runOutsideAngular(() => {
            this.listenIntervalId = setInterval(() => {
                if (this.listen === false) {
                    this.speechRecognition.available().then(
                        (available: boolean) => {
                            this.handleSpeech();
                            console.log(available ? "YES!" : "NO");
                        },
                        (err: string) => console.log(err)
                    );
                }
            }, 2000);
        });

        // Load custom icon files
        const potholeImageSource = new ImageSource();
        this.potholeIcon = new Image();
        potholeImageSource.loadFromFile("~/app/images/mapPotHole.png");
        this.potholeIcon.imageSource = potholeImageSource;

        const closeImageSource = new ImageSource();
        this.closeIcon = new Image();
        closeImageSource.loadFromFile("~/app/images/mapNearMiss.png");
        this.closeIcon.imageSource = closeImageSource;

        const avoidImageSource = new ImageSource();
        this.avoidIcon = new Image();
        avoidImageSource.loadFromFile("~/app/images/mapAvoid.png");
        this.avoidIcon.imageSource = avoidImageSource;

        const crashImageSource = new ImageSource();
        this.crashIcon = new Image();
        crashImageSource.loadFromFile("~/app/images/mapHit.png");
        this.crashIcon.imageSource = crashImageSource;

        const stolenImageSource = new ImageSource();
        this.stolenIcon = new Image();
        stolenImageSource.loadFromFile("~/app/images/mapStolen.png");
        this.stolenIcon.imageSource = stolenImageSource;
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    onDirectTap(): void {
        console.log("direct click");
        this.direct = !this.direct;
    }

    onPinTap(): void {
        this.pinClicked = !this.pinClicked;
    }

    /**
     * Drops corresponding icon image on the map at the user's
     *  current location when the pin is either selected from 
     * the pin options or through voice command
     * @param {string} pinType - 
     */
    onPinSelect(pinType): void {
        this.pinClicked = false;

        geolocation
            .getCurrentLocation({
                desiredAccuracy: Accuracy.high,
                maximumAge: 5000,
                timeout: 20000
            })
            .then((result) => {
                const marker = new mapsModule.Marker();
                if (pinType === "pothole") {
                    marker.icon = this.potholeIcon;
                } else if (pinType === "close") {
                    marker.icon = this.closeIcon;
                } else if (pinType === "avoid") {
                    marker.icon = this.avoidIcon;
                } else if (pinType === "crash") {
                    marker.icon = this.crashIcon;
                } else if (pinType === "stolen") {
                    marker.icon = this.stolenIcon;
                }

                marker.position = mapsModule.Position.positionFromLatLng(
                    result.latitude,
                    result.longitude
                );
                this.mapView.addMarker(marker);
                rideMarkers.markers.push({
                    markerLat: result.latitude,
                    markerLon: result.longitude,
                    type: pinType
                });
            });
    }

    /**
     *  Function triggered by the touching the home icon.
     *  Clears all intervals and resets booleans to false.
     */
    onHomeTap(): void {
        geolocation.clearWatch(this.watchId);
        clearInterval(this.listenIntervalId);
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

    /**
     *  Function to calculate the distance between two coordinates
     * 
     * @param {number} lat1 - Number representing the first position's latitude
     * @param {number} lon1 - Number representing the first position's longitude
     * @param {number} lat2 - Number representing the second position's latitude
     * @param {number} lng2 - Number representing the second position's longitude
     * 
     * @returns {number} distance in miles overland between coordinates
     */
    calculateDistance(lat1, lon1, lat2, lon2): number {
        if (lat1 == lat2 && lon1 == lon2) {
            const dist = 0;

            return dist;
        } else {
            const radlat1 = (Math.PI * lat1) / 180;
            const radlat2 = (Math.PI * lat2) / 180;
            const theta = lon1 - lon2;
            const radtheta = (Math.PI * theta) / 180;
            // tslint:disable-next-line: max-line-length
            let dist =
                Math.sin(radlat1) * Math.sin(radlat2) +
                Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = (dist * 180) / Math.PI;
            dist = dist * 60 * 1.1515;
            return Number(dist.toFixed(2));
        }
    }

    /**
     * Function to find the portion of the ride spent at less than 25% of the top speed, 
     * between 25% and 50% of the top speed, 50% to 75% of the top speed, and between
     * 75% and 100% of the top speed. The information is then passed to the database and 
     * the stats page.
     * @param {Array} speeds - An array of all the speeds recorded when the user's position
     * is checked by the watchInterval.
     * @returns {Object} breakdown - returns object with the tally for each speed range
     */
    findSpeedBreakdown(speeds): Array<any> {
        const breakdown = speeds.reduce((tally, speed) => {
            if (speed < 0.25 * topSpeedHolder) {
                if (tally["0"] === undefined) {
                    tally["0"] = 1;
                } else {
                    tally["0"]++;
                }
            } else if (speed < 0.5 * topSpeedHolder) {
                if (tally["1"] === undefined) {
                    tally["1"] = 1;
                } else {
                    tally["1"]++;
                }
            } else if (speed < 0.75 * topSpeedHolder) {
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
        return breakdown;
    }

    /**
     * Function to parse the directions from the Google Directions API. Removes
     * the html tags from the instructions. Pushes each batch of info into their
     * designated arrays.
     */
    directionsParser(): void {
        this.steps.forEach((step) => {
        this.directionDistances.push(step.distance.text);
        this.directionWords.push(step["html_instructions"].replace(/<\/?[^>]+(>|$)/g, " "));
        this.turnPoints.push(step["end_location"]);
        });
       
    }

    /**
     *  Function that gets new directions to the destination based on the user's last
     * recorded location. Reassigns all directional variables with the new info.
     */
    onReroute(): void {
        const lastLat = this.newPathCoords[this.newPathCoords.length - 1].lat;
        const lastLng = this.newPathCoords[this.newPathCoords.length - 1].long;
        const params = new HttpParams()
            .set("place", `${this.destLat},${this.destLng}`)
            .set("userLoc", `${lastLat},${lastLng}`);
        const rerouteSubscription = this.http
            .get<Array<Place>>(this.ROOT_URL + "/mapPolyline", { params })
            .subscribe((response) => {
                // reassigns response to variable to avoid dealing with "<Place[]>"
                this.directionsResponse = response;
                const {
                    rerouteHTML,
                    rerouteEndLoc,
                    rerouteDistance,
                    polyLine
                } = this.directionsResponse;
                this.turnPoints = rerouteEndLoc;
                this.directionDistances = rerouteDistance;
                this.directionWords = rerouteHTML;
                const newRoute = decodePolyline(polyLine);
                const reroutePolyline = new mapsModule.Polyline();
                for (let i = 0; i < newRoute.length; i++) {
                    const coord = newRoute[i];
                    reroutePolyline.addPoint(
                        mapsModule.Position.positionFromLatLng(
                            coord.lat,
                            coord.lng
                        )
                    );
                }
                reroutePolyline.visible = true;
                reroutePolyline.width = 10;
                reroutePolyline.geodesic = false;
                reroutePolyline.color = new Color("#393ef9");
                this.mapView.removeAllPolylines();
                this.mapView.latitude = newRoute[0].lat;
                this.mapView.longitude = newRoute[0].lng;
                this.mapView.addPolyline(reroutePolyline);
                rerouteSubscription.unsubscribe();
            });
    }

    onDirectionsTap(): void {
        this.directionWords = this.directionWords.slice(1);
        this.directionDistances = this.directionDistances.slice(1);
        this.turnPoints = this.turnPoints.slice(1);
        this.checkForManeuver(29.9778246, -90.0801914);
    }

    /**
     * Function triggered by tapping the stop button or the user saying "stop ride".
     * The function clears all the intervals, resets booleans to false, and nullifies 
     * all closure variables. The function then calculate and gathers all pertinent 
     * information from the ride and sends it to the database and stats page.
     */
    onStopTap(): void {
  
        this.stopTime = new Date();
        geolocation.clearWatch(this.watchId);
        this.speechRecognition.stopListening();
        clearInterval(this.listenIntervalId);

        this.listen = false;
        this.left = false;
        this.right = false;
        this.straight = false;

        insomnia.allowSleepAgain().then(function() {
            // console.log("Insomnia is inactive, good night!");
        });
        let avgSpeed = (this.speed * 2.23694) / this.allSpeeds.length;
        const speedBreakdown = this.findSpeedBreakdown(this.allSpeeds);
        const pathPolyline = polylineEncoder.encode(this.newPathCoords);
        const first = this.newPathCoords[0];
        const last = this.newPathCoords[this.newPathCoords.length - 1];

        let duration = this.stopTime.getTime() - startTimeHolder.getTime();
        duration = duration / 1000;
        
        const markerSubscription = this.http
            .post(this.ROOT_URL + "/marker", rideMarkers, {
                headers: new HttpHeaders({
                    "Content-Type": "application/json"
                })
            })
            .subscribe(() => {
                console.log("success");
            });
        markerSubscription.unsubscribe();
        const info = {
            pathPolyline,
            first,
            last,
            avgSpeed,
            duration,
            speedBreakdown,
            topSpeed: topSpeedHolder,
            totalDistance: this.totalDistance
        };
        const year = startTimeHolder.getFullYear();
        const month = startTimeHolder.getMonth();
        const day = startTimeHolder.getDate();
        const hour = startTimeHolder.getHours();
        const minutes = startTimeHolder.getMinutes();
        this.file.readText()
            .then((res) => {
                const dbParams = new HttpParams()
                    .set(`polyLine`, `${pathPolyline}`)
                    .set(`average`, `${avgSpeed}`)
                    .set(`duration`, `${duration}`)
                    .set(`breakdown`, `${JSON.stringify(speedBreakdown)}`)
                    .set(`totalDistance`, `${this.totalDistance}`)
                    .set(`topSpeed`, `${topSpeedHolder}`)
                    .set(`token`, `${res}`)
                    .set(`rideTime`, `${hour}:${minutes} ${month}/${day}/${year}`);

                const rideSubscription = this.http
                    .post(this.ROOT_URL + "/ride", info, {
                        headers: new HttpHeaders({
                        "Content-Type": "application/json"
                    }),
                        params: dbParams
                })
                    .subscribe(() => {
                    console.log("ride");
                });
                rideSubscription.unsubscribe();
        });
        const params: NavigationExtras = {
            queryParams: {
                polyLine: pathPolyline,
                average: avgSpeed,
                duration,
                breakdown: speedBreakdown,
                totalDistance: this.totalDistance,
                topSpeed: topSpeedHolder
            }
        };

        this.mapView = null;
        this.watchId = null;
        this.show = null;
        this.pinClicked = null;
        this.directionsResponse = null;
        this.maneuvers = null;
        this.listen = null;
        this.speed = null;
        topSpeedHolder = null;
        this.allSpeeds = null;
        this.callCount = null;
        this.currentSpeed = null;
        this.speedString = null;
        this.speedStringDecimal = null;
        this.newPathCoords = null;
        this.totalDistance = null;
        this.recognizedText = null;
        this.distanceString = null;
        this.listenIntervalId = null;
        this.light = null;
        this.distanceStringDecimal = null;
        this.polyline = null;
        this.startZoom = null;
        this.speechRecognition = null;
        startTimeHolder = null;
        this.stopTime = null;
        this.left = null;
        this.right = null;
        this.recognized = null;
        this.recognizedTimeoutId = null;
        this.straight = null;
        this.vibrator = null;
        this.colorCount = null;
        this.colorArray = null;
        this.directedRide = null;
        this.destLat = null;
        this.destLng = null;
        this.turnPolyline = null;
        this.turnPolylines = null;
        this.directionDistances = null;
        this.directionWords = null;
        this.allDirectionWords = null;
        this.turnPoints = null;
        this.potholeIcon = null;
        this.closeIcon = null;
        this.avoidIcon = null;
        this.crashIcon = null;
        this.stolenIcon = null;
        this.direct = null;
        this.steps = null;
        rideMarkers = null;
        this.routerExtensions.navigate(["/stats"], params);
    }

    /**
     * Function toggles speedometer on and off. Triggered by tapping the
     * speedometer icon or the user saying "speedometer".
     */
    onSpeedTap(): void {
    
        if (this.show === undefined) {
            this.show = true;
        } else {
            this.show = !this.show;
        }
    }
    
    /**
     * Function checks the user's proximity to their next turning point. If the
     * user is roughly within a block of a turn, their device will vibrate and
     * an icon indicating the direction of the turn will appear. When the user 
     * is close enough to the turn, the next set of instructions will appear.
     * 
     * @param lat {number} - the latitude of user's current location
     * @param long {number} - the longitude of the user's current location
     */
    checkForManeuver(lat, long) {
        // check to make sure there are turnPoints
        if (this.turnPoints.length) {
            // if the user's position is within .0001 latitude or longitude show signal
            if (
                lat >= this.turnPoints[0].lat - 0.001 &&
                lat <= this.turnPoints[0].lat + 0.001 &&
                long >= this.turnPoints[0].lng - 0.001 &&
                long <= this.turnPoints[0].lng + 0.001
            ) {
                if (this.directionWords[0].indexOf("left") !== -1) {
                    this.left = true;
                    this.right = false;
                    this.straight = false;
                    this.vibrator.vibrate(3000);
                } else if (this.directionWords[0].indexOf("right") !== -1) {
                    this.right = true;
                    this.left = false;
                    this.straight = false;
                    this.vibrator.vibrate(3000);
                } else if (this.directionWords[0].indexOf("straight") !== -1) {
                    this.straight = true;
                    this.right = false;
                    this.left = false;
                } else {
                    this.left = false;
                    this.right = false;
                    this.straight = false;
                }
            } else {
                // This is only for demo purposes
                if (this.directionWords[0].indexOf("left") !== -1) {
                    this.left = true;
                    this.right = false;
                    this.straight = false;
                } else if (this.directionWords[0].indexOf("right") !== -1) {
                    this.right = true;
                    this.left = false;
                    this.straight = false;
                } else if (this.directionWords[0].indexOf("straight") !== -1) {
                    this.straight = true;
                    this.right = false;
                    this.left = false;
                } else {
                    this.left = false;
                    this.right = false;
                    this.straight = false;
                }
            }

            // if the user location is within .0001 degrees show next direction
            if (
                lat >= this.turnPoints[0].lat - 0.0003 &&
                lat <= this.turnPoints[0].lat + 0.0003 &&
                long >= this.turnPoints[0].lng - 0.0003 &&
                long <= this.turnPoints[0].lng + 0.0003
            ) {
                this.directionWords.shift();
                this.directionDistances.shift();
                this.turnPoints.shift();
            }
        }
        // fail safe for two consecutive turns
        if (this.turnPoints.length) {
            // if the user's position is within .0001 latitude or longitude show signal
            if (
                lat >= this.turnPoints[1].lat - 0.001 &&
                lat <= this.turnPoints[1].lat + 0.001 &&
                long >= this.turnPoints[1].lng - 0.001 &&
                long <= this.turnPoints[1].lng + 0.001
            ) {
                if (this.directionWords[1].indexOf("left") !== -1) {
                    this.left = true;
                    this.right = false;
                    this.straight = false;
                    this.vibrator.vibrate(3000);
                } else if (this.directionWords[1].indexOf("right") !== -1) {
                    this.right = true;
                    this.left = false;
                    this.straight = false;
                    this.vibrator.vibrate(3000);
                } else if (this.directionWords[1].indexOf("straight") !== -1) {
                    this.straight = true;
                    this.right = false;
                    this.left = false;
                } else {
                    this.left = false;
                    this.right = false;
                    this.straight = false;
                }
            }

            // if the user location is within .0001 degrees show next direction
            if (
                lat >= this.turnPoints[1].lat - 0.0003 &&
                lat <= this.turnPoints[1].lat + 0.0003 &&
                long >= this.turnPoints[1].lng - 0.0003 &&
                long <= this.turnPoints[1].lng + 0.0003
            ) {
                this.directionWords = this.directionWords.slice(2);
                this.directionDistances = this.directionWords.slice(2);
                this.turnPoints = this.turnPoints.slice(2);
            }
        }
    }

    /**
     * Function that triggers monitoring of movement and sets up function calls for
     * each time the location is checked. Each interval the current location, speed, 
     * bearing, and distance are updated. The new coordinates and bearing are then used
     * to update the polyline on the map and recenter the map's view to the user's new
     * location.
     */
    drawUserPath(): void {
        insomnia.keepAwake().then(function() {
            console.log("Insomnia is active");
        });

        this.watchId = geolocation.watchLocation(
            (loc) => {
                const newPath = new mapsModule.Polyline();
                if (
                    (loc && this.mapView !== null) ||
                    (loc && this.mapView !== undefined)
                ) {
                    this.currentSpeed = loc.speed * 2.23694;
                    this.speedString = this.currentSpeed
                        .toFixed(1)
                        .slice(0, -2);
                    this.speedStringDecimal = this.currentSpeed
                        .toFixed(1)
                        .slice(-1);

                    if (this.currentSpeed > topSpeedHolder) {
                        topSpeedHolder = this.currentSpeed;
                    }
                    if (
                        this.currentSpeed < 4 &&
                        this.allSpeeds[this.allSpeeds.length - 1] > 10
                    ) {
                        this.onPinSelect("close");
                    }
                    this.allSpeeds.push(this.currentSpeed);
                    this.speed += loc.speed;
                    const lat = loc.latitude;
                    const long = loc.longitude;
                    this.checkForManeuver(lat, long);
                    if (this.newPathCoords.length === 0) {
                        this.newPathCoords.push([lat, long]);
                        this.mapView.latitude = lat;
                        this.mapView.longitude = long;
                        this.mapView.bearing = loc.direction;
                        // tslint:disable-next-line: max-line-length
                    } else if (
                        this.newPathCoords[this.newPathCoords.length - 1]
                            .lat !== lat &&
                        this.newPathCoords[this.newPathCoords.length - 1]
                            .long !== long
                    ) {
                        const lastLat = this.newPathCoords[
                            this.newPathCoords.length - 1
                        ].lat;
                        const lastLng = this.newPathCoords[
                            this.newPathCoords.length - 1
                        ].long;
                        if (this.newPathCoords.length > 2) {
                            this.totalDistance += this.calculateDistance(
                                lat,
                                long,
                                lastLat,
                                lastLng
                            );
                        }
                        this.distanceString = this.totalDistance
                            .toFixed(1)
                            .slice(0, -2);
                        this.distanceStringDecimal = this.totalDistance
                            .toFixed(1)
                            .slice(-1);

                        this.newPathCoords.push([lat, long]);
                        newPath.addPoint(
                            mapsModule.Position.positionFromLatLng(
                                lastLat,
                                lastLng
                            )
                        );
                        newPath.addPoint(
                            mapsModule.Position.positionFromLatLng(lat, long)
                        );
                        newPath.visible = true;
                        newPath.width = 10;
                        newPath.geodesic = false;
                        if (this.colorCount <= this.colorArray.length - 1) {
                            newPath.color = new Color(
                                this.colorArray[this.colorCount]
                            );
                            this.colorCount++;
                        } else if (
                            this.colorCount >
                            this.colorArray.length - 1
                        ) {
                            this.colorCount = 0;
                            newPath.color = new Color(
                                this.colorArray[this.colorCount]
                            );
                        }
                        // newPath.color = new Color("red");
                        if (this.mapView) {
                            this.mapView.addPolyline(newPath);
                        }
                        this.mapView.latitude = lat;
                        this.mapView.longitude = long;
                        this.mapView.bearing = loc.direction;
                    }
                }
            },
            (e) => {
                console.log("Error: " + e.message);
            },
            {
                desiredAccuracy: Accuracy.high,
                updateTime: 0,
                updateDistance: 0.1,
                minimumUpdateTime: 1000
            }
        );
        console.log("start", this.watchId, typeof this.watchId);
    }

    /**
     * Function called on interval to turn on the speech recognition. If 
     * key phrases are recognized and match text cues, functions will 
     * trigger. 
     */
    handleSpeech() {
        this.callCount++;
        // console.log("speech:", this.callCount, new Date());
        if (this.speechRecognition !== null) {
            this.speechRecognition
                .startListening({
                    // optional, uses the device locale by default
                    locale: "en-US",
                    // set to true to get results back continuously
                    returnPartialResults: false,
                    // this callback will be invoked repeatedly during recognition
                    onResult: (
                        transcription: SpeechRecognitionTranscription
                    ) => {
                        // console.log('Getting results');
                        this.zone.run(
                            () => (this.recognizedText = transcription.text)
                        );
                        if (
                            transcription.text.includes("speedometer") &&
                            this.recognized === false
                        ) {
                            this.recognized = true;
                            this.zone.run(() => {
                                this.onSpeedTap();
                            });
                            this.recognizedTimeoutId = setTimeout(() => {
                                this.recognized = false;
                                clearTimeout(this.recognizedTimeoutId);
                            }, 5000);
                        } else if (
                            transcription.text.includes("pothole") &&
                            this.recognized === false
                        ) {
                            this.recognized = true;
                            this.onPinSelect("pothole");
                            this.recognizedTimeoutId = setTimeout(() => {
                                this.recognized = false;
                                clearTimeout(this.recognizedTimeoutId);
                            }, 5000);
                        } else if (
                            transcription.text.includes("avoid") &&
                            this.recognized === false
                        ) {
                            this.recognized = true;
                            this.onPinSelect("avoid");
                            this.recognizedTimeoutId = setTimeout(() => {
                                this.recognized = false;
                                clearTimeout(this.recognizedTimeoutId);
                            }, 5000);
                        } else if (
                            transcription.text.includes("close call") &&
                            this.recognized === false
                        ) {
                            this.recognized = true;
                            this.onPinSelect("close");
                            this.recognizedTimeoutId = setTimeout(() => {
                                this.recognized = false;
                                clearTimeout(this.recognizedTimeoutId);
                            }, 5000);
                        } else if (
                            transcription.text.includes("zoom in") &&
                            this.recognized === false
                        ) {
                            this.recognized = true;
                            this.startZoom += 1;
                            this.mapView.zoom = this.startZoom;
                            this.recognizedTimeoutId = setTimeout(() => {
                                this.recognized = false;
                                clearTimeout(this.recognizedTimeoutId);
                            }, 3000);
                        } else if (
                            transcription.text.includes("zoom out") &&
                            this.recognized === false
                        ) {
                            this.recognized = true;
                            this.startZoom -= 1;
                            this.mapView.zoom = this.startZoom;
                            this.recognizedTimeoutId = setTimeout(() => {
                                this.recognized = false;
                                clearTimeout(this.recognizedTimeoutId);
                            }, 3000);
                        } else if (
                            transcription.text.includes("stop ride") &&
                            this.recognized === false
                        ) {
                            this.recognized = true;
                            this.zone.run(() => {
                                this.onStopTap();
                            });
                            this.recognizedTimeoutId = setTimeout(() => {
                                this.recognized = false;
                                clearTimeout(this.recognizedTimeoutId);
                            }, 5000);
                        } else if (
                            transcription.text.includes("lost") &&
                            this.recognized === false
                        ) {
                            this.recognized = true;
                            this.zone.run(() => {
                                this.onReroute();
                            });
                            this.recognizedTimeoutId = setTimeout(() => {
                                this.recognized = false;
                                clearTimeout(this.recognizedTimeoutId);
                            }, 5000);
                        }
                        this.zone.run(() => {
                            this.listen = false;
                        });
                    },
                    onError: (error) => {
                        this.zone.run(() => {
                            this.listen = false;
                        });
                        // - iOS: A 'string', describing the issue.
                        // - Android: A 'number', referencing an 'ERROR_*' constant from https://developer.android.com/reference/android/speech/SpeechRecognizer.
                        //            If that code is either 6 or 7 you may want to restart listening.
                    }
                })
                .then(
                    (started) => {
                        // console.log(`started listening`)
                        this.zone.run(() => {
                            this.listen = true;
                        });
                    },
                    (errorMessage) => {
                        // console.log(`Listen Error: ${errorMessage}`);
                        this.zone.run(() => {
                            this.listen = false;
                        });
                    }
                )
                .catch((error) => {
                    // same as the 'onError' handler, but this may not return if the error occurs after listening has successfully started (because that resolves the promise,
                    // hence the' onError' handler was created.
                    console.error("Where's the error", error);
                    this.zone.run(() => {
                        this.listen = false;
                    });
                });
        }
    }

    /**
     * Callback triggered when the Google Map has fully loaded. 
     * 
     * @param args - Instance of the Google map.
     */
    onMapReady(args) {
        this.mapView = args.object;
        this.mapView.setStyle(style);
        const line = polylineHolder;
    
        if (line !== undefined) {
            this.directedRide = true;
            const flightPlanCoordinates = decodePolyline(line);
            this.polyline = new mapsModule.Polyline();
            for (let i = 0; i < flightPlanCoordinates.length; i++) {
                const coord = flightPlanCoordinates[i];
                this.polyline.addPoint(
                    mapsModule.Position.positionFromLatLng(coord.lat, coord.lng)
                );
            }
        
            // let latLng = new com.google.android.gms.maps.model.LatLng(29.9688625, -90.0544055);
            // const decoded = com.google.maps.android.PolyUtil.decode(line);
            // com.google.maps.android.PolyUtil.isLocationOnEdge(latLng, decoded, true, 10e-1);

            this.destLat =
                flightPlanCoordinates[flightPlanCoordinates.length - 1].lat;
            this.destLng =
                flightPlanCoordinates[flightPlanCoordinates.length - 1].lng;
            this.polyline.visible = true;
            this.polyline.width = 10;
            this.polyline.geodesic = false;

            this.mapView.latitude = flightPlanCoordinates[0].lat;
            this.mapView.longitude = flightPlanCoordinates[0].lng;
            this.mapView.addPolyline(this.polyline);
        } else {
            this.directedRide = false;
        }

        this.mapView.mapAnimationsEnabled = true;
        this.startZoom = 18;
        this.mapView.zoom = 18;

        this.mapView.tilt = 10;
        this.mapView.gMap.setMyLocationEnabled(true);
        const uiSettings = this.mapView.gMap.getUiSettings();
        uiSettings.setMyLocationButtonEnabled(true);
        geolocation
            .getCurrentLocation({
                desiredAccuracy: Accuracy.high,
                maximumAge: 5000,
                timeout: 20000
            })
            .then((result) => {
                const marker = new mapsModule.Marker();
                // tslint:disable-next-line: max-line-length
              
                marker.position = mapsModule.Position.positionFromLatLng(
                    result.latitude,
                    result.longitude
                );
                this.mapView.addMarker(marker);
                this.mapView.latitude = result.latitude;
                this.mapView.longitude = result.longitude;
            })
            .catch((err) => {
                console.error("Get location error:", err);
            });
        this.drawUserPath();
        if (this.steps) {
            this.directionsParser();
        }
    }
}
