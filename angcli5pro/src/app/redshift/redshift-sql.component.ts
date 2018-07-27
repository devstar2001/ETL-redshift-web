/*tslint:disable*/
import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {RedshiftService} from '../shared/services/redshift.service';
import {Sort} from '@angular/material';
import {ToastrService} from 'ngx-toastr';
import {SourceService} from '../shared/services/source.service';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';

@Component({
  selector: 'app-redshift-sql',
  templateUrl: './redshift-sql.component.html',
  styleUrls: ['./redshift-sql.component.css']

})
export class RedshiftSqlComponent implements OnInit {

  constructor(
    private redservice:RedshiftService,
    private sourceService:SourceService,
    private toastrService:ToastrService,
    private modalService:BsModalService

  ) { }

  getting;
  running;
  downloading = "";
  s3_folder="";
  s3_file = "";
  query="";
  raw_data;
  down_file_path;
  sample_sql_ready;
  sample_sql;
  tableList;
  sortedSourceData;
  selectedTableName;
  bundle_id;
  selectedRowIndex =-1;
  loading ;
  bucket;
  public modalRef: BsModalRef;



  ngOnInit() {
    this.getting = true
    this.loading = true
    this.bucket = localStorage.getItem('bucket')
    this.redservice.getAll().subscribe(
      data => {

        let t  = data[0] ;
        this.tableList = JSON.parse(t)['tables']
        this.getting = false
        this.loading = false
      },
      err=>{

        this.getting = false
        this.loading = false
      }
      );
  }
  gettingFiles = false;
  openSelectFileModal(template: TemplateRef<any>) {
    this.modal_folder_name = this.s3_folder
    let sendData = {source_path:this.s3_folder, bucket_name:this.bucket, mode:"flat"};
    this.gettingFiles=true;
    this.sourceService.getSources(sendData)
      .subscribe(
        data => {
          this.gettingFiles=false;
          this.folderlist = data.files;


        },
        err => {
          if ( err.indexOf('No such user') >=0)
          {
            this.toastrService.error("Your Token is expired.\n Please login again.")

          }
          if ( err.indexOf('were not provided.') >=0)
          {
            this.toastrService.error("Authentication failed.\n Please login again.")


          }
        }
      )
    this.modalRef = this.modalService.show(template, {class:'gray modal-lg'});
  }
  SelectedFolder(str){
    this.modal_folder_name = str;
  }
  setClickedRow = function(index){
    this.downloading = ""
    this.selectedRowIndex = index;
    this.selectedTableName = this.tableList[index].table_name;
    this.bundle_id = this.tableList[index].bundle_id;
    let sql = "SELECT * FROM " + this.tableList[index].schema  + "." + this.tableList[index].table_name
    // this.sample_sql_ready = "SELECT * FROM " + this.tableList[index].schema  + "." + this.tableList[index].table_name + " limit 20"
    this.query = sql;

    this.s3_file = this.tableList[index].table_name + ".csv"

    for (var i=0; i<this.tableList.length; i++ )
    {
      if (i==index)
        $('#radiobutton_' + i.toString() ).prop('checked', true);
      else
        $('#radiobutton_' + i.toString() ).prop('checked', false);
    }

  };

  PreviewSqlResult(){
    if (this.query.lastIndexOf("limit")>0)
      this.sample_sql = this.query
    else
      this.sample_sql = this.query + " limit 20"

    let send_data = {
      bundle_id:this.bundle_id,
      query:this.sample_sql,

    }
    this.raw_data = []
    this.table_headers=[]
    this.running = true
    this.redservice.previewSqlResult(send_data).subscribe(
      data=>{
      this.raw_data = data['sql_result']
      this.table_headers = data['table_headers']
      this.running = false
    },
      error2 => {
        this.running = false
      }
    )
  }
  modal_folder_name;
  folderlist;
  table_headers;
  selectedOneFileMethod(){
    this.s3_folder= this.modal_folder_name;
    this.modalRef.hide();
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  DownloadTable(){

    let send_data = {
      bundle_id:this.bundle_id,
      query:this.query,
      s3_folder:this.s3_folder,
      s3_file:this.s3_file,
      bucket_name:this.bucket
    }
    this.downloading = "running"
    this.getting = true
    this.redservice.downloadTable(send_data).subscribe(
      data=>  {
        if(data['state']!=undefined){
          this.toastrService.success(data['state'])
          this.bucket = data['bucket_name']

          this.down_file_path = data['down_file_path']
          this.downloading = "done"
          this.getting = false
        }
      },
      err=>{
        this.downloading = "failed"
        this.getting = false
      }
    );

  }

}

