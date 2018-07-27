/*tslint:disable*/
import {Component, EventEmitter, Injectable, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import { SourceService } from '../shared/services/source.service';
import {ActivatedRoute,Router, NavigationExtras} from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {UserService} from '../shared/services/user.service';


import {MatSelectionList, MatSelectionListChange, Sort} from '@angular/material';

import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {ContextMenuComponent, ContextMenuService} from 'ngx-contextmenu';
import { ClipboardService} from 'ngx-clipboard';




@Component({
  templateUrl: './source.component.html',
  styleUrls: ['./source.component.css'],
  providers:[ContextMenuService],

})


export class UserSourceComponent implements OnInit {
	constructor(
      private sourceService: SourceService,
      private router: Router,
      private route: ActivatedRoute,
      private userService: UserService,
      private toastrService: ToastrService,
      private clipboardService:ClipboardService,

      private modalService: BsModalService,


  ) {

    }

  @ViewChild(ContextMenuComponent) public basicMenu: ContextMenuComponent;
  @ViewChild(ContextMenuComponent) public headerMenu: ContextMenuComponent;
  public modalRef: BsModalRef;
  new_bucket_name;
  isCopied: boolean = false;
  buckets:any;
  user_root_folder:any ;
  mode='';
  sortedSourceData;

  selectedRowIndex =-1;

  @ViewChild(MatSelectionList) list1: MatSelectionList;
  @ViewChild(MatSelectionList) list2: MatSelectionList;

  bundleIDGetting = false;
  fileList;

  loadingData = true;
  username;
  source_path = '/';
  source_path_list;
  current_bucket;

  edit_mode = false;
  flat_mode = false;
  filter_mode = false;
  filter_string ='';
  folder_name ="";
  selectedFileName;
  new_file_or_name;
  edit_source;
  copied_full_path;
  copied_source_path;
  copied_file_name ='empty';
  copied_bucket_name;


  ngOnInit() {
    // console.log('<<<< Source comp started >>>');
    this.source_path = localStorage.getItem("source_path")||'/';
    if (this.source_path =='')
      this.source_path="/"
    this.current_bucket = localStorage.getItem("bucket")||'';
    const user_data_json = localStorage.getItem('api_user_data');
    if (JSON.parse(user_data_json) !== undefined) {
      this.username = JSON.parse(user_data_json)['username'];
    }

    this.user_root_folder = [{Name:this.username, selected:true}];

    this.func_getSourceList();

  }
  checkFolder(item: any): boolean {
    if (item.filename.substr(item.filename.length-1) =='/'){
      return false;
    }
    return true;
  }

  getIconClass(filename){
    if(filename.substr(filename.length-1) =='/'){
      return "fa fa-folder-o"
    }
    if(filename.substr(filename.length-3) =='pdf'){
      return "fa fa-file-pdf-o"
    }

    if(filename.substr(filename.length-3) =='txt'){
      return "fa fa-file-text-o"
    }
    if(filename.substr(filename.length-3) =='csv'){
      return "fa fa-file-excel-o"
    }
    if(filename.substr(filename.length-3) =='doc'){
      return "fa fa-file-word-o"
    }
    if(filename.substr(filename.length-3) =='zip' || filename.substr(filename.length-3) =='rar'
      || filename.substr(filename.length-3) =='.7z'  ){
      return "fa fa-file-excel-o"
    }
    return "fa fa-file-o"
  }

  CopyFiles(filename){
    this.copied_source_path = this.source_path;
    this.copied_file_name = filename;
    this.copied_bucket_name = this.current_bucket;
  }
  PastFiles(){
    let send_data = {
      copied_bucket : this.copied_bucket_name,
      copied_source_path : this.copied_source_path,
      copied_file_name : this.copied_file_name,
      bucket_name : this.current_bucket,
      source_path : this.source_path

    }
    this.loadingData = true;
    this.sourceService.PastFile(send_data).subscribe(
      data=>{
        if (data.state =='pasted'){
          this.func_getSourceList()
          this.copied_file_name='empty'
          this.toastrService.success('Pasted successfully.')
        }

      },
      err=>{

      }
    );
  }
  MoveFiles(){
    let send_data = {
      copied_bucket : this.copied_bucket_name,
      copied_source_path : this.copied_source_path,
      copied_file_name : this.copied_file_name,
      bucket_name : this.current_bucket,
      source_path : this.source_path

    }
    this.loadingData = true;
    this.sourceService.MoveFile(send_data).subscribe(
      data=>{
        if (data.state =='moved'){
          this.func_getSourceList()
          this.copied_file_name='empty'
          this.toastrService.success('Moved successfully.')
        }

      },
      err=>{

      }
    );
  }
  getFullPath(filename){

    if(this.flat_mode)
    {
      this.copied_full_path = filename;
      this.isCopied = true;
    }
    else{
      this.copied_full_path = this.source_path+filename;
      this.isCopied = true;
    }
    this.clipboardService.copyFromContent(this.copied_full_path);
    this.copyToClipboardMsg('Full Path');
  }
  EditMode_GetSources(e){
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) { //Enter keycode
      // console.log(this.edit_source)
      if (this.edit_source =='')
        this.edit_source="/"
      if(this.edit_source.substr(0,1) !='/')
        this.edit_source="/" + this.edit_source;
      if(this.edit_source.substr(this.edit_source.length-1) !='/')
        this.edit_source=this.edit_source+"/"
      if (this.source_path != this.edit_source )
      {
        this.source_path = this.edit_source;
        this.func_getSourceList();
      }
    }


  }
  onSelectedOptionsChange(event, item) {
    this.buckets.forEach( (bucket)=>{
      if(bucket.Name == item.Name){
        bucket.selected = true;
      }
      else
      {
        bucket.selected = false;
      }

    });
    item.selected = true;
    if(this.current_bucket != event.source.value){
      this.current_bucket = event.source.value;
      localStorage.setItem("bucket",this.current_bucket)
      this.source_path ='/';
      localStorage.setItem("source_path",this.source_path)
      this.func_getSourceList();
    }




  }
  onSelectedOptionsChange2(item) {
    this.list2.selectAll();

    // console.log(item);


  }
  setClickedRow = function(index){

    this.selectedRowIndex = index;
    this.selectedFileName = this.sortedSourceData[index].filename;
    this.new_file_or_name = this.selectedFileName;
  };
  sortSourceData(sort: Sort) {
    const data = this.fileList.slice();
    if (!sort.active || sort.direction == '') {
      this.sortedSourceData = data;
      return;
    }
    this.sortedSourceData = data.sort((a, b) => {
      let isAsc = sort.direction == 'asc';
      switch (sort.active) {
        case 'filename': return compare(a.filename, b.filename, isAsc);
        case 'created': return compare(a.created, b.created, isAsc);
        case 'size': return compareN(+a.size, +b.size, isAsc);
        case 'type': return compare(a.file_type, b.file_type, isAsc);
        case 'storage': return compare(a.storage_class, b.storage_class, isAsc);
        default: return 0;
      }
    });
  }
  folderOpen(selfilename) {
    if (this.loadingData === false && selfilename.indexOf('/') > 0)
    {
      this.source_path = this.source_path + selfilename;
      localStorage.setItem('source_path', this.source_path);
      this.func_getSourceList();
    }


  }
  pathTagsClick(counter){
    // console.log(this.source_path_list[counter]);
    let temp='';
    for (var i=0; i<counter+1; i++){
      temp = temp + this.source_path_list[i];
    }

    // console.log(temp);
    if(this.source_path != temp){
      this.source_path = temp;
      localStorage.setItem('source_path', this.source_path);
      this.func_getSourceList();
    }

  }

  func_getSourceList(){
    this.loadingData = true;
    let sendData = {
      mode:this.mode,
      filter:this.filter_string,
      source_path : this.source_path,
      bucket_name:this.current_bucket
    };
    this.sourceService.getSources(sendData)
      .subscribe(
        data => {

          this.fileList = data.files;
          this.selectedRowIndex = -1
          this.sortedSourceData = this.fileList.slice();
          if(data.buckets != undefined && data.bucket_name != undefined){
            this.buckets = data.buckets;
            this.current_bucket = data.bucket_name;
            this.buckets.forEach(function(bucket) {
              bucket.selected = false;
              if (bucket['Name'] == data.bucket_name)
                bucket.selected = true;
            });

          }
          else
          {
            this.current_bucket='';

          }
          localStorage.setItem("bucket",this.current_bucket)
          // this.layers = data.layers;
          this.loadingData = false;
          this.sortSourceData({active:'filename', direction:'desc'});
          let temp = this.source_path.split('/');
          this.source_path_list=[];
          for (var i=0; i< temp.length-1; i++){
            this.source_path_list[i] = temp[i]+'/';
          }


        },
        err => {
          this.loadingData = false;
          if ( err.indexOf('No such user') >=0)
          {
            this.toastrService.error('Your Token is expired.\n Please login again.');
            this.userService.logout();
            this.router.navigate(['/signin']);
          }
          if ( err.indexOf('were not provided.') >=0)
          {
            this.toastrService.error('Authentication failed.\n Please login again.');
            this.userService.logout();
            this.router.navigate(['/signin']);

          }
        }
      );
  }
  /**
   * show modal window
  * */
  public OpenNewModal(template: TemplateRef<any>) {

    this.modalRef = this.modalService.show(template, {class:'gray modal-lg'});
  }

  SourceToLoader() {
      // this.ng4LoadingSpinnerService.show();
    let file_name = this.selectedFileName;
    this.bundleIDGetting = true;
    if (this.flat_mode){
      let from = this.selectedFileName.lastIndexOf('/')
      let length =  this.selectedFileName.length - from;
      this.source_path = this.selectedFileName.substr(0, from+1)
      localStorage.setItem('source_path', this.source_path);
      file_name = this.selectedFileName.substr(from+1,length)
    }
    let send_data = {
      bucket:this.current_bucket,
      source_path:this.source_path,
      file:file_name
    }
    this.sourceService.loaderCreating(send_data)
      .subscribe(
      data => {
          // this.ng4LoadingSpinnerService.hide();
          this.bundleIDGetting = false;
          localStorage.setItem('selectedFile', file_name);
          localStorage.setItem('transformfilter_id', '0');
          localStorage.setItem('bundleId', data.bundle_id);
          if (data.state != undefined)
            this.toastrService.success(data.state)
          this.router.navigate(['/loader/settings']);
      }, err => {
          this.bundleIDGetting = false;
          // this.ng4LoadingSpinnerService.hide();
          // console.log('Error ' + err);
      }
    );
  }
  GoConvertPdf(){
    let file_name = this.selectedFileName;
    if (this.flat_mode){
      let from = this.selectedFileName.lastIndexOf('/')
      let length =  this.selectedFileName.length - from;
      this.source_path = this.selectedFileName.substr(0, from+1)
      localStorage.setItem('source_path', this.source_path);
      file_name = this.selectedFileName.substr(from+1,length)
    }

    let navigationExtras: NavigationExtras = {
      queryParams: {
        'bucket':this.current_bucket,
        'source_path':this.source_path,
        'file': file_name,
      }
    };

    this.router.navigate(['/sources/convert/pdf'],navigationExtras);
  }

  RefreshSources(){
    this.loadingData=true;
    this.func_getSourceList();
  }

  CalcSize(n){
	  if (n == NaN)
	    return '';
    if (n < 1025)
      return String(n)+'B';
    if (n < 1024*1024+1)
    {
      var s = n/1024;
      return String(s.toFixed(2)) + 'KB';
    }
    if (n < 1024*1024*1024+1)
    {
      var s = n/(1024*1024);
      return String(s.toFixed(2)) + 'MB';
    }
  }
  //-------------icon button control---------
  OnEditButton(){
    if (this.edit_mode)
      this.edit_mode = false;
    else
    {
      this.edit_source = this.source_path
      this.edit_mode = true;
    }

  }

  OnEditStyle(){
    if (this.edit_mode){
      return 'rgba(20, 154, 56, 0.58)';
    }
    else
    {
      return 'transparent';
    }
  }
  OnFlateStyle(){
    if (this.flat_mode){
      return 'rgba(20, 154, 56, 0.58)';
    }
    else
    {
      return 'transparent';
    }
  }

  SetBtnStyle(){
    if(this.selectedRowIndex == -1)
      return 'transparent';
    else
      return '#ccc';
  }
  SetRenameBtnStyle(){
    if(this.selectedRowIndex == -1 || this.flat_mode)
      return 'transparent';
    else
      return '#ccc';
  }
  SetPDFBtnStyle(){
    if(this.selectedRowIndex == -1 || this.selectedFileName.substr(this.selectedFileName.length-3) !='pdf')
      return 'transparent';
    else
      return '#ccc';
  }
  SetOnlyFileBtnStyle(){
    if(this.selectedRowIndex == -1 || this.selectedFileName.substring(this.selectedFileName.length-1) =='/')
      return 'transparent';
    else
      return '#ccc';
  }
  SetOnlyCSVFileBtnStyle(){
    // if(this.selectedRowIndex == -1 || this.selectedFileName.substring(this.selectedFileName.length-1) =='/' || this.selectedFileName.substring(this.selectedFileName.length-3) =='pdf')
    if(this.selectedRowIndex != -1 && !(this.selectedFileName.substring(this.selectedFileName.length-3) =='txt' || this.selectedFileName.substring(this.selectedFileName.length-3) =='csv') && this.selectedFileName.substring(this.selectedFileName.length-1) !='/')
      return 'transparent';
    else
      return '#ccc';
  }
  OnFilterStyle(){
    if (this.filter_mode){
      return 'rgba(20, 154, 56, 0.58)';
    }
    else
    {
      return 'transparent';
    }
  }
  OnFlateButton_Click(){
      this.flat_mode = !this.flat_mode;
      if (this.flat_mode){
        // this.source_path = '/';
        this.mode='flat';
        this.func_getSourceList();
      }else
      {
        this.mode = ""
        this.func_getSourceList();
      }

  }



  copyToClipboardMsg(str) {
    if (str == 'Path') this.isCopied = true;
    this.toastrService.success('Copied ' + str + ' to clipboard', 'Success!');
  }
  public hideModal(): void {
    this.modalRef.hide();
  }
  SaveFilterString(){
    this.modalRef.hide();
    // console.log(this.filter_string);
    if (this.filter_string == '') {
      this.filter_mode = false;
      this.func_getSourceList();
    }
    else
    {
      this.filter_mode = true;
      this.func_getSourceList();
    }

  }
  //----------bucket button control----------
  CreateBucket(){
    this.modalRef.hide()
    let send_data ={new_bucket_name:this.new_bucket_name}
    this.loadingData = true
    this.sourceService.MakeBucket(send_data).subscribe(
      data => {
        this.loadingData = false
        if(data.state!=undefined){
          if (data.state == "created"){
            if(data.buckets!=undefined && data.bucket_name!=undefined){
              this.buckets = data.buckets;
              this.toastrService.success("Created a Bucket '"+ data.bucket_name + "' Successfully." )
            }
          }
          if (data.state == "no admin"){
            this.toastrService.error("You don't have authorize.")
          }
          if (data.state == "exist"){
            this.toastrService.error("Bucket '"+data.bucket_name+ "' already exist.")
          }
        }

          },
      err =>{
        this.loadingData = false;
        // console.log(err)
        this.toastrService.error("Bucket creating failed.")
        }
      );

  }
  OnDeleteBucket(){
    this.modalRef.hide()
    // console.log(this.current_bucket)
    this.loadingData = true;

    let sendata={"del_bucket_name":this.current_bucket}
    this.sourceService.DeleteBucket(sendata).subscribe(
      data=>{
        this.loadingData = false
        if(data.state!=undefined){
          if (data.state == "deleted"){
            if(data.buckets!=undefined && data.bucket_name!=undefined){
              this.buckets = data.buckets;
              this.toastrService.success("Deleted a Bucket '"+ data.bucket_name + "' Successfully." )
            }
          }
          if (data.state == "no admin"){
            this.toastrService.error("You don't have authorize.")
          }
          if (data.state == "exist"){
            this.toastrService.error("Bucket '"+data.bucket_name+ "' no exist.")
          }
        }

      },
      err =>{
        this.loadingData = false;
        // console.log(err)
        this.toastrService.error("Bucket deleting failed.")
      }
    )

  }
  //----------file and folder control---------
  OnMaKeFolder(){
    // console.log(this.folder_name)
    this.modalRef.hide()
    this.loadingData;
    this.loadingData = true;
    let senddata={"new_folder_name":this.folder_name,
      "bucket_name":this.current_bucket,
      "source_path":this.source_path}
    this.sourceService.MaKeFolder(senddata).subscribe(
      data=>{
        this.loadingData = false;
        if(data.state!=undefined) {
          if (data.state == "made") {
            this.toastrService.success("Making new folder '" + this.folder_name + "' successfully.")
            this.RefreshSources();

          }
        }
      },
      err=>{
        this.loadingData = false;
        // console.log(err)
        this.toastrService.error("Folder making failed.")
      }
    )
  }
  OnDeleteFileAndFolder(){
    // console.log(this.folder_name)
    this.modalRef.hide()
    this.loadingData = true;
    let send_data = {source_path:this.source_path, del_file_or_folder_name:this.selectedFileName, bucket_name:this.current_bucket}
    this.sourceService.RemoveFileAndFolder(send_data).subscribe(
      data=>{
        if(data.state!=undefined){
          this.toastrService.success(data.state)
          this.RefreshSources();
        }
      },
      err =>{
        this.loadingData = false
      }
    )

  }
  OnRenameFileAndFolder(){
    // console.log(this.new_file_or_name)
    this.modalRef.hide()
    if (this.selectedFileName.substr(this.selectedFileName.length-1, 1) =='/')
      if (this.new_file_or_name.substr(this.new_file_or_name.length-1,1)!='/')
        this.new_file_or_name = this.new_file_or_name + "/"
    this.loadingData = true;
    let send_data = {source_path:this.source_path, old_file_or_folder_name:this.selectedFileName,
      new_file_or_folder_name:this.new_file_or_name, bucket_name:this.current_bucket};
    // console.log(send_data);
    this.sourceService.RenameFileAndFolder(send_data).subscribe(
      data=>{
        if(data.state!=undefined){
          this.toastrService.success(data.state)
          this.RefreshSources();
        }
      },
      err=>{
        this.loadingData = false
      }
    )
  }
  OnDownloadFileAndFolder(){
    var keyname = this.source_path.substr(1)+this.selectedFileName;
    this.loadingData = true;
    let send_data = { source_path:this.source_path, bucket_name:this.current_bucket,
    file_or_folder_name:this.selectedFileName}
    this.sourceService.DownloadFileAndFolder(send_data).subscribe(data=>{
        this.loadingData = false;
        if(data.state!=undefined){
          this.toastrService.success(data.state)
          var binary = atob(data.body.replace(/\s/g, ''));
          var len = binary.length;
          var buffer = new ArrayBuffer(len);
          var view = new Uint8Array(buffer);
          for (var i = 0; i < len; i++) {
            view[i] = binary.charCodeAt(i);
          }
          var file_type = ''
          var ext = data.down_file_name.substring(data.down_file_name.length-3)
          if (ext =='pdf')
            file_type = 'application/pdf'
          if (ext =='csv' || ext == 'txt')
            file_type = 'text/plain;charset=utf-8';
          var blob = new Blob( [view], { type: file_type });
          var file_name = data.down_file_name;
          var FileSaver = require('file-saver');
          FileSaver.saveAs(blob, file_name);
          }
      },
      err=>{
        this.loadingData = false
      })

  }

  ////////------------------------init function end-----------------------------//////////////
}
function compare(a, b, isAsc) {

  if (a.substring(a.length-1) === '/' && b.substring(b.length-1) != '/')
    return -1;
  if (a.substring(a.length-1) != '/' && b.substring(b.length-1) == '/')
    return 1;

  var n = (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  return n;
}
function compareN(a,b,isAsc){
  if (isNaN(a) )
    return -1;
  if (isNaN(b) )
    return 1;
  var n = (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  return n;
}
