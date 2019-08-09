import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { HttpClientModule } from "@angular/common/http"
import { RideRoutingModule } from "./ride-routing.module";
import { RideComponent } from "./ride.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        RideRoutingModule,
        HttpClientModule  
    ],
    declarations: [
        RideComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class RideModule { }
