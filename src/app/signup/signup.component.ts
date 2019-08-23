const globalAny: any = global;

import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { NavigationEnd, Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import {
    request,
    getFile,
    getImage,
    getJSON,
    getString
} from "tns-core-modules/http";
import { knownFolders, Folder, File } from "tns-core-modules/file-system";
import {
    fromObject,
    fromObjectRecursive,
    Observable,
    PropertyChangeData
} from "tns-core-modules/data/observable";
// import { tnsOauthLogin } from "../../auth-service";

@Component({
    selector: "Login",
    moduleId: module.id,
    templateUrl: "./signup.component.html"
})
export class SignupComponent implements OnInit {
    vm = new Observable();
    documents: Folder = knownFolders.documents();
    folder: Folder = this.documents.getFolder(this.vm.get("src") || "src");
    file: File = this.folder.getFile(
        `${this.vm.get("token") || "token"}` + `.txt`
    );
    taken = false;

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
        this.file
            .readText()
            .then(res => {
                this.vm.set("writtenContent", res);
                console.log(res);
                const options = {
                    url: `http://ceabe4e9.ngrok.io/login/${res}`,
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                };

                request(options)
                    .then(isLoggedIn => {
                        console.log(isLoggedIn.content);
                        console.log("<===========>");
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
                    .catch(err => {
                        console.error(err);
                    });
            })
            .catch(err => {
                console.log(err.stack);
            });
    }

    onSignupTap(username, password): void {
        console.log("tapped");
        console.log("username", username);
        console.log("password", password);
        request({
            url: `http://ceabe4e9.ngrok.io/userInfo`,
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            content: JSON.stringify({
                username,
                password
            })
        }).then(response => {
            console.log(response.statusCode);
            if(response.statusCode === 201){
                console.log("logged in");
                console.log(response.content.toString());
                (global as any).username = username;
                console.log((global as any).username);
                this._activatedUrl = "/home";
                this.routerExtensions.navigate(["/home"], {
                    transition: {
                        name: "fade"
                    }
                });
            } else if (response.statusCode === 400){
                this.taken = true;
            }
        });
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    login(): void {
        this._activatedUrl = "/login";
        this.routerExtensions.navigate(["/login"], {
            transition: {
                name: "fade"
            }
        });
    }
}
