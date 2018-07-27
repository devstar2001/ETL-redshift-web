/*tslint:disable*/
import { Injectable } from '@angular/core';
import {HttpEvent, HttpErrorResponse, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';


@Injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor() { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // console.log("intercepted request ... ");

// Clone the request to add the new header.
    const authReq = req.clone({ headers: req.headers.set("headerName", "headerValue")});

    // console.log("Sending request with new header now ...");

//send the newly created request
    return next.handle(authReq)
      .catch((error, caught) => {
//intercept the respons error and displace it to the console
//         console.log("Error Occurred");
//         console.log(error);
//return the error to the method that called it
        return Observable.throw(error);
      }) as any;
  }
}
