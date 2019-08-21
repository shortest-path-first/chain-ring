import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { NavigationEnd, Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { request, getFile, getImage, getJSON, getString } from "tns-core-modules/http";
import { knownFolders, Folder, File } from "tns-core-modules/file-system";
import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";
import { tnsOauthLogin } from "../../auth-service";

@Component({
    selector: "Login",
    moduleId: module.id,
    templateUrl: "./login.component.html"
})
export class LoginComponent implements OnInit {
    vm = new Observable();
    documents: Folder = knownFolders.documents();
    folder: Folder = this.documents.getFolder(this.vm.get("src") || "src");
    file: File = this.folder.getFile(`${this.vm.get("token") || "token"}` + `.txt`);

    private _activatedUrl: string;

    constructor(
        private router: Router,
        private routerExtensions: RouterExtensions
    ) {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        // Init your component properties here
        console.log("LOGIN");
        this.file.readText()
            .then((res) => {
                this.vm.set("writtenContent", res);
                console.log(res);
                const options = {
                    url: `http://812bec1b.ngrok.io/login/${res}`,
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                };

                request(options)
                    .then((isLoggedIn) => {
                        console.log(isLoggedIn.content);
                        if (isLoggedIn.content.toJSON().bool) {
                            console.log("Rerouting");
                            this._activatedUrl = "/home";
                            this.routerExtensions.navigate(["/home"], {
                                transition: {
                                    name: "fade"
                                }
                            });
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.log(err.stack);
            });
    }

    onLoginTap(): void {
        console.log("tapped");

        // this.file.readText()
        //     .then((res) => {
        //         this.vm.set("writtenContent", res);
        //         console.log(res);
        //         const options = {
        //             url: `http://812bec1b.ngrok.io/login/${res || "1234567"}`,
        //             method: "GET",
        //             headers: {
        //                 "Content-Type": "application/json"
        //             }
        //         };
            // setTimeout(() => {

            // tnsOauthLogin("google");

                // request(options)
                        // .then((isLoggedIn) => {
                            // console.log(isLoggedIn.content);
                            // if (isLoggedIn.content.toJSON().bool) {
                            //     console.log("Rerouting");
                            //     this._activatedUrl = "/home";
                            //     this.routerExtensions.navigate(
                            //         ["/home"],
                            //         {
                            //         transition: {
                            //             name: "fade"
                            //         }
                            //     }
                            //     );
                            // } else {
        console.log("Not signed in");

        tnsOauthLogin("google").then(() => {
                                    // if (isLoggedIn.content.toJSON().bool) {
                                    console.log("Rerouting This App!");
                                    this._activatedUrl = "/home";
                                    this.routerExtensions.navigate(["/home"], {
                                            transition: {
                                                name:
                                                    "fade"
                                            }
                                    });
                                    // }
                                })
                            // }
                        // })
                    .catch ((err) => {
                        console.error(err.stack);
                    });
                    // })
    // });
}

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }
}
