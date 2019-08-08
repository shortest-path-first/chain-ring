import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { RideRoutingModule } from "./ride-routing.module";
import { RideComponent } from "./ride.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        RideRoutingModule
    ],
    declarations: [
        RideComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class RideModule { }
