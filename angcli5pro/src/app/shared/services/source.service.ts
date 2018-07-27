import { Injectable } from '@angular/core';
import {Http, Response, RequestOptions, Headers} from '@angular/http';

import {AppSettings} from '../../app.constant';
import {Router} from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/observable/throw';
import {UserService} from './user.service';


/*tslint:disable*/
@Injectable()
export class SourceService {
  private apiUrl: string = AppSettings.API_ENDPOINT ;

  constructor(private router: Router,
              private userService:UserService,
              private http: Http){
  }
  /**
   * Remove Scraper by ID
   * */
  RemoveScraper(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/removeScraperbyid`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log('here')
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Get Schedule Detail
   * */
  GetSchedule(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/getschedulebyid`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log('here')
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Get Scrapers
   * */
  GetScrapers():Observable<any> {
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.get(`${this.apiUrl}/uploader/api/scraperlist/`, options)
      .map(res => res.json())
      .do(res => {
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Save Scraper
   * */
  Scraper_Save(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/savescraper`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log('here')
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Paste Filse
   * */
  PastFile(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/pastefiles`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log('here')
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Getting selected table data
   * */
  GetTableRawData(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/gettabledata`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log('here')
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * upload csv files extracted from web
   * */
  UploadToRS(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/uploadwebfiles`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log('here')
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Paste Filse
   * */
  MoveFile(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/movefiles`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log('here')
        // console.log(res)
      })
      .catch(this.handleError);
  }


  /**
   * Getting S3_key Lists
   */
  ExtractFromWeb(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);

    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/extractfromweb`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log('here')
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Getting S3_key Lists
   */
  getSources(sendData): Observable<any> {
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);

    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/list`, sendData, options)
      .map(res => res.json())
      .do(res => {
          // console.log('here')
          // console.log(res)
      })
      .catch(this.handleError);
  }

  /**
   * create bundle ID and create loader
   */

  loaderCreating(postData): Observable<any> {
      let authToken = localStorage.getItem('api_auth_token');
      let headers = new Headers({ 'Accept': 'application/json' });
      headers.append('Authorization', `${authToken}`);
      let options = new RequestOptions({ headers: headers });
      return this.http.post(`${this.apiUrl}/loader/api/LoaderCreating/`, postData, options)
          .map(res => res.json())
          .do(res => {
              // console.log(res)
          })
          .catch(this.handleError);
  }
  /**
   *   Convert pdf to csv file
   * */
  convertPdf(data):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/pdftocsv/`, data, options)
      .map(res => res.json())
      .do(res => {
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Validate file existing
   *  if file no exist then downlaod from s3
   * */
  ValidateFileExisting(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/validatefile/`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log(res)
      })
      .catch(this.handleError);
  }

  /**
   * Get pdf info
   */

  getPdfInfoServ(postData): Observable<any> {
      let authToken = localStorage.getItem('api_auth_token');
      let headers = new Headers({ 'Accept': 'application/json' });
      headers.append('Authorization', `${authToken}`);
      let options = new RequestOptions({ headers: headers });

      return this.http.post(`${this.apiUrl}/uploader/api/getpdfpage/`, postData, options)
          .map(res => res.json())
          .do(res => {
              // console.log(res)
          })
          .catch(this.handleError);
  }
  /**
   *
   *  Test Real one page
   * */
  TestRealOnePge(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });

    return this.http.post(`${this.apiUrl}/uploader/api/testpdfpage/`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Create New Bucket
   * */
  MakeBucket(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/makebucket/`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log(res)
      })
      .catch(this.handleError);
  }

  /**
   * Delete Selected Bucket
   * */
  DeleteBucket(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(`${this.apiUrl}/uploader/api/removebucket/`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Make New Folder
   * */
  MaKeFolder(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers })
    return this.http.post(`${this.apiUrl}/uploader/api/makefolder/`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Delete File or Folder
   * */
  RemoveFileAndFolder(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers })
    return this.http.post(`${this.apiUrl}/uploader/api/removefileandfolder/`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log(res)
      })
      .catch(this.handleError);
  }

  /**
   * Rename File or Folder
   * */
  RenameFileAndFolder(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers })
    return this.http.post(`${this.apiUrl}/uploader/api/renamefileandfolder/`, postData, options)
      .map(res => res.json())
      .do(res => {
        // console.log(res)
      })
      .catch(this.handleError);
  }
  /**
   * Download File or Folder
   * */
  DownloadFileAndFolder(postData):Observable<any>{
    let authToken = localStorage.getItem('api_auth_token');
    let headers = new Headers({ 'Accept': 'application/json' });
    headers.append('Authorization', `${authToken}`);
    let options = new RequestOptions({ headers: headers })
    return this.http.post(`${this.apiUrl}/uploader/api/downloadfileandfolder/`, postData, options)
      .map(res => res.json())
      .do(res => {
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
