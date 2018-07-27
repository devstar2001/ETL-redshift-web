import { Component, OnInit } from '@angular/core';
import { FileUploader } from 'ng2-file-upload';
import {AppSettings} from '../app.constant';
import {ToastrService} from 'ngx-toastr';
import {SourceService} from '../shared/services/source.service';

const URL = AppSettings.API_ENDPOINT + '/uploader/api/upload/';
/*tslint:disable*/
@Component({
	templateUrl: './source-add.component.html',
  styleUrls: ['../app.component.css'],
})
export class UserSourceAddComponent implements OnInit{
	authToken: string;
	bucket:string;
	source_path:string;
	public uploader:FileUploader;
	constructor(
	  // private toastrService: ToastrService,
    // private sourceService: SourceService,
  ){
		this.authToken = localStorage.getItem('api_auth_token');
    this.bucket = localStorage.getItem("bucket");
    this.source_path = localStorage.getItem("source_path");
		this.uploader = new FileUploader(
 {
			url: URL ,
    parametersBeforeFiles:true,
    additionalParameter:{bucket: this.bucket,source_path:this.source_path},
			// url: URL + 'uploading',
			filters: [{
				name: 'extension',
				fn: (item: any): boolean => {
					const fileExtension = item.name.slice(item.name.lastIndexOf('.') + 1).toLowerCase();
					return fileExtension === 'csv' || fileExtension === 'txt' || fileExtension === 'pdf';
				}
			}],
			method: 'POST',
			autoUpload: true,
			headers: [{
				name: 'Authorization',
				value : this.authToken
			}],
        }
    );
		this.uploader.onBuildItemForm = (item, form) => {
			this.uploader.queue.forEach((elem)=> {

			     elem.url = URL + elem.file.name;
			     console.log(elem.url);
			});
		};
    this.uploader.onErrorItem = function(item, response){
      let error:any
      if (JSON.parse(response.toString())!= undefined)
      {
        console.log("parse success.\n")
        if (JSON.parse(response.toString())['error'] != undefined){
          error = JSON.parse(response.toString())['error']
          console.log("error field exist.\n")
        }

      }
      alert(error)

    }

	}

	public hasBaseDropZoneOver:boolean = false;
	public hasAnotherDropZoneOver:boolean = false;

	public fileOverBase(e:any):void {
		this.hasBaseDropZoneOver = e;
	}
	ngOnInit() {
    console.log("<<<< source-add comp started >>>")

	}

}
