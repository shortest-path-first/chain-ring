import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { registerElement } from "nativescript-angular/element-registry";
import * as app from "tns-core-modules/application";
var mapsModule = require("nativescript-google-maps-sdk");
const decodePolyline = require('decode-google-map-polyline');

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
        console.log('what the fuck')
    }

    onMapReady(args){
        console.log("map is ready");
        console.log(args);
        var mapView = args.object;
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
