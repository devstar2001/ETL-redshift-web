/*tslint:disable*/
import {Component, OnInit, TemplateRef} from '@angular/core';
import {LoaderService} from '../shared/services/loader.service';
import {TargetService} from '../shared/services/target.service';
import {Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {BsModalRef, BsModalService} from "ngx-bootstrap";
import {SourceService} from "../shared/services/source.service";
import {UserService} from "../shared/services/user.service";

@Component({
  templateUrl: './loader-settings.component.html',
  styleUrls: ['../app.component.css'],
  // styles: [``]
})
export class LoaderSettingComponent implements OnInit {
  constructor(
    private loaderService: LoaderService,
    private targetService: TargetService,
    private userService: UserService,
    private sourceService: SourceService,
    private modalService: BsModalService,
    private router: Router,
    private toastrService: ToastrService
  ) {
    // localStorage.setItem('loaderSettingsForm', JSON.stringify({}));
    this.optionsData = [{"key": "Big5", "value": "Big5"}, {"key": "Big5-HKSCS", "value": "Big5-HKSCS"},
      {"key": "CESU-8", "value": "CESU-8"}, {"key": "EUC-JP", "value": "EUC-JP"},
      {"key": "EUC-KR", "value": "EUC-KR"}, {"key": "GB18030", "value": "GB18030"},
      {"key": "GB2312", "value": "GB2312"}, {"key": "GBK", "value": "GBK"}, {"key": "IBM037", "value": "IBM037"},
      {"key": "IBM1026", "value": "IBM1026"}, {"key": "IBM918", "value": "IBM918"},
      {"key": "ISO-2022-CN", "value": "ISO-2022-CN"}, {"key": "ISO-2022-JP", "value": "ISO-2022-JP"},
      {"key": "ISO-2022-JP-2", "value": "ISO-2022-JP-2"}, {"key": "ISO-2022-KR", "value": "ISO-2022-KR"},
      {"key": "ISO-8859-1", "value": "ISO-8859-1"}, {"key": "ISO-8859-13", "value": "ISO-8859-13"},
      {"key": "ISO-8859-15", "value": "ISO-8859-15"},
      {"key": "ISO-8859-2", "value": "ISO-8859-2"}, {"key": "ISO-8859-3", "value": "ISO-8859-3"},
      {"key": "ISO-8859-4", "value": "ISO-8859-4"}, {"key": "ISO-8859-5", "value": "ISO-8859-5"},
      {"key": "ISO-8859-6", "value": "ISO-8859-6"}, {"key": "ISO-8859-7", "value": "ISO-8859-7"},
      {"key": "ISO-8859-8", "value": "ISO-8859-8"}, {"key": "ISO-8859-9", "value": "ISO-8859-9"},
      {"key": "JIS_X0201", "value": "JIS_X0201"}, {"key": "JIS_X0212-1990", "value": "JIS_X0212-1990"},
      {"key": "KOI8-R", "value": "KOI8-R"}, {"key": "KOI8-U", "value": "KOI8-U"}, {"key": "Shift_JIS", "value": "Shift_JIS"},
      {"key": "TIS-620", "value": "TIS-620"}, {"key": "US-ASCII", "value": "US-ASCII"}, {"key": "UTF-16", "value": "UTF-16"},
      {"key": "UTF-16BE", "value": "UTF-16BE"}, {"key": "UTF-16LE", "value": "UTF-16LE"}, {"key": "UTF-32", "value": "UTF-32"},
      {"key": "UTF-32BE", "value": "UTF-32BE"}, {"key": "UTF-32LE", "value": "UTF-32LE"}, {"key": "UTF-8", "value": "UTF-8"},
      {"key": "x-Big5-HKSCS-2001", "value": "x-Big5-HKSCS-2001"}, {"key": "x-MS950-HKSCS-XP", "value": "x-MS950-HKSCS-XP"},
      {"key": "x-mswin-936", "value": "x-mswin-936"}, {"key": "x-PCK", "value": "x-PCK"},
      {"key": "x-SJIS_0213", "value": "x-SJIS_0213"}, {"key": "x-UTF-16LE-BOM", "value": "x-UTF-16LE-BOM"},
      {"key": "X-UTF-32BE-BOM", "value": "X-UTF-32BE-BOM"}, {"key": "X-UTF-32LE-BOM", "value": "X-UTF-32LE-BOM"},
      {"key": "x-windows-50220", "value": "x-windows-50220"}, {"key": "x-windows-50221", "value": "x-windows-50221"},
      {"key": "x-windows-874", "value": "x-windows-874"}, {"key": "x-windows-949", "value": "x-windows-949"},
      {"key": "x-windows-950", "value": "x-windows-950"}, {"key": "x-windows-iso2022jpq", "value": "x-windows-iso2022jpq"}];
    this.delimitersOptions = [{"key": "Comma", "value": ","}, {"key": "Equals Sign", "value": "="},
      {"key": "Semicolon", "value": ";"}, {"key": "Space", "value": " "},  {"key": "Tab", "value": "tab"},
      {"key": "--Custom--", "value": "c"}];
  }

  gettingBundle: boolean = false;
  gettingTargets: boolean = false;
  gettingSchema: boolean = false;
  gettingFiles:boolean = false;
  gettingRawData:boolean = false;
  targetList;
  schemaList;

  find_flag: boolean = false;
  custom_selected: boolean = false;
  bundleId;

  optionsData;
  raw_data;
  csv_files;
  delimitersOptions;
  customDelimiter = "";
  loader_sett_form = {
    file : '',
    user_id: '',
    bundle_id: '',
    name: null,
    delimiter: ',',
    is_header: 1,
    sample_size: 50,
    encoding : 'UTF-8',
    table_name: '',
    redshift_id: '',
    strategy : 'Replace',
    schema_name: 'redshift_etl',
    skip_errors: 30,
    load_type:'file',
    folder:null,
    file_count:0
  }
  modal_file_name;
  public modalRef: BsModalRef;
  fileList: any;


  ngOnInit() {
    // console.log("<<<< loader-setting comp started >>>")
    this.bundleId = localStorage.getItem('bundleId')||'';
    // this.loader_sett_form.file = localStorage.getItem('selectedFile');
    this.gettingTargets = true;

    this.targetService.getTargets()
      .subscribe(
        data => {
          this.targetList = data;
          // if (data.length >0 && data[0].hasOwnProperty('user'))
          //   this.loader_sett_form.user_id = data[0].user;
          this.gettingTargets = false;
        },
        err => {
          // console.log('Error ' + err)
        }
      )
    if (this.bundleId !='' ) {
      this.gettingBundle = true;
      this.loaderService.getLoaderSettings(this.bundleId)
        .subscribe(
          data => {
            this.loader_sett_form.name = data.name;
            this.loader_sett_form.file = data.file;
            localStorage.setItem('selectedFile', data.file);

            this.loader_sett_form.bundle_id = this.bundleId;
            this.loader_sett_form.is_header = (data.is_header) ? 1 : 0;
            this.loader_sett_form.encoding = data.encoding || 'UTF-8';
            if (data.loader_type == 'folder'){

              this.loader_sett_form.load_type = 'folder' ;
              this.loader_sett_form.folder = data.folder ;
              this.loader_sett_form.file_count = data.file_count ;
            }

            if(data.strategy ==''){
              this.loader_sett_form.strategy = 'Replace';
              this.loader_sett_form.is_header = 1
            }
            else
              this.loader_sett_form.strategy = data.strategy;

            this.loader_sett_form.table_name = data.table_name;
            if(data.redshift != null)
              this.loader_sett_form.redshift_id = data.redshift;
            else
              this.loader_sett_form.redshift_id = '';
            if(data.sample_size != null)
              this.loader_sett_form.sample_size = data.sample_size;
            else
              this.loader_sett_form.sample_size = 50;
            if(data.skip_errors != null)
              this.loader_sett_form.skip_errors = data.skip_errors;
            else
              this.loader_sett_form.skip_errors = 30;
            this.loader_sett_form.schema_name = data.schema;
            if (data.delimiter =='') data.delimiter =','
            var find_index =100;
            for ( var i=0; i<this.delimitersOptions.length; i++){
              if(this.delimitersOptions[i]["value"] == data.delimiter)
              {
                this.loader_sett_form.delimiter = data.delimiter;
                this.find_flag = true;
                find_index = i;
              }
            }
            if (!this.find_flag)
            {
              this.custom_selected = true;
              this.customDelimiter = data.delimiter;
              this.loader_sett_form.delimiter = "c";
            }

            // console.log(this.customDelimiter);
            this.gettingBundle = false;
            this.targetChange();
          },
          err => {

            // console.log(err);
            this.router.navigate(['/sources']);

            let body   = err.json() || '';
            let error  = body.error || JSON.stringify(body);
            // if (error.details)
              // console.log(error.details)
          }
        )
    }
  }

  CreateLoaderSetting() {
    if(this.custom_selected)
      this.loader_sett_form.delimiter = this.customDelimiter;
    // console.log(this.loader_sett_form.delimiter);
    localStorage.setItem('selectedFile', this.loader_sett_form.file );
    localStorage.setItem('loader_type', this.loader_sett_form.load_type );

    this.loader_sett_form.is_header = (this.loader_sett_form.is_header) ? 1 : 0;
    this.loader_sett_form.bundle_id = this.bundleId;
    this.gettingBundle = true;
    this.loaderService.saveLoaderSettings(this.loader_sett_form)
      .subscribe(
        data => {
          this.toastrService.success('Loader Settings Saved.', 'Success');
          this.gettingBundle = false;
          this.router.navigate(['/loader/transforms']);
          // this.loaderData = data
        },
        err => {
          // console.log(err)
          this.gettingBundle = false;
        }
      )


  }
  ViewRaw(){
    this.gettingRawData = true
    let send_data = {
      bundle_id:this.bundleId,
      sample_size:this.loader_sett_form.sample_size,
      file:this.loader_sett_form.file
    }
    this.loaderService.getCSVRawData(send_data )
      .subscribe(
        data=>{
          this.gettingRawData = false
          this.raw_data = data.raw_data;
          this.csv_files = this.loader_sett_form.file

        },
        err => {

          this.toastrService.error('Server (backend) has error.');
          this.toastrService.error(err);
          // this.router.navigate(['/sources']);
          this.gettingRawData = false
        }
      )

  }
  targetChange(){
    // console.log(this.loader_sett_form.redshift_id)
    if (this.loader_sett_form.redshift_id == '' || this.loader_sett_form.redshift_id == null) return
    this.gettingTargets = true;
    this.targetService.getSchemas(this.loader_sett_form.redshift_id)
      .subscribe(
        data=>{
          this.gettingTargets = false;
          this.schemaList = data.schemas;
        },
        err=>{
          this.gettingTargets = false;
          this.schemaList=[];
          this.toastrService.error("No Schema exist.")
        }
      )
  }
  delimiterChanged($event) {
    if(this.loader_sett_form.delimiter == "c")
      this.custom_selected = true;
    else
      this.custom_selected = false;
  }

  public openSelectFileModal(template: TemplateRef<any>) {
    this.gettingFiles=true;
    this.modal_file_name = this.loader_sett_form.file;
    // let source_path = localStorage.getItem('source_path')
    // if (this.loader_sett_form.load_type =='folder')
    //   source_path = this.loader_sett_form.file.substr(0,this.loader_sett_form.file.lastIndexOf("/")+1)

    let sendData = {bundle_id : this.bundleId};

    this.sourceService.getSources(sendData)
      .subscribe(
        data => {
          this.gettingFiles=false;
          this.fileList = data.files;


        },
        err => {
          if ( err.indexOf('No such user') >=0)
          {
            this.toastrService.error("Your Token is expired.\n Please login again.")
            this.userService.logout();
            this.router.navigate(['/signin']);
          }
          if ( err.indexOf('were not provided.') >=0)
          {
            this.toastrService.error("Authentication failed.\n Please login again.")
            this.userService.logout();
            this.router.navigate(['/signin']);

          }
        }
      )
    this.modalRef = this.modalService.show(template, {class:'gray modal-lg'});
  }
  selectedOneFileMethod(){
    this.loader_sett_form.file = this.modal_file_name;
    this.modalRef.hide();
  }
  SelectedFile(str){
    this.modal_file_name = str;
  }
  public hideModal(): void {
    this.modalRef.hide();
  }

}
