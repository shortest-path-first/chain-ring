import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Commute } from "./commute";
import { Router, NavigationExtras } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";

let encodedPolyLine;
let user = "francoappss@gmail.com";

@Component({
    selector: "Commute",
    moduleId: module.id,
    templateUrl: "./commute.component.html"
})
export class CommuteComponent implements OnInit {

    latitude = 30;
    longitude = -90;

    locationList: Array<object> = [];

    homeLat;
    homeLng;

    workLat;
    workLng;

    readonly ROOT_URL = "https://d8345d7c.ngrok.io";

    // tslint:disable-next-line: max-line-length

    constructor(private http: HttpClient, private routerExtensions: RouterExtensions) {
        // Use the component constructor to inject providers.
        // this.locationList = this.locations;
    }

    ngOnInit(): void {
        // Init your component properties here.
        this.getUserLoc();
        this.getLocations(user);
    }

    getUserLoc() {
        geolocation.enableLocationRequest();
        geolocation.getCurrentLocation({ desiredAccuracy: Accuracy.high, maximumAge: 5000, timeout: 20000 })
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

    routeToRide(lat, lng) {
        console.log(lat, lng);
            // tslint:disable-next-line: max-line-length
        const params = new HttpParams().set("place", `${lat},${lng}`).set("userLoc", `${this.latitude},${this.longitude}`);
            // http request to get directions between user point and marker selected
        this.http.get<Array<Commute>>(this.ROOT_URL + "/mapPolyline", { params }).subscribe((response) => {
                // reassigns response to variable to avoid dealing with "<Place[]>"
                encodedPolyLine = response;
                const { polyLine } = encodedPolyLine;
                const param: NavigationExtras = {
                    queryParams: {
                        polyLine
                    }
                };
                this.routerExtensions.navigate(["/ride"], param);
                
            }, (err) => {
                console.log("error", err.message);
            }, () => {
                console.log("completed");
            });
    }

    getLocations(userEmail) {
        // tslint:disable-next-line: max-line-length
        const params = new HttpParams().set("userEmail", `${userEmail}`);
        // http request to get directions between user point and marker selected
        this.http.get<Array<Commute>>(this.ROOT_URL + "/locations", { params }).subscribe((response) => {
            // reassigns response to variable to avoid dealing with "<Place[]>"
            console.log(response);
            this.locationList = response;
        }, (err) => {
            console.log("error", err.message);
        }, () => {
            console.log("completed");
        });
    }
}
