import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { HttpClientModule } from "@angular/common/http";

import { CommuteRoutingModule } from "./commute-routing.module";
import { CommuteComponent } from "./commute.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        CommuteRoutingModule,
        HttpClientModule
    ],
    declarations: [
        CommuteComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class CommuteModule { }
