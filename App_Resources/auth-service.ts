import { configureTnsOAuth, TnsOAuthClient, ITnsOAuthTokenResult } from "nativescript-oauth2";
import {
  TnsOaProvider,
  TnsOaProviderOptionsGoogle,
  TnsOaProviderGoogle,
} from "nativescript-oauth2/providers";


let client: TnsOAuthClient = null;

export function configureOAuthProviders(){
  const googleProvider = configureOAuthProviderGoogle();
  configureTnsOAuth([googleProvider]);
} 

function configureOAuthProviderGoogle(){

  const googleProviderOptions: TnsOaProviderOptionsGoogle = {
    openIdSupport: 'oid-full',
    clientId: '742773304002-qm2pe9ohoeunucpuk5s9h5h3qbqm9bf0.apps.googleusercontent.com',
    redirectUri: 'com.googleusercontent.apps.742773304002-qm2pe9ohoeunucpuk5s9h5h3qbqm9bf0:/auth',
    urlScheme: 'com.googleusercontent.apps.742773304002-qm2pe9ohoeunucpuk5s9h5h3qbqm9bf0',
    scopes: ['email', 'profile', 'openid'],
  }
  const googleProvider = new TnsOaProviderGoogle(googleProviderOptions)
  return googleProvider;
}

export function tnsOauthLogin(providerType){
 client = new TnsOAuthClient(providerType);
  client.loginWithCompletion((tokenResult: ITnsOAuthTokenResult, error)=>{
    if(error){
      console.error("error loggin in:", error);
    } else {
      console.log(tokenResult); 
    }
  });
}