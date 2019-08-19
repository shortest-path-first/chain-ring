import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { FormsModule } from "@angular/forms";

import { LocationAddComponent } from "./locationAdd.component";

const routes: Routes = [
    { path: "", component: LocationAddComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes),
    FormsModule
    ],
    exports: [NativeScriptRouterModule]
})
export class LocationAddRoutingModule { }
