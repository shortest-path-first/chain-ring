const globalAny: any = global;

import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { NavigationEnd, Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { request, getFile, getImage, getJSON, getString } from "tns-core-modules/http";
import { knownFolders, Folder, File } from "tns-core-modules/file-system";
import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";
// import { tnsOauthLogin } from "../../auth-service";

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
    incorrect = false;

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
                console.log(res);
                if(res){
                    this.vm.set("writtenContent", res);
                }
                if(res.indexOf("Bad") !== -1){
                    res = "";
                }
                const options = {
                    url: `http://3.17.64.34:3000/login/${res}`,
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                };
                request(options)
                    .then((isLoggedIn) => {
                        console.log(isLoggedIn.content.toJSON());
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
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.log(err.stack);
            });
    }

    onLoginTap(username, password): void {
        console.log("tapped");
        console.log("username", username);
        console.log("password", password);
        request({
            url: `http://3.17.64.34:3000/login`,
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
            if (response.statusCode === 200) {
                this.file
                    .writeText(
                        response.content
                            .toString()
                            .slice(
                                response.content
                                    .toString()
                                    .indexOf(":") + 1
                            )
                            .match(/[A-Z, 0-9]/gi)
                            .join("")
                    )
                    .then(() => this.file.readText())
                    .then(res => {
                        this.vm.set("writtenContent", res);
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
                    });
            } else {
                console.log("Wrong user name or password");
                this.incorrect = true;
            }
        });
}

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    signup(): void {
        this._activatedUrl = "/signup";
        this.routerExtensions.navigate(["/signup"], {
            transition: {
                name: "fade"
            }
        });
    }
}
