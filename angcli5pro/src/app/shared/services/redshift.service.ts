
/*tslint:disable*/
import {Injectable} from '@angular/core';
import {AppSettings} from '../../app.constant';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {Headers, Http, RequestOptions, Response} from '@angular/http';
import {map, tap} from 'rxjs/operators';
import * as _ from 'lodash';


@Injectable()
export class RedshiftService {
  private apiUrl: string = AppSettings.API_ENDPOINT + '/redshift/api';

  constructor(private http: Http) {
  }
  /**
   * Get Table list
   */
  getAll(): Observable<string>
  {
    let url = this.apiUrl + "/tables/"
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Authorization', `${authToken}`);
    return this.http.get(url, {headers:headers })
      .pipe(
        map(data =>_.values(data)),
        tap(data=>console.log(data)));

  }

  downloadTable(sendData):Observable<string>
  {
    let url = this.apiUrl + "/sqltocsv/";
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(url, sendData,options)
      .map(res => res.json())
      .do(res => {
        // console.log('here')
        // console.log(res)
      })
      .catch(this.handleError);
  }

  previewSqlResult(sendData):Observable<string> {
    let url = this.apiUrl + "/sqlpreviewresult/";
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({headers: headers});
    return this.http.post(url, sendData, options)
      .map(res => res.json())
      .do(res => {
        // console.log('here')
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Handle any errors from the API
   */
  private handleError(err) {
    let errMessage: string;
    if (err instanceof Response) {
      // if(err.status == 403){
      //   localStorage.removeItem('api_auth_token');
      //   localStorage.removeItem('api_user_data');
      //
      // }

      let body   = err.json() || '';
      let error  = body.error || JSON.stringify(body);
      errMessage = `${err.statusText || ''} ${error}`;

    } else {
      errMessage = err.message ? err.message : err.toString();
    }
    return Observable.throw(errMessage);
  }

}
