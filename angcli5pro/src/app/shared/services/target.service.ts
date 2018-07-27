import { Injectable } from '@angular/core';
import {Http, Response, RequestOptions, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {AppSettings} from '../../app.constant';

/*tslint:disable*/
@Injectable()
export class TargetService {
  private apiUrl: string = AppSettings.API_ENDPOINT;

  constructor(private http: Http){
  }

search(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i].id === nameKey) {
            return myArray[i];
        }
    }
}
  /**
   * Log the user in
   */
  getTargets(dbId = null): Observable<any> {
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);

    let options = new RequestOptions({ headers: headers });
    var that = this;
    return this.http.get(`${this.apiUrl}/redshift/api/redshiftdb/`, options)
      .map(res => {
        let aaa = res.json()
        if(typeof(dbId) != 'undefined' && dbId)
          {
            aaa = that.search(dbId, aaa)
          }
        return aaa
      })
      .do(function(res) {
      })
      .catch(this.handleError);
  }
      /**
       * Log the user in
       */
      getSchemas(target_Id): Observable<any> {
        let authToken = localStorage.getItem('api_auth_token');
        let headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Authorization', `${authToken}`);
        let options = new RequestOptions({ headers: headers });
        return this.http.get(`${this.apiUrl}/redshift/api/RedshiftSchema/?target_id=${target_Id}`, options)
          .map(res =>
            res.json()
          )
          .do(res =>{
            // console.log(res);
          })
          .catch(this.handleError);
      }

    /**
   * Log the user in
   */
  addDatabase(databaseConf): Observable<string> {
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);

    let options = new RequestOptions({ headers: headers });
    let userData = JSON.parse(localStorage.getItem('api_user_data'));
    databaseConf.user = typeof userData.id == 'undefined' ? '' : userData.id;
    return this.http.post(`${this.apiUrl}/redshift/api/redshiftdb/`, databaseConf, options)
      .map(res => res.json())
      .do(res => {
          // console.log(res)
      })
      .catch(this.handleError);
  }

      /**
   * Log the user in
   */
  editDatabase(db_id, databaseConf): Observable<string> {
    console.log(db_id)
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);

    let options = new RequestOptions({ headers: headers });
    let userData = JSON.parse(localStorage.getItem('api_user_data'));
    databaseConf.user = typeof userData.id == 'undefined' ? '' : userData.id;
    return this.http.put(`${this.apiUrl}/redshift/api/redshiftdb/${db_id}/`, databaseConf, options)
      .map(res => res.json())
      .do(res => {
          // console.log(res)
      })
      .catch(this.handleError);
  }

      /**
   * Log the user in
   */
  deleteTarget(db_id): Observable<string> {
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);

    let options = new RequestOptions({ headers: headers });
    return this.http.delete(`${this.apiUrl}/redshift/api/redshiftdb/${db_id}/`, options)
      .map(res => res.json())
      .do(res => {
          // console.log(res)
      })
      .catch(this.handleError);
  }

  /**
   * Log the user in
   */
  testConnection(db_id): Observable<any> {
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);

    let options = new RequestOptions({ headers: headers });
    let databaseConf = {};
     databaseConf['redshift_id'] = db_id;
    return this.http.post(`${this.apiUrl}/redshift/api/RedShiftDbTest/`, databaseConf, options)
      .map(res => res.json())
      .do(res => {
          // console.log(res)
      })
      .catch(this.handleError);
  }


      /**
   * Log the user in
   */
  loadToRedshift(files, redshift_id, table_name, is_header): Observable<string> {
    let authToken = localStorage.getItem('api_auth_token');
     let headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    let urlSearchParams = new URLSearchParams();
    files = JSON.parse(files);
    urlSearchParams.append('data',  files.join());
    urlSearchParams.append('redshift_id', redshift_id);
    urlSearchParams.append('table_name', table_name);
    urlSearchParams.append('is_header', is_header);
    let body = urlSearchParams.toString()
    return this.http.post(`${this.apiUrl}/loader/api/MultipleFileToRedShift/`, body, options)
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
