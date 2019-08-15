import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { LocationAddComponent } from "./locationAdd.component";

const routes: Routes = [
    { path: "", component: LocationAddComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class LocationAddRoutingModule { }
