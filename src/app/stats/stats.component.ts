import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { HttpClient, HttpParams } from "@angular/common/http";
import { storedStats } from "./stats";
import { Observable } from "rxjs";
import { ActivatedRoute, Router, NavigationExtras } from "@angular/router";
import * as geolocation from "nativescript-geolocation";


@Component({
    selector: "Stats",
    moduleId: module.id,
    templateUrl: "./stats.component.html"
})
export class StatsComponent implements OnInit {
    duration;
    averageSpeed;
    totalDistance;
    speedBreakdown;
    moneySaved = 90000;
    stationaryTime = 5;
    holder;

    readonly ROOT_URL = "https://5161accf.ngrok.io";

    storedStats: Observable<Array<storedStats>>;

    // tslint:disable-next-line: max-line-length
    constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute, private routerExtensions: RouterExtensions) {
        // Use the component constructor to inject providers.

        this.userTotalInfo();
        this.route.queryParams.subscribe((params) => {
         
            this.averageSpeed = params.average;
            this.totalDistance = params.totalDistance;
            if (this.totalDistance.indexOf(".") !== -1) {
                const decimalIndex = this.totalDistance.indexOf(".");
                this.totalDistance.slice(0, decimalIndex + 1);
            }
            this.duration = this.durationParser(Number(params.duration));
            this.speedBreakdown = params.speedBreakdown;
        });
    }
    ngOnInit(): void {
        // Init your component properties here.
        for(let i = 0; i < 100; i++){
            geolocation.clearWatch(i);
            clearInterval(i);
        }
    }
    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    durationParser(duration): string {
        let hours;
        let minutes;
        let seconds;
        let time = "";
        if (duration >= 3600) {
            hours = Math.floor(duration / 3600);
            seconds = duration % 3600;
            if (seconds >= 60) {
              minutes = Math.floor(seconds / 60);
              seconds = seconds % 60;
            }
        } else if (duration >= 60) {
          minutes = Math.floor(duration / 60);
          seconds = duration % 60;
        } else {
          seconds = duration;
        }
        if (hours === undefined) {
            hours = "0";
        }
        if (minutes === undefined) {
            minutes = "0";
        }
        if (minutes < 10) {
            minutes = `0${minutes}`;
        }
        if (seconds < 10) {
            seconds = `0${Math.floor(seconds)}`;
        } else {
            seconds = seconds.toFixed(0);
        }
        time = `${hours}:${minutes}:${seconds}`;
        console.log(time);
        return time;
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

    homeTap(navItemRoute: string): void {
        this.routerExtensions.navigate([navItemRoute], {
            transition: {
                name: "fade"
            }
        });
    }
}
