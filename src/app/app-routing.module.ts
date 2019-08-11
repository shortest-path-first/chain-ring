import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

const routes: Routes = [
    { path: "", redirectTo: "/home", pathMatch: "full" },
    { path: "home", loadChildren: "~/app/home/home.module#HomeModule" },
    { path: "stats", loadChildren: "~/app/stats/stats.module#StatsModule" },
    { path: "login", loadChildren: "~/app/login/login.module#LoginModule" },
    { path: "map", loadChildren: "~/app/map/map.module#MapModule" },
    { path: "settings", loadChildren: "~/app/settings/settings.module#SettingsModule" },
    { path: "ride", loadChildren: "../app/ride/ride.module#RideModule"}
];
 
@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }
