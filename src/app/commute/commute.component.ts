import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { Commute } from "./commute";
import { Router, NavigationExtras } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import * as Obser from "tns-core-modules/data/observable";
import { knownFolders, Folder, File } from "tns-core-modules/file-system";

let directionsResponse;
let peterInfo;
const user = "francoappss@gmail.com";

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

    vm = new Obser.Observable();
    documents: Folder = knownFolders.documents();
    folder: Folder = this.documents.getFolder(this.vm.get("src") || "src");
    file: File = this.folder.getFile(
        `${this.vm.get("token") || "token"}` + `.txt`
    );

    readonly ROOT_URL = "http://ceabe4e9.ngrok.io";

    // tslint:disable-next-line: max-line-length

    constructor(
        private http: HttpClient,
        private routerExtensions: RouterExtensions
    ) {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        // Init your component properties here.
        this.getLocations();
        this.getUserLoc();
    }

    getUserLoc() {
        geolocation.enableLocationRequest();
        geolocation
            .getCurrentLocation({
                desiredAccuracy: Accuracy.high,
                maximumAge: 5000,
                timeout: 20000
            })
            .then(result => {
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
        const params = new HttpParams()
            .set("place", `${lat},${lng}`)
            .set("userLoc", `${this.latitude},${this.longitude}`);
        // http request to get directions between user point and marker selected
        this.http
            .get<Array<Commute>>(this.ROOT_URL + "/mapPolyline", { params })
            .subscribe((response) => {
                    // reassigns response to variable to avoid dealing with "<Place[]>"
                    directionsResponse = response;
                    const { polyLine, peterRide } = directionsResponse;
                    peterInfo = peterRide;
                    const parsedPeter = JSON.stringify(peterInfo);
                    const param: NavigationExtras = {
                        queryParams: {
                            polyLine,
                            parsedPeter
                        }
                    };
                    this.routerExtensions.navigate(["/ride"], param);
                },
                err => {
                    console.log("error", err.message);
                },
                () => {
                    console.log("completed");
                }
            );
    }

    getLocations() {
        // tslint:disable-next-line: max-line-length
        this.file.readText()
            .then((res) => {
                // tslint:disable-next-line: max-line-length
                const params = new HttpParams().set("token", `${res}`);
                this.http
                    .get<Array<Commute>>(this.ROOT_URL + "/location", { params })
                    .subscribe((response) => {
                        this.locationList = response;
                    },
                    (err) => {
                        console.log("error", err);
                    }
                    );
            });
    }

    addLocation() {
        const param: NavigationExtras = {
            queryParams: {
                user
            }
        };
        this.routerExtensions.navigate(["/locationAdd"], param);
    }

    homeTap(navItemRoute: string): void {
        this.routerExtensions.navigate([navItemRoute], {
            transition: {
                name: "fade"
            }
        });
    }
}
