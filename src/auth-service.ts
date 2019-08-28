import { configureTnsOAuth, TnsOAuthClient, ITnsOAuthTokenResult } from "nativescript-oauth2";
import {
  TnsOaProvider,
  TnsOaProviderOptionsGoogle,
  TnsOaProviderGoogle
} from "nativescript-oauth2/providers";
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

let client: TnsOAuthClient = null;

export function configureOAuthProviders() {
  const googleProvider = configureOAuthProviderGoogle();
  configureTnsOAuth([googleProvider]);
}

function configureOAuthProviderGoogle() {

  const googleProviderOptions: TnsOaProviderOptionsGoogle = {
    openIdSupport: "oid-full",
    clientId: "742773304002-qm2pe9ohoeunucpuk5s9h5h3qbqm9bf0.apps.googleusercontent.com",
    redirectUri: "com.googleusercontent.apps.742773304002-qm2pe9ohoeunucpuk5s9h5h3qbqm9bf0:/auth",
    urlScheme: "com.googleusercontent.apps.742773304002-qm2pe9ohoeunucpuk5s9h5h3qbqm9bf0",
    scopes: ["email", "openid"]
  };
  const googleProvider = new TnsOaProviderGoogle(googleProviderOptions);

  return googleProvider;
}

export function tnsOauthLogin(providerType) {

  const vm = new Observable();
  const documents: Folder = knownFolders.documents();
  const folder: Folder = documents.getFolder(vm.get("src") || "src");
  const file: File = folder.getFile(`${vm.get("token") || "token"}` + `.txt`);

  client = new TnsOAuthClient(providerType);

  return new Promise((resolve, reject) => {
    client.loginWithCompletion(
        (tokenResult: ITnsOAuthTokenResult, error) => {
            if (error !== undefined) {
                console.error("error loggin in:", error);
                // (error);
            } else {
                console.log("Logged in", tokenResult.idTokenExpiration);
                console.log("Logged in", tokenResult.accessTokenExpiration);
                console.log(
                    "Logged in",
                    tokenResult.refreshTokenExpiration
                );

                const options = {
                    url: "http://3.17.64.34:3000/userInfo",
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    content: JSON.stringify({
                        accesstoken: tokenResult.accessToken,
                        idToken: tokenResult.idToken
                    })
                };
                request(options)
                    .then(result => {
                        console.log(
                            result.content
                                .toString()
                                .slice(
                                    result.content.toString().indexOf(":") +
                                        1
                                )
                                .match(/[A-Z, 0-9]/gi)
                                .join("")
                        );
                        // result.content.toFile("file:///src/token.txt");
                        file.writeText(
                            result.content
                                .toString()
                                .slice(
                                    result.content.toString().indexOf(":") +
                                        1
                                )
                                .match(/[A-Z, 0-9]/gi)
                                .join("")
                        )
                            .then(() => {
                                file.readText().then(res => {
                                    vm.set(
                                        "successMessage",
                                        `Successfully saved in${file.path}`
                                    );
                                    vm.set("writtenContent", res);
                                    vm.set("isItemVisible", true);

                                    // request({
                                    //     url: `http://3.17.64.34:3000/login/${res || "noexist"}`,
                                    //     method: "Patch",
                                    //     headers: {
                                    //         "Content-Type":
                                    //             "application/json"
                                    //     },
                                    //     content: JSON.stringify({
                                    //         token: res
                                    //     })
                                    // }).then(response => {
                                    //     console.log(
                                    //         response.content.toString()
                                    //     );
                                    //     resolve(response.content.toString());
                                    // });
                                });
                            })
                            .catch(err => {
                                console.log(err);
                            });
                    })
                    .catch(err => {
                        console.error("err", err.stack);
                    });
            }

            // return client;
        }
    );
  });
}
