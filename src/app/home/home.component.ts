import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { NavigationEnd, Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums";
import { knownFolders, Folder, File } from "tns-core-modules/file-system";
import {
    fromObject,
    fromObjectRecursive,
    Observable,
    PropertyChangeData
} from "tns-core-modules/data/observable";

@Component({
    selector: "Home",
    moduleId: module.id,
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit {
    vm = new Observable();
    documents: Folder = knownFolders.documents();
    folder: Folder = this.documents.getFolder(this.vm.get("src") || "src");
    file: File = this.folder.getFile(
        `${this.vm.get("token") || "token"}` + `.txt`
    );

    constructor(
        private router: Router,
        private routerExtensions: RouterExtensions
    ) {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        // get user locations
        geolocation.enableLocationRequest();
        geolocation
            .getCurrentLocation({
                desiredAccuracy: Accuracy.high,
                maximumAge: 5000,
                timeout: 20000
            })
            .then(result => {
                console.log(result);
            });
        for (let i = 0; i < 100; i++) {
            geolocation.clearWatch(i);
            clearInterval(i);
        }
        
        // save the token of the user
        this.file.readText().then(res => {
            this.vm.set("writtenContent", res);
            console.log("Response Token", res);
        });
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    onButtonLinkTap(navItemRoute: string): void {
        console.log("tapped");
        this.routerExtensions.navigate([navItemRoute], {
            transition: {
                name: "fade"
            }
        });
    }
}
