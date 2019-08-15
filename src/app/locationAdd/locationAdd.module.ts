import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { LocationAddRoutingModule } from "./locationAdd-routing.module";
import { LocationAddComponent } from "./locationAdd.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        LocationAddRoutingModule
    ],
    declarations: [
        LocationAddComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class LocationAddModule { }
