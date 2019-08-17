import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { NativeScriptUIChartModule } from "nativescript-ui-chart/angular";


import { StatsComponent } from "./stats.component";

const routes: Routes = [
    { path: "", component: StatsComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes),
    NativeScriptUIChartModule
    ],
    exports: [NativeScriptRouterModule]
})
export class StatsRoutingModule { }
