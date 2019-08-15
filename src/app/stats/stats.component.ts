import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { HttpClient, HttpParams } from "@angular/common/http";
import { storedStats } from "./stats";
import { Observable } from "rxjs";
import { ActivatedRoute, Router, NavigationExtras } from "@angular/router";


@Component({
    selector: "Stats",
    moduleId: module.id,
    templateUrl: "./stats.component.html"
})
export class StatsComponent implements OnInit {
    duration;
    averageSpeed;
    totalDistance;
    moneySaved = 90000;
    stationaryTime = 5;
    holder;


    readonly ROOT_URL = "https://09b0a776.ngrok.io";


    storedStats: Observable<Array<storedStats>>;

    constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {
        // Use the component constructor to inject providers.

        this.userTotalInfo();
         this.route.queryParams.subscribe((params) => {
           console.log(params);
            this.averageSpeed = params.average;
            this.totalDistance = params.totalDistance.toFixed(1);
            this.duration = params.duration;
        });
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
