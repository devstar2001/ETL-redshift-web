/*tslint:disable*/
import { Injectable } from '@angular/core';
import {Http, Response, RequestOptions, Headers, URLSearchParams} from '@angular/http';
import {AppSettings} from '../../app.constant';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/observable/throw';


/*tslint:disable*/
@Injectable()
export class LoaderService {
  private apiUrl: string = AppSettings.API_ENDPOINT + '/loader';
  constructor(private http: Http){
  }

  /**
   * Get Loader list
   */
  getLoaders(): Observable<string> {
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.get(`${this.apiUrl}/api/LoaderList/`, options)
      .map(res => res.json())
      .do(res => {
          // console.log(res)
      })
      .catch(this.handleError);
  }

  /**
   *  Save Scheduling task Information
   */
  saveSchedule(sendData): Observable<any> {
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/api/loaderSchedule/`, sendData, options)
      .map(res => res.json())
      .do(res => {
        // console.log('here')
        // console.log(res)
      })
      .catch(this.handleError);
  }

  /**
   * Get CSV Raw Data
   * */
    getCSVRawData(postData):Observable<any>{
        let authToken = localStorage.getItem('api_auth_token');
        let headers = new Headers({ 'Accept': 'application/json' });
        headers.append('Authorization', `${authToken}`);
        let options = new RequestOptions({ headers: headers });
        return this.http.post(`${this.apiUrl}/api/GetCSVRaw/`,postData, options)
            .map(
                res => res.json()
            )
            .do(res => {
                // console.log(res)
            })
            .catch(this.handleError);

    }

    /**
     * Get Loader meta data
     * */
    getTransformHeaderData(bundleId): Observable<any> {
        let authToken = localStorage.getItem('api_auth_token');
        let headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Authorization', `${authToken}`);
        let options = new RequestOptions({ headers: headers });
        return this.http.get(`${this.apiUrl}/api/TransformHeaderData/?bundle_id=${bundleId}`, options)
            .map(
                res => res.json()
            )
            .do(res => {
                // console.log(res)
            })
            .catch(this.handleError);
    }

    /**
     * Get loader_Settings table data
     */
    getLoaderSettings(bundleId): Observable<any> {
        let authToken = localStorage.getItem('api_auth_token');
        let headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Authorization', `${authToken}`);
        let options = new RequestOptions({ headers: headers });
        return this.http.get(`${this.apiUrl}/api/LoaderSettings/?bundle_id=${bundleId}`, options)
            .map(
                res => res.json()
            )
            .do(res => {
                // console.log(res)
            })
            .catch(this.handleError);
    }

    /**
     * Save loader_settings table data
     */
    saveLoaderSettings(data): Observable<any> {
        let authToken = localStorage.getItem('api_auth_token');
        let headers = new Headers({ 'Content-Type': 'application/json' });
        headers.append('Authorization', `${authToken}`);
        let options = new RequestOptions({ headers: headers });
        return this.http.post(`${this.apiUrl}/api/LoaderSettings/`, data, options)
            .map(res => res.json())
            .do(res => {
                // console.log(res)
            })
            .catch(this.handleError);
    }


    /**
     * Delete loader_settings record
     */
    deleteLoaderSettings(bundleId): Observable<any> {
        let authToken = localStorage.getItem('api_auth_token');
        let headers = new Headers();
        // let headers = new Headers({ 'Content-Type': 'application/json' });
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Authorization', `${authToken}`);
        let options = new RequestOptions({ headers: headers });
        let urlSearchParams = new URLSearchParams();
        urlSearchParams.append('bundle_id',  bundleId);
        let body = urlSearchParams.toString()
        return this.http.post(`${this.apiUrl}/api/delete/`, body, options)
            .map(res => res.json())
            .do(res => {
                // console.log(res)
            })
            .catch(this.handleError);
    }

    /**
     * Copy loader and loader_settings record
     */
    copyLoaderSettings(bundleId): Observable<any> {
        let authToken = localStorage.getItem('api_auth_token');
        let headers = new Headers();
        // let headers = new Headers({ 'Content-Type': 'application/json' });
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Authorization', `${authToken}`);
        let options = new RequestOptions({ headers: headers });
        let urlSearchParams = new URLSearchParams();
        urlSearchParams.append('bundle_id',  bundleId);
        let body = urlSearchParams.toString()
        return this.http.post(`${this.apiUrl}/api/CopyLoader/`, body, options)
            .map(res => res.json())
            .do(res => {
                // console.log(res)
            })
            .catch(this.handleError);
    }

    /**
     * Stop Loader
     */
    // stopLoaderSettings(bundleId): Observable<any> {
    //     let authToken = localStorage.getItem('api_auth_token');
    //     let headers = new Headers();
    //     // let headers = new Headers({ 'Content-Type': 'application/json' });
    //     headers.append('Content-Type', 'application/x-www-form-urlencoded');
    //     headers.append('Authorization', `${authToken}`);
    //     let options = new RequestOptions({ headers: headers });
    //     let urlSearchParams = new URLSearchParams();
    //     urlSearchParams.append('bundle_id',  bundleId);
    //     let body = urlSearchParams.toString()
    //     return this.http.post(`${this.apiUrl}/api/StopLoader/`, body, options)
    //         .map(res => res.json())
    //         .do(res => {
    //             // console.log(res)
    //         })
    //         .catch(this.handleError);
    // }

  /**
   * Loader Validator
   */
  // getLoaderValidator(files, settingValues): Observable<string> {
  //   let authToken = localStorage.getItem('api_auth_token');
  //   let headers = new Headers();
  //   headers.append('Content-Type', 'application/x-www-form-urlencoded');
  //   headers.append('Authorization', `${authToken}`);
  //   let options = new RequestOptions({ headers: headers });
  //   let urlSearchParams = new URLSearchParams();
  //   urlSearchParams.append('data',  files.join());
  //   Object.keys(settingValues).forEach(function(key,index) {
  //           urlSearchParams.append(key,  settingValues[key]);
  //       });
  //   let body = urlSearchParams.toString()
  //
  //   return this.http.post(`${this.apiUrl}/api/MultipleFileToRedShiftValidate/`, body, options)
  //     .map(res => res.json())
  //     .do(res => {
  //         // console.log(res)
  //     })
  //     .catch(this.handleError);
  // }

    /**
     * Get Transform Filter with bundle_id
     */
    getTransformFilter(bundleId): Observable<any> {
        let authToken = localStorage.getItem('api_auth_token');
        let headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Authorization', `${authToken}`);
        let options = new RequestOptions({ headers: headers });

        return this.http.get(`${this.apiUrl}/api/TransformFilters/?bundle_id=${bundleId}`, options)
            .map(res => res.json())
            .do(res => {
                ////console.log(res)
            })
            .catch(this.handleError);
    }


    /**
     * Save Transform Filters
     */
    saveTransformFilters(bundleId, headersData): Observable<any> {
        let authToken = localStorage.getItem('api_auth_token');
        let headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Authorization', `${authToken}`);
        let options = new RequestOptions({ headers: headers });
        let urlSearchParams = new URLSearchParams();
        urlSearchParams.append('bundle_id',  bundleId);
        // let nwObj = {};
        // nwObj['headers'] = headersData;
        urlSearchParams.append('meta_data', JSON.stringify(headersData));
        let body = urlSearchParams.toString()
        return this.http.post(`${this.apiUrl}/api/TransformFilters/`, body, options)
            .map(res => res.json())
            .do(res => {
                // console.log(res)
            })
            .catch(this.handleError);
    }


    /**
     * Run Loader.
     */
    runLoader(bundleId): Observable<any> {
        let authToken = localStorage.getItem('api_auth_token');
        let headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Authorization', `${authToken}`);
        let options = new RequestOptions({ headers: headers });
        let urlSearchParams = new URLSearchParams();
        urlSearchParams.append('bundle_id',  bundleId);
        let body = urlSearchParams.toString()
        return this.http.post(`${this.apiUrl}/api/BundleTransform/`, body, options)
            .map(res => res.json())
            .do(res => {
                console.log(res)
            })
            .catch(this.handleError);
    }


  /**
   * Handle any errors from the API
   */
  private handleError(err) {
    let errMessage: string;

    if (err instanceof Response) {
      let body   = err.json() || '';
      let error  = body.error || JSON.stringify(body);
      errMessage = `${error}`;

    } else {
      errMessage = err.message ? err.message : err.toString();
    }


    return Observable.throw(errMessage);
  }

}
