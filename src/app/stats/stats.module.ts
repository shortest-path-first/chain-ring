import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
// adding to allow http requests
import { HttpClientModule } from "@angular/common/http";

import { StatsRoutingModule } from "./stats-routing.module";
import { StatsComponent } from "./stats.component";
import { NativeScriptUIChartModule } from "nativescript-ui-chart/angular";


@NgModule({
    imports: [
        NativeScriptCommonModule,
        StatsRoutingModule,
        NativeScriptUIChartModule,
        HttpClientModule
    ],
    declarations: [
        StatsComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class StatsModule { }
