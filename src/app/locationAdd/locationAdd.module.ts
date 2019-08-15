import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { LocationAddRoutingModule } from "./locationAdd-routing.module";
import { LocationAddComponent } from "./locationAdd.component";
import { HttpClientModule } from "@angular/common/http";
import { NativeScriptFormsModule } from "nativescript-angular/forms";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        LocationAddRoutingModule,
        HttpClientModule,
        NativeScriptFormsModule
    ],
    declarations: [
        LocationAddComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class LocationAddModule { }
