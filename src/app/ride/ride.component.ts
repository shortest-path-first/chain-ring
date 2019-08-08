import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { registerElement } from "nativescript-angular/element-registry";
import * as app from "tns-core-modules/application";
import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums"; 

var mapsModule = require("nativescript-google-maps-sdk");
const decodePolyline = require('decode-google-map-polyline');
let mapView;


registerElement("MapView", () => require("nativescript-google-maps-sdk").MapView);

@Component({
    selector: "Ride",
    moduleId: module.id,
    templateUrl: "./ride.component.html"
})
export class RideComponent implements OnInit {
   
    constructor() {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        // Init your component properties here.
      
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
   
    }

    onPinTap(): void {
        console.log("Pin drop!")
       
        geolocation.getCurrentLocation({ desiredAccuracy: Accuracy.high, maximumAge: 5000, timeout: 20000 })
            .then((result) => {
                let marker = new mapsModule.Marker();
                marker.position = mapsModule.Position.positionFromLatLng(result.latitude, result.longitude);
                mapView.addMarker(marker);
            });
    }

    onMapReady(args){
        mapView = args.object;
        let line = "yd}uDhjsdPaBH@l@t@lZ|@r]ZpMDjDFl@IfAIRiB`AsElBaEpB{Ax@gAf@oB`AcBz@sFjCgLtF{G~CiB~@gAh@[TaBn@eAh@{BbAaHdD_EnBsAj@iCr@uAlAi@XgFdCaHhDiFdCaGrC}BfAcEjBmEvB{OnHs@^LlEl@jUFrB@`BExCOpBc@hCYhAa@dAgGjNIPUTOLa@PUDMHQ^?d@@F@F?j@CTCTMToDdIhE`C|@Xh@^p@Xx@L\\@h@Eb@U~@S"
        var flightPlanCoordinates = decodePolyline(line);
        
       const polyline = new mapsModule.Polyline();
       for (let i = 0; i < flightPlanCoordinates.length; i++){
           let coord = flightPlanCoordinates[i];
           polyline.addPoint(mapsModule.Position.positionFromLatLng(coord.lat, coord.lng));
       }
    

        polyline.visible = true;
        polyline.width = 10;
        polyline.geodesic = false;
        mapView.latitude = flightPlanCoordinates[0].lat;
        mapView.longitude = flightPlanCoordinates[0].lng;        
        mapView.zoom = 20;
        mapView.addPolyline(polyline);
        
    }
}
