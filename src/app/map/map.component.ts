import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { registerElement } from "nativescript-angular/element-registry";
import * as app from "tns-core-modules/application";
import { HttpClient, HttpParams} from "@angular/common/http"
import { Place } from "./map";
import { Observable } from 'rxjs';

var mapsModule = require("nativescript-google-maps-sdk");

let actualMap

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
    markers = []

    readonly ROOT_URL = 'https://696a0775.ngrok.io'

    places: Observable<Place[]>;

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
        this.http.get<Place[]>(this.ROOT_URL + "/mapSearch", {params}).subscribe(response => {
            //do something with response
            this.markers = response
            this.markers.forEach((place) => {
                const {lat, lng} = place[0]
                console.log(lat, lng)
                let marker = new mapsModule.Marker({});
                    marker.position = mapsModule.Position.positionFromLatLng(lat, lng),
                    marker.title = place[1],
                    marker.snippet = place[2]
                
                actualMap.addMarker(marker)
                // marker.setMap(actualMap)
            })

            

        }, err => {
            console.log(err.message);
        }, () => {
            console.log("completed");
        })
    }

    onMapReady(args) {
        console.log(args);
        actualMap = args.object
        // actualMap = args.object
        
    }
}
