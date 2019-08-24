import { Component, OnInit } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { DrawerTransitionBase, RadSideDrawer, SlideInOnTopTransition } from "nativescript-ui-sidedrawer";
import { filter } from "rxjs/operators";
import * as app from "tns-core-modules/application";
// import { configureOAuthProviders } from "../auth-service";
import * as imagepicker from "nativescript-imagepicker";
import { knownFolders, Folder, File } from "tns-core-modules/file-system";
import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";
import {
    request,
    getFile,
    getImage,
    getJSON,
    getString
} from "tns-core-modules/http";

@Component({
    moduleId: module.id,
    selector: "ns-app",
    templateUrl: "app.component.html"
})
export class AppComponent implements OnInit {
    showIcon = true;
    showProPic = false;
    imagePath = "";
    username = (global as any).username;

    private _activatedUrl: string;
    private _sideDrawerTransition: DrawerTransitionBase;

    constructor(
        private router: Router,
        private routerExtensions: RouterExtensions
    ) {
        // Use the component constructor to inject services
    }

    ngOnInit(): void {
        // configureOAuthProviders();
        console.log(this.username);
        this._activatedUrl = "/login";
        this._sideDrawerTransition = new SlideInOnTopTransition();

        this.router.events
            .pipe(filter((event: any) => event instanceof NavigationEnd))
            .subscribe(
                (event: NavigationEnd) =>
                    (this._activatedUrl = event.urlAfterRedirects)
            );
    }

    get sideDrawerTransition(): DrawerTransitionBase {
        return this._sideDrawerTransition;
    }

    isComponentSelected(url: string): boolean {
        return this._activatedUrl === url;
    }

    onNavItemTap(navItemRoute: string): void {
        this.routerExtensions.navigate([navItemRoute], {
            transition: {
                name: "fade"
            }
        });

        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.closeDrawer();
    }
    onDrawerIconTap(): void {
        const context = imagepicker.create({
            mode: "single" // use "multiple" for multiple selection
        });
        context
            .authorize()
            .then(() => {
                return context.present();
            })
            .then((selection) => {
                console.log("selected");
                selection.forEach((selected) => {
                    // process the selected image
                    this.imagePath = selected.android;
                    this.showProPic = true;
                    this.showIcon = false;
                    console.log("selected", selected);
                    // const name = file.substr(file.lastIndexOf("/") + 1);
                    // const session = bghttp.session(
                    //     "image-upload"
                    // );
                });
                // list.items = selection;
            })
            .catch((e) => {
                // process error
                console.log(e);
            });
    }

    logout(): void {
        const vm = new Observable();
        const documents: Folder = knownFolders.documents();
        const folder: Folder = documents.getFolder(vm.get("src") || "src");
        const file: File = folder.getFile(`${vm.get("token") || "token"}` + `.txt`);
        file.readText()
            .then((resp) => {
                console.log("Written token", resp);
                file.writeText("")
                    .then(() => file.readText())
                    .then((res) => {
                        vm.set("writtenContent", res);

                        request({
                            url: `http://ceabe4e9.ngrok.io/logout`,
                            method: "PATCH",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            content: JSON.stringify({
                                token: res
                            })
                        }).then(httpResponse => {
                            this.onNavItemTap("/login");
                        });
                });
            });
    }
}
