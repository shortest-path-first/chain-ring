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

@Component({
    selector: "Commute",
    moduleId: module.id,
    templateUrl: "./commute.component.html"
})
export class CommuteComponent implements OnInit {

    latitude = 30;
    longitude = -90;

    locationList: Array<object> = [];

    homeLat = 29.854655;
    homeLng = -90.055455;

    workLat = 29.951965;
    workLng = -90.070227;

    readonly ROOT_URL = "https://a5589e8b.ngrok.io";

    // tslint:disable-next-line: max-line-length
    locations = [{lat: 29.955727, lng: -90.120515, label: "Cane's Chicken Fingers"}, {lat: 29.9624226, lng: -90.042877, label: "Pizza Delicious"}];

    constructor(private http: HttpClient, private routerExtensions: RouterExtensions) {
        // Use the component constructor to inject providers.
        this.locationList = this.locations;
    }

    ngOnInit(): void {
        // Init your component properties here.
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
        console.log("cowabunga");
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
}
