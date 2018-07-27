/*tslint:disable*/
import {Component, Injectable, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {SourceService} from '../shared/services/source.service';
import {ToastrService} from 'ngx-toastr';
import {UserService} from '../shared/services/user.service';
import 'reflect-metadata';
// import {EditableTableService} from 'ng-editable-table';

@Component({
  templateUrl: './source-convert-pdf.component.html',
  styleUrls: ['../app.component.css'],

})

export class SourceConvertPdfComponent implements OnInit {
  constructor(
    private router:Router,
    private route:ActivatedRoute,
    private sourceService: SourceService,
    private toastrService: ToastrService,
    private userService:UserService,
    // public editableTableService:EditableTableService,
  ){
  }

  tableHeaders = ['Rename Header', 'String Matched Row Delete', 'Spilt Headers'];
  tableRowsWithId = [];
  dataType = ['Int','string', 'string', 'string'];

  //private variables:
  filename=''
  file_url=''
  all_page_counts
  isGettingInfo:boolean = false
  isConverting:boolean = false
  isTesting:boolean = false
  showEditWindow_flag:boolean = false
  username=""
  myTimer
  rename_headers:any
  split_headers:any
  cflag = 0
  instruction_flag=''
  job_id = ''
  process_percent =0
  process_page = 0
  task_state
  send_data:any
  date
  start_page=1
  end_page=20
  raw_data
  real_data
  testerror:boolean = false
  page_number=1
  del_row_str:any
  current_bucket;
  source_path;
  pdf_tasks=[];

  ngOnInit() {
    // this.pdf_tasks = [];
    // this.rename_headers=[]
    // this.split_headers=[]
    // this.isGettingInfo = true
    // let user_data_json = localStorage.getItem("api_user_data")
    // if(JSON.parse(user_data_json) != undefined)
    //   this.username = JSON.parse(user_data_json)["username"]
    //
    // this.route.queryParams.subscribe(params => {
    //   this.filename = params['file'];
    //   this.current_bucket = params['bucket'];
    //   this.source_path = params['source_path'];
    //
    // });
    // let send_data = {
    //   'bucket':this.current_bucket,
    //   'source_path':this.source_path,
    //   'file': this.filename,
    // }
    // this.sourceService.ValidateFileExisting(send_data)
    //   .subscribe(
    //     data=>{
    //       if (data.state == 'exist' || data.state=='downloaded'){
    //         this.getpdf()
    //         let pdf_tasks_json = localStorage.getItem("pdf_tasks")||''
    //         if (pdf_tasks_json !=''){
    //            this.pdf_tasks = JSON.parse(pdf_tasks_json);
    //            for( var i=0 ; i <this.pdf_tasks.length; i++ ){
    //              if (this.pdf_tasks[i].filename == this.filename){
    //                this.job_id = this.pdf_tasks[i].task_id;
    //                this.start_page = this.pdf_tasks[i].start_page;
    //                this.end_page = this.pdf_tasks[i].end_page;
    //              }
    //            }
    //
    //         }else {
    //           this.process_percent=0
    //           this.process_page=0
    //           this.task_state = 'Ready'
    //         }
    //
    //         this.ConvertPdf();
    //
    //
    //       }
    //     },
    //     err=>{
    //
    //     }
    //   )



  }

  // makeEditTableData(){
  //   if (this.rename_headers.length != 0){
  //     let temp = []
  //     for ( var i=0; i<this.rename_headers.length; i++){
  //       temp[0] = i+1
  //       temp[1] = this.rename_headers[i]
  //       temp[2] = ''
  //       temp[3] = this.split_headers[i]
  //
  //       // if (this.del_row_str[i] != undefined){
  //       //   temp[2] = this.del_row_str[i]
  //       // }
  //       this.tableRowsWithId[i] =temp
  //       temp=[]
  //
  //     }
  //   }
  // }



  // pdfview(){
  //   window.open(
  //     this.file_url, '_blank' // <- This is what makes it open in a new window.
  //   );
  //   window.focus()
  //
  // }
  // getpdf(){
  //   this.testerror = false
  //   this.isGettingInfo = true
  //   let send_data = {
  //     'file': this.filename,
  //     'page_number':this.page_number
  //   }
  //   this.sourceService.getPdfInfoServ(send_data)
  //     .subscribe(
  //       data =>{
  //         this.isGettingInfo = false
  //         this.file_url = data.file_url
  //         this.all_page_counts = data.all_page_counts
  //         this.page_number = data.page_number
  //         this.rename_headers = data.headers
  //         this.split_headers = data.headers
  //         this.raw_data = data.raw_data
  //         this.real_data = []
  //         this.SetDataEditableTable()
  //
  //       }, err=>{
  //         this.toastrService.error(err);
  //         this.isGettingInfo = false
  //       }
  //     )
  // }
  // ShowEditWindow(){
  //   if(this.showEditWindow_flag == true)
  //     this.showEditWindow_flag = false
  //   else
  //     this.showEditWindow_flag = true
  // }
  //
  //
  // testOnePage(){
  //   this.ExtractFromEditableTable()
  //   this.isTesting =true
  //   this.testerror = false
  //   let postData = {
  //     filename : this.filename,
  //     page_number:this.page_number,
  //     rename_headers:this.rename_headers,
  //     split_headers:this.split_headers ,
  //     del_row_str:this.del_row_str
  //   };
  //   this.sourceService.TestRealOnePge(postData).subscribe(
  //     data=>{
  //       this.isTesting =false
  //       this.real_data = data.real_data
  //       this.page_number = data.page_number
  //
  //     },err =>{
  //       this.testerror = true
  //       this.isTesting =false
  //       this.real_data = []
  //       this.toastrService.error(err)
  //
  //     }
  //   )
  // }

  // ExtractFromEditableTable(){
  //   // let rows = this.editableTableService.tableRowsObjects
  //   let temp = []
  //   let temp1 = []
  //   let temp2 = []
  //   for (var i =0; i< rows.length; i++){
  //
  //
  //     if (rows[i].cells[0].content != ''){
  //       temp[i] = rows[i].cells[0].content
  //     }
  //     if (rows[i].cells[1].content != ''){
  //       temp1[i] = rows[i].cells[1].content
  //     }
  //     if (rows[i].cells[2].content != ''){
  //       temp2[i] = rows[i].cells[2].content
  //     }
  //   }
  //   this.rename_headers = temp
  //   this.del_row_str = temp1
  //   this.split_headers = temp2
  // }
  //
  // ConvertPdf(){
  //
  //   this.ExtractFromEditableTable()
  //
  //   if (this.job_id == ""){
  //     if(this.myTimer == undefined)
  //       clearInterval(this.myTimer)
  //   }
  //   this.isConverting =true
  //   this.send_data = {
  //     'bucket':this.current_bucket,
  //     'source_path':this.source_path,
  //     'convert_flag': this.cflag,
  //     'filename':this.filename,
  //     'job':this.job_id,
  //     'del_row_str':this.del_row_str,
  //     'start_page':this.start_page,
  //     'end_page':this.end_page,
  //     'rename_headers':this.rename_headers,
  //     'split_headers':this.split_headers }
  //   this.date = new Date();
  //   // console.log(this.send_data)
  //   // console.log(JSON.stringify(this.send_data))
  //   this.sourceService.convertPdf(this.send_data)
  //     .subscribe(
  //       result_data =>{
  //         let result_object = JSON.parse(result_data)
  //         if (result_object.info != undefined){
  //           let result_info = JSON.parse(result_object.info)
  //           this.process_page = result_info.process_page
  //           this.process_percent = result_info.process_percent
  //         }
  //         this.task_state = result_object.state
  //         this.job_id = result_object.job
  //         if(result_object.convert_flag ==0)
  //         {
  //           // job no exist
  //           this.isConverting =false
  //           // if(this.myTimer)
  //           clearInterval(this.myTimer)
  //           this.cflag = 3
  //           localStorage.setItem("pdf_tasks","")
  //
  //         }
  //         if(result_object.convert_flag ==2)
  //         {
  //           // job exist
  //           this.isConverting =true
  //           this.myTimer = setInterval(() => {
  //             this.ConvertPdf();
  //           }, 5000);
  //           this.cflag = 4
  //
  //         }
  //         if(result_object.convert_flag ==3)
  //         {
  //           // job exist
  //           this.isConverting =true
  //           this.cflag = 4
  //           let pdf_task = {filename:this.filename,username:this.username, task_id:this.job_id, start_page:this.start_page, end_page:this.end_page}
  //           this.pdf_tasks.push(pdf_task)
  //           localStorage.setItem("pdf_tasks",JSON.stringify(this.pdf_tasks))
  //           this.myTimer = setInterval(() => {
  //             this.ConvertPdf();
  //           }, 5000);
  //
  //         }
  //         if(result_object.convert_flag ==4)
  //         {
  //           // job exist
  //           this.isConverting =true
  //           this.cflag = 4
  //
  //
  //         }
  //
  //
  //         if (result_object.state == 'STARTED')
  //         {
  //           this.toastrService.success(this.task_state)
  //
  //         }
  //
  //         if(result_object.state =='SUCCESS'){
  //           this.toastrService.success(this.task_state)
  //           this.isConverting = false
  //           this.process_percent=100
  //           this.process_page = this.end_page
  //           this.cflag = 3
  //           if(this.myTimer)
  //             clearInterval(this.myTimer)
  //           let lived_jobs =[];
  //           for(var i=0; i< this.pdf_tasks.length ; i++){
  //             if(this.pdf_tasks[i].task_id != this.job_id)
  //               lived_jobs.push(this.pdf_tasks[i])
  //           }
  //           this.pdf_tasks = lived_jobs
  //           localStorage.setItem("pdf_tasks",JSON.stringify(this.pdf_tasks))
  //           this.job_id=''
  //         }
  //
  //       }, err =>{
  //
  //
  //         console.log(err)
  //
  //         this.cflag=3
  //         this.task_state='Server error'
  //
  //         let lived_jobs =[];
  //          for(var i=0; i< this.pdf_tasks.length ; i++){
  //            if(this.pdf_tasks[i].task_id != this.job_id)
  //              lived_jobs.push(this.pdf_tasks[i])
  //          }
  //         this.pdf_tasks = lived_jobs
  //         localStorage.setItem("pdf_tasks",JSON.stringify(this.pdf_tasks))
  //         this.job_id=''
  //
  //         this.isConverting = false
  //         // if(this.myTimer)
  //         clearInterval(this.myTimer)
  //         if(err.toString().indexOf('No such user') > 0)
  //         {
  //           this.toastrService.error("Your Token is expired.\n Please login again.")
  //           this.userService.logout();
  //           this.router.navigate(['/signin']);
  //         }
  //       }
  //     )
  // }
  // StopConvertPdf(){
  //   // if(this.myTimer)
  //   clearInterval(this.myTimer)
  //   this.cflag=5
  //   // let send_data = {'convert_flag': this.convert_flag, 'filename':this.filename, 'job':this.job_id}
  //   this.ConvertPdf()
  //
  // }
  // ngOnDestroy() {
  //   // Will clear when component is destroyed e.g. route is navigated away from.
  //   clearInterval(this.myTimer);
  //   this.ClearEditTableTable()
  //
  //
  // }
  // SetDataEditableTable(){
  //   this.tableRowsWithId =[]
  //   this.editableTableService.tableRowsObjects=[]
  //   this.editableTableService.tableHeadersObjects=[]
  //   this.makeEditTableData()
  //   this.editableTableService.createTableWithIds(this.tableHeaders, this.tableRowsWithId, this.dataType);
  // }
  // ClearEditTableTable(){
  //   this.tableRowsWithId =[]
  //   this.editableTableService.tableRowsObjects=[]
  //   this.editableTableService.tableHeadersObjects=[]
  // }


}
