import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { CommuteRoutingModule } from "./commute-routing.module";
import { CommuteComponent } from "./commute.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        CommuteRoutingModule
    ],
    declarations: [
        CommuteComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class CommuteModule { }
