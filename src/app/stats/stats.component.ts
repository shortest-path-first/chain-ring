import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { HttpClient, HttpParams } from "@angular/common/http";
import { storedStats } from "./stats";
import { Observable } from "rxjs";

@Component({
    selector: "Stats",
    moduleId: module.id,
    templateUrl: "./stats.component.html"
})
export class StatsComponent implements OnInit {

    averageSpeed = 22;
    totalDistance = 1000;
    moneySaved = 90000;
    stationaryTime = 5;
    holder;
    readonly ROOT_URL = "https://a5589e8b.ngrok.io";

    storedStats: Observable<Array<storedStats>>;

    constructor(private http: HttpClient) {
        // Use the component constructor to inject providers.
        this.userTotalInfo();
    }
    ngOnInit(): void {
        // Init your component properties here.
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    userTotalInfo() {
        const name = "Franco";
        const params = new HttpParams().set("name", name);
        this.http.get<Array<storedStats>>(this.ROOT_URL + "/userTotals", { params }).subscribe((response) => {
            console.log(response);
            this.holder = response;
            const { avgSpeed, totalDistance, costSavings, stationaryTime } = this.holder;
            this.averageSpeed = avgSpeed;
            this.totalDistance = totalDistance;
            this.moneySaved = costSavings;
            this.stationaryTime = stationaryTime;
        }, (err) => {
            console.log(err.message);
        }, () => {
            console.log("completed");
        });
    }
}
