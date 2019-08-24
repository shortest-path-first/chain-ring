import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

const routes: Routes = [
    { path: "", redirectTo: "/login", pathMatch: "full" },
    { path: "commute", loadChildren: "~/app/commute/commute.module#CommuteModule" },
    { path: "home", loadChildren: "~/app/home/home.module#HomeModule" },
    { path: "login", loadChildren: "~/app/login/login.module#LoginModule" },
    { path: "signup", loadChildren: "~/app/signup/signup.module#SignupModule" },
    { path: "map", loadChildren: "~/app/map/map.module#MapModule" },
    { path: "ride", loadChildren: "../app/ride/ride.module#RideModule"},
    { path: "settings", loadChildren: "~/app/settings/settings.module#SettingsModule" },
    { path: "stats", loadChildren: "~/app/stats/stats.module#StatsModule" },
    { path: "locationAdd", loadChildren: "~/app/locationAdd/locationAdd.module#LocationAddModule" }
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }
