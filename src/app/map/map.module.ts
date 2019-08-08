import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
// adding to allow http requests
import { HttpClientModule } from "@angular/common/http"



import { MapRoutingModule } from "./map-routing.module";
import { MapComponent } from "./map.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        MapRoutingModule,
        HttpClientModule    
    ],
    declarations: [
        MapComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})

export class MapModule { 
    constructor() {

    }
}
