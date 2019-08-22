import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { HttpClient, HttpParams } from "@angular/common/http";
import { storedStats } from "./stats";
import { Observable } from "rxjs";
import { ActivatedRoute, Router, NavigationExtras } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import * as geolocation from "nativescript-geolocation";

@Component({
    selector: "Stats",
    moduleId: module.id,
    templateUrl: "./stats.component.html"
})
export class StatsComponent implements OnInit {
    displayedDuration;
    displayedAverageSpeed;
    displayedTotalDistance;
    speedBreakdown;
    moneySaved = 90000;
    stationaryTime = 5;
    statTotalHolder;
    // tslint:disable-next-line: max-line-length
    statRecentHolder;
    statHolder: Array<object> = [];
    notRecentView = true;
    recentView = false;

    pieSource: Array<{ Speed: string, Amount: number }> = [];

    readonly ROOT_URL = "https://6b409c5a.ngrok.io";

    storedStats: Observable<Array<storedStats>>;

    // tslint:disable-next-line: max-line-length
    constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute, private routerExtensions: RouterExtensions) {
        // Use the component constructor to inject providers.

        this.userTotalStats();
        this.userRecentStats();
        this.route.queryParams.subscribe((params) => {
         
            this.displayedAverageSpeed = params.average.toFixed(1);
            this.displayedTotalDistance = params.totalDistance;
            if (this.displayedTotalDistance.indexOf(".") !== -1) {
                const decimalIndex = this.displayedTotalDistance.indexOf(".");
                this.displayedTotalDistance.slice(0, decimalIndex + 1);
            }
            this.displayedDuration = this.durationParser(Number(params.duration));
            this.speedBreakdown = params.speedBreakdown;
            this.lastRideTap();
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

    userTotalStats() {
        const name = "Franco";
        const params = new HttpParams().set("name", name);
        this.http.get<Array<storedStats>>(this.ROOT_URL + "/userTotals", { params }).subscribe((response) => {
            this.statTotalHolder = response;
            const { avgSpeed, totalDistance, costSavings, stationaryTime, pieChart } = this.statTotalHolder;
            this.displayedAverageSpeed = avgSpeed;
            this.displayedTotalDistance = totalDistance;
            this.moneySaved = costSavings;
            this.stationaryTime = stationaryTime;
            this.pieSource = pieChart;
            this.displayedDuration = "5 Hours 16 minutes";

        }, (err) => {
            console.log(err.message);
        }, () => {
            console.log("completed");
        });
    }

    userRecentStats() {
        const name = "Franco";
        const params = new HttpParams().set("name", name);
        this.http.get<Array<storedStats>>(this.ROOT_URL + "/userStats", { params }).subscribe((response) => {
            this.statRecentHolder = response;
            this.statHolder = response;
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

    lastRideTap() {
        console.log("get last ride stats");
        this.notRecentView = true;
        this.recentView = false;
        this.displayedAverageSpeed = this.statRecentHolder[0].avgSpeed || null;
        this.displayedTotalDistance = this.statRecentHolder[0].totalDistance;
        this.moneySaved = this.statRecentHolder[0].costSavings;
        this.stationaryTime = this.statRecentHolder[0].stationaryTime;
        this.pieSource = this.statRecentHolder[0].pieChart;
        this.displayedDuration = "20 minutes";
    }

    recentRideTap() {
        console.log("get recent ride stats");
        this.notRecentView = false;
        this.recentView = true;
        this.displayedDuration = "20 minutes";
    }

    totalRideTap() {
        console.log("get total ride stats");
        this.notRecentView = true;
        this.recentView = false;
        this.displayedAverageSpeed = this.statTotalHolder.avgSpeed;
        this.displayedTotalDistance = this.statTotalHolder.totalDistance;
        this.moneySaved = this.statTotalHolder.costSavings;
        this.stationaryTime = this.statTotalHolder.stationaryTime;
        this.pieSource = this.statTotalHolder.pieChart;
        this.displayedDuration = "15 Hours 5 minutes";

    }
}
