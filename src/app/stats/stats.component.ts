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
    pieChart = 5;
    readonly ROOT_URL = "https://2c7dbe02.ngrok.io";

    storedStats: Observable<Array<storedStats>>;

    constructor(private http: HttpClient) {
        // Use the component constructor to inject providers.
        this.placeHolder();
    }
    ngOnInit(): void {
        // Init your component properties here.
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    placeHolder() {
        console.log("yaaaaaaaaaaaaas");
    }

    userTotalInfo() {
        console.log("thats a more a ");
        
    }
}
