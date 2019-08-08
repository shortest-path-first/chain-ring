import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { registerElement } from "nativescript-angular/element-registry";
import * as app from "tns-core-modules/application";
import { HttpClient, HttpParams} from "@angular/common/http"
import { Place } from "./map";
import { Observable } from 'rxjs';





registerElement("MapView", () => require("nativescript-google-maps-sdk").MapView);


@Component({
    selector: "Map",
    moduleId: module.id,
    templateUrl: "./map.component.html"
})
export class MapComponent implements OnInit {

    latitude = 30
    longitude = -90.15
    zoom = 11

    readonly ROOT_URL = "https://7be0faec.ngrok.io"

    places: Observable<Place[]>;

    public searchBoxReturn(text) {

        console.log(text);

    }
    constructor(private http: HttpClient) {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        // Init your component properties here.

    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    getPlaces(text) {

        let params = new HttpParams().set('place', text);

        console.log(text)

        this.http.get<Place[]>(this.ROOT_URL + "/franco", {params}).subscribe(response => {
            //do something with response
            console.log(response);
        }, err => {
            console.log(err.message);
        }, () => {
            console.log("completed");
        })





    }

    
}
