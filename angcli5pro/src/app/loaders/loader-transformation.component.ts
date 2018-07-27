import { Component, OnInit, TemplateRef } from '@angular/core';
import { LoaderService } from '../shared/services/loader.service';
import { Router} from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BsModalService } from 'ngx-bootstrap';
import { BsModalRef } from 'ngx-bootstrap';
import * as $ from 'jquery';
import 'jqueryui';

/*tslint:disable*/
@Component({
  templateUrl: './loader-transformation.component.html',
  styleUrls:['../app.component.css']
  // styles: [``]
})
export class LoaderTransformComponent implements OnInit{

    DataTypeList:any =[
        'auto',
        'MM/DD/YYYY',
        'YYYY-MM-DD',
        'MM/DD/YY',
        'DD.MM.YYYY',
        'YYYYMMDD',
        'YYMMDD',
        'YYYY/MM/DD'
    ]
    DataTimeTypeList:any =[
        'auto',
        'YYYY/MM/DD HH:MI:SS',
        'YYYY/MM/DD HH12:MI:SS AM',
        'YYYY-MM-DD HH:MI:SS',
        'YYYY-MM-DD HH12:MI:SS AM',
        'MM/DD/YYYY HH:MI:SS',
        'MM/DD/YYYY HH12:MI:SS AM',

    ]


    constructor(
	    private loaderService: LoaderService,
        private router:Router,
        private toastrService: ToastrService,
        private modalService: BsModalService
    ){
        this.counterData = {};
        this.pk_cols= [];
      this.dataTypeArray = [
        'Text',
        'Date',
        'Date Time',
        'Integer',
        'Long',
        'Decimal',
        'Boolean'
      ]
    }
    dataTypeArray = [];
    dropdownSettings = {};
    dropdownList = [];
    modalRef: BsModalRef;
    input_first;
    isLoading = false;
    isSaving = false;
    input_second;
    line_count = 0;
    input_third;
    key_type  = 's3';
    pk_cols =[];
	  csvData: any;
    headersData: any;
    modalObject: any;
    counterData:any;
    original_csvData;
    original_headersData;
  public fontIconArray;
  public fontTextIconArray;


    ngOnInit() {
      // console.log("<<<< loader-transformation comp started >>>")
      const bundleId = localStorage.getItem('bundleId');
      this.isLoading = true;
      this.fontIconArray = {
        'Text' : 'text-icon text-icon-string',
        'Date': 'fa-calendar',
        'Date Time' : 'fa-clock-o',
        'Integer' : 'fa-hashtag',
        'Long'  : 'text-icon',
        'Decimal' : 'text-icon',
        'Boolean' : 'fa-toggle-on'
        }
      this.fontTextIconArray = {
        'Text' : 'abc',
        'Date': '',
        'Date Time' : '',
        'Integer' : '',
        'Long'  : '##',
        'Decimal' : '#.#',
        'Boolean' : ''
      }



      this.loaderService.getTransformFilter(bundleId)
            .subscribe(
                data => {

                    this.isLoading = false;
                    this.pk_cols= [];
                    this.csvData= data.csv_data;
                    this.original_csvData  = JSON.stringify(data.csv_data);
                    this.original_headersData= data.meta_data;
                    if(JSON.parse(this.original_headersData)['line_count'])
                      this.line_count = parseInt(JSON.parse(this.original_headersData)['line_count']);
                    this.headersData = JSON.parse(data.meta_data).headers;
                    localStorage.setItem('transformfilter_id', data.transformfilter_id);
                    this.CreateMultiSelect();
                    this.dropdownList = this.headersData;
                    this.processFilteration();
                    this.dropdownSettings = {
                      singleSelection: false,
                      text:"Select Columns",
                      selectAllText:'Select All',
                      // unSelectAllText:'UnSelect All',
                      enableSearchFilter: true,
                      classes:"myclass custom-class"
                    };
                },
                err => {

                  this.toastrService.error('Server(backend) has error');
                  this.toastrService.error(err);
                  if (err ='File No exist')
                    this.router.navigate(['/loader/settings']);
                }
            )
    }
  CreateMultiSelect(){
    //-------------
    let key_counts = 0
    this.key_type = 's1'

    let pks = []
    let add_pk=''
    this.headersData.forEach(function(header) {
      header['itemName'] = header.col_name;
      header['id'] = header.col_index;
      if (header['is_key'] == true){
        key_counts++;
        pks.push(header);
        if (header['col_name'] == 'de_id')
          add_pk = 'de_id'
      }

    });
    if (key_counts == 0){
      this.key_type = 's3'
      this.disableMultiSelect = true
    }
    if (key_counts>0){
      if (key_counts == 1 && add_pk == 'de_id'){
        this.key_type = 's1'
        this.disableMultiSelect = true
      }
      else {
        this.key_type = 's2'
        this.disableMultiSelect = false
      }
    }
    this.pk_cols = pks
    //------------
  }

  onItemSelect(item:any){
    console.log(item);
    item.is_key = true;
    if (item.col_name == 'de_id')
    {
      item.is_deleted = false
      // this.processFilteration()
    }
    console.log(this.pk_cols);
  }
  OnItemDeSelect(item:any){
    item.is_key = false;
    if (item.col_name == 'de_id')
    {
      item.is_deleted = true
      // this.processFilteration()
    }
    console.log(item);
    console.log(this.pk_cols);
  }
  onSelectAll(items: any){
    console.log(items);
  }
  onDeSelectAll(items: any){
    console.log(items);
  }
  handle1(){
    this.disableMultiSelect = true;
    this.headersData.forEach(function(header) {
      if (header.col_name =='de_id') {
        header.is_deleted = false;
        header.is_key = true;
      }
    });

      // this.processFilteration();
  }
  disableMultiSelect = true
  handle2(){
      this.disableMultiSelect = false;
    this.headersData.forEach(function(header) {
      if (header.col_name =='de_id') {
        header.is_deleted = true;
        header.is_key = false;
      }
    });

      // this.processFilteration();
  }
  handle3(){
    this.disableMultiSelect = true;
    this.headersData.forEach(function(header) {
        header.is_key = false;
      if (header.col_name =='de_id') {
        header.is_deleted = true;
      }
    });

    // this.processFilteration();
  }
    removeTransformSettings(){
      this.csvData = JSON.parse(this.original_csvData);
      this.headersData = JSON.parse(this.original_headersData).headers;
      this.headersData.forEach(function(header) {
        header.data_type = 'Text';
        header.is_deleted = false;
        if(header.col_name =='de_id'){
          header.is_deleted = true;
          header.data_type = 'Long';
        }

        header['itemName'] = header.col_name;
        header['id'] = header.col_index;
        header['is_key'] = false;
        if (header.filters.length > 0) {
           header.filters =[];
        }
      })
      this.pk_cols = []
      this.key_type = 's3'
      this.disableMultiSelect = true
      this.processFilteration()

    }

  public replaceAll(str, find, replace) {
        return str.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
    }

    public escapeRegExp(str) {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }


    //Find & Replace Methods
    public replaceAllOccurences(str, find, replace) {
        if(find && str) {
            let stringRet = this.replaceAll(str, find, replace)
            try {
                return eval(stringRet).toString();
            } catch (e) {
                return stringRet.toString();
            }

        }
        return str;
    }


    public previewFindAndReplace(str, find, replace) {
        if(find)
            return this.replaceAllOccurences(str, find, replace);
        return str;
    }


    public openFindAndReplaceModal(loaderSampleHeader: any, template: TemplateRef<any>) {
        this.modalObject = {};
        this.input_first = '';
        this.input_second = '';
        this.modalObject.data = loaderSampleHeader;
        this.modalObject.csvData = Object.assign([], this.csvData);
        this.modalRef = this.modalService.show(template);
        $('.modal-dialog').draggable();
        let s = document.getElementsByClassName('modal-content');

    }



    findAndReplaceMethod(colData) {
        let objfilter = {
            'find_value':this.input_first,
            'replace_value' : this.input_second,
            'filter_type' : 'search',
            'case_sensitive': 1
        };
        colData.filters.push(objfilter);
        this.processFilteration();
        this.modalRef.hide();
        this.toastrService.success('Transformation Applied Successfully', 'Success');
    }


    ////////////////////////Extract Text Between Methods//////////////////

    public extractTextBetweenString(str, first, last, occur_type) {
        if(!str)
            return '';
        let pattern = '(.*)';
        if(occur_type == 0)
            pattern = '(.*?)'
        let matchedStr = str.match(first + pattern + last)
        if(matchedStr)
            return matchedStr.pop()
        return '';
    }


    public previewExtractTextBetween(str, first, last, occur_type) {
        if(first && last && occur_type)
            return this.extractTextBetweenString(str, first, last, occur_type);
        return str;
    }


    public extractTextBetweenModal(loaderSampleHeader: any, template: TemplateRef<any>) {
        this.modalObject = {};
        this.input_first = '';
        this.input_second = '';
        this.input_third = "0";
        this.modalObject.data = loaderSampleHeader;
        this.modalObject.csvData = Object.assign([], this.csvData);
        this.modalRef = this.modalService.show(template);
      $('.modal-dialog').draggable();
    }

    extractTextBetweenMethod(colData) {
        // let copiedCoData = Object.assign({}, colData);

      // copiedCoData.col_name = copiedCoData.col_name + '_' + this.counterData[copiedCoData.orig_index];
        let objfilter = {
            'start_value':this.input_first,
            'end_value' : this.input_second,
            'occur_type' : this.input_third,
            'filter_type' : 'extract_text'
        };
        // copiedCoData.col_index = this.headersData.length;
        // copiedCoData.filters = [objfilter];
        colData.filters.push(objfilter);
        this.processFilteration();
        this.modalRef.hide();
        this.toastrService.success('Transformation Applied Successfully', 'Success');
    }


    //////////////////////////////////////////////////////////////////////////



    ////////////////////////Extract Regex Between Methods//////////////////

    public extractRegexString(str, regex) {
        if(!str)
            return '';
        let matchedStr = str.match(regex)
        if(matchedStr)
            return matchedStr.pop()
        return '';
    }


    public previewExtractRegex(str, regex) {
        if(regex)
            return this.extractRegexString(str, regex);
        return str;
    }


    public extractRegexModal(loaderSampleHeader: any, template: TemplateRef<any>) {
        this.modalObject = {};
        this.input_first = '';
        this.modalObject.data = loaderSampleHeader;
        this.modalObject.csvData = Object.assign([], this.csvData);
        this.modalRef = this.modalService.show(template);
      $('.modal-dialog').draggable();
    }

    extractRegexMethod(colData) {
        // let copiedCoData = Object.assign({}, colData);
        // copiedCoData.col_name = copiedCoData.col_name + '_' + this.counterData[copiedCoData.orig_index];
        let objfilter = {
            'regex_value':this.input_first,
            'filter_type' : 'extract_regex'
        };
        // copiedCoData.col_index = this.headersData.length;
        // copiedCoData.filters = [objfilter];
        colData.filters.push(objfilter);
        this.processFilteration();
        this.modalRef.hide();
        this.toastrService.success('Transformation Applied Successfully', 'Success');
    }


    //////////////////////////////////////////////////////////////////////////

    textTransformMethod(colData, transform) {
        console.log(transform)
        let objfilter = {
            'transform_value': transform,
            'filter_type' : 'text_transform'
        };
        colData.filters.push(objfilter);
        this.processFilteration();
        this.toastrService.success('Transformation Applied Successfully', 'Success');
    }

    public previewTextTransform(str, transform) {
        if(transform && str) {
            if(transform == 'uppercase') {
                return str.toUpperCase();
            } else if(transform == 'lowercase') {
                return str.toLowerCase();
            } else if(transform == 'capitalize') {
                return str.substr(0, 1).toUpperCase() + str.substr(1);
            } else if(transform == 'titalize') {
                return str.replace(/\b\w/g, l => l.toUpperCase())
            } else if(transform == 'snake_case') {
                return str.toLowerCase().replace(new RegExp(' ', 'g'), '_')
            } else if(transform == 'trim') {
                return str.trim();
            }
        }
        return '';
    }

    public hideModal(): void {
        this.modalRef.hide();
    }
    //////////////////////----------Math Functions --------------////////////////////////
    public mathModal(loaderSampleHeader: any, template: TemplateRef<any>) {
      this.modalObject = {};
      this.input_first = '';
      this.input_second = '';
      this.modalObject.data = loaderSampleHeader;
      this.modalObject.csvData = Object.assign([], this.csvData);
      this.modalRef = this.modalService.show(template);
      $('.modal-dialog').draggable();
    }
    mathAddMethod(colData) {
      let objfilter = {
        'input_value':this.input_second,
        'filter_type' : 'math_add'
      };
      colData.filters.push(objfilter);
      this.processFilteration();
      this.modalRef.hide();
      this.toastrService.success('Transformation Applied Successfully', 'Success');
    }
    public previewMathAdd(str, second) {
      if(Number(str))
        return String(Number(str) + Number(second));
      return str;
    }
    mathSubtractionMethod(colData) {
      let objfilter = {
        'input_value':this.input_second,
        'filter_type' : 'math_subtraction'
      };
      colData.filters.push(objfilter);
      this.processFilteration();
      this.modalRef.hide();
      this.toastrService.success('Transformation Applied Successfully', 'Success');
    }
    public previewMathSubtraction(str, second) {
      if(Number(str))
        return String(Number(str) - Number(second));
      return str;
    }
  mathMultiplyMethod(colData) {
    let objfilter = {
      'input_value':this.input_second,
      'filter_type' : 'math_multiply'
    };
    colData.filters.push(objfilter);
    this.processFilteration();
    this.modalRef.hide();
    this.toastrService.success('Transformation Applied Successfully', 'Success');
  }
  public previewMathMultiply(str, second) {
    if(Number(str))
      return String(Number(str) * Number(second));
    return str;
  }

  mathDivideMethod(colData) {
    let objfilter = {
      'input_value':this.input_second,
      'filter_type' : 'math_divide'
    };
    colData.filters.push(objfilter);
    this.processFilteration();
    this.modalRef.hide();
    this.toastrService.success('Transformation Applied Successfully', 'Success');
  }
  public previewMathDivide(str, second) {
    if(Number(str))
      return String(Number(str) / Number(second));
    return str;
  }
  mathPercentMethod(colData) {
    let objfilter = {
      'filter_type' : 'math_percent'
    };
    colData.filters.push(objfilter);
    this.processFilteration();
    this.modalRef.hide();
    this.toastrService.success('Transformation Applied Successfully', 'Success');
  }
  public previewMathPercent(str) {
    if(Number(str))
      return String(Number(str) / 100);
    return str;
  }
  mathLogMethod(colData) {
    let objfilter = {
      'input_value':this.input_second,
      'filter_type' : 'math_log'
    };
    colData.filters.push(objfilter);
    this.processFilteration();
    this.modalRef.hide();
    this.toastrService.success('Transformation Applied Successfully', 'Success');
  }
  public previewMathLog(str, second) {
    if(Number(str))
      return String(Math.log(Number(str)) / Math.log(Number(second)));
    return str;
  }
  mathExpMethod(colData) {
    let objfilter = {
      'input_value':this.input_second,
      'filter_type' : 'math_exp'
    };
    colData.filters.push(objfilter);
    this.processFilteration();
    this.modalRef.hide();
    this.toastrService.success('Transformation Applied Successfully', 'Success');
  }
  public previewMathExp(str) {
    if(Number(str))
      return String(Math.exp(Number(str)));
    return str;
  }
  processFilteration() {
        var _this = this;
        this.headersData.forEach(function(header) {
            if(header.filters.length > 0 ) {
                header.filters.forEach(function(filter) {
                    // if(typeof _this.counterData[header.orig_index] == 'undefined')
                    //     _this.counterData[header.orig_index] = 0;
                    // else
                    //     _this.counterData[header.orig_index]++;
                    if(filter.filter_type == 'search')
                    {
                        _this.csvData.forEach(function(datum) {
                            datum[header.col_index] = _this.previewFindAndReplace(datum[header.orig_index], filter.find_value, filter.replace_value);
                        })
                    }
                    if(filter.filter_type == 'extract_text')
                    {
                        _this.csvData.forEach(function(datum) {
                            datum[header.col_index] = _this.previewExtractTextBetween(datum[header.orig_index], filter.start_value, filter.end_value, filter.occur_type);
                        })
                    }
                    if(filter.filter_type == 'extract_regex')
                    {
                        _this.csvData.forEach(function(datum) {
                            datum[header.col_index] = _this.previewExtractRegex(datum[header.orig_index], filter.regex_value);
                        })
                    }
                    if(filter.filter_type == 'text_transform')
                    {
                        _this.csvData.forEach(function(datum) {
                            datum[header.col_index] = _this.previewTextTransform(datum[header.orig_index], filter.transform_value);
                        })
                    }
                    if(filter.filter_type == 'math_add')
                    {
                      _this.csvData.forEach(function(datum) {
                        datum[header.col_index] = _this.previewMathAdd(datum[header.orig_index], filter.input_value );
                      })
                    }
                    if(filter.filter_type == 'math_subtraction')
                    {
                      _this.csvData.forEach(function(datum) {
                        datum[header.col_index] = _this.previewMathSubtraction(datum[header.orig_index], filter.input_value );
                      })
                    }
                    if(filter.filter_type == 'math_multiply')
                    {
                      _this.csvData.forEach(function(datum) {
                        datum[header.col_index] = _this.previewMathMultiply(datum[header.orig_index], filter.input_value );
                      })
                    }
                    if(filter.filter_type == 'math_divide')
                    {
                      _this.csvData.forEach(function(datum) {
                        datum[header.col_index] = _this.previewMathDivide(datum[header.orig_index], filter.input_value );
                      })
                    }
                  if(filter.filter_type == 'math_percent')
                  {
                    _this.csvData.forEach(function(datum) {
                      datum[header.col_index] = _this.previewMathPercent(datum[header.orig_index] );
                    })
                  }
                  if(filter.filter_type == 'math_log')
                  {
                    _this.csvData.forEach(function(datum) {
                      datum[header.col_index] = _this.previewMathLog(datum[header.orig_index], filter.input_value );
                    })
                  }
                  if(filter.filter_type == 'math_exp')
                  {
                    _this.csvData.forEach(function(datum) {
                      datum[header.col_index] = _this.previewMathExp(datum[header.orig_index] );
                    })
                  }

                })
            }
            // else {
            //     if(typeof _this.counterData[header.orig_index] == 'undefined')
            //         _this.counterData[header.orig_index] = 0;
            //     else
            //         _this.counterData[header.orig_index]++;
            // }
        });
    }


    public openRenameModal(loaderSampleHeader: any, template: TemplateRef<any>) {
        this.modalObject = {};
        this.input_first = '';
        this.modalObject.data = loaderSampleHeader;
        this.modalRef = this.modalService.show(template);
      $('.modal-dialog').draggable();
        this.inputNameFocus()
    }
    inputNameFocus() {
      setTimeout(() => {
        document.getElementById('input_col_name').focus();
      }, 500);
    }


    renameColumnMethod(colData) {
        colData.col_name = this.input_first;
        this.modalRef.hide();
        this.toastrService.success('Column Name Changed Successfully', 'Success');
    }



    deleteColumnMethod(colData) {
        colData.is_deleted = true;
        // this.processFilteration();
        this.toastrService.success('Column Deleted Successfully', 'Success');
    }



  saveTransform() {
        let transformfilter_id = localStorage.getItem('transformfilter_id');
        this.isSaving = true;
        let bundleId = localStorage.getItem('bundleId');
        let send_data = {
          'headers':this.headersData,
          'line_count':this.line_count
        }
        this.loaderService.saveTransformFilters(bundleId, send_data)
            .subscribe(
                data => {
                    this.isSaving = false;
                    this.toastrService.success('Transformation has been saved', 'Success');
                    this.router.navigate(['/loader/summary']);
                },
                err => {
                    this.toastrService.error('Headers are not equal. Please select some other files', 'Error');
                    this.router.navigate(['/sources']);
                    console.log('Error ' + err)
                }
            )
    }




    changeDataType(type, loaderSampleHeader, dateTemplate: TemplateRef<any>, dateTimeTemplate: TemplateRef<any>) {
        loaderSampleHeader.data_type = type;
        if (type=='Date')
        {
            console.log(type);
            this.openDateTypeModal(loaderSampleHeader, dateTemplate)
        }
        if (type=='Date Time')
        {
            console.log(type);
            this.openDateTypeModal(loaderSampleHeader, dateTimeTemplate)
        }
    }

    public openDateTypeModal(loaderSampleHeader: any, template: TemplateRef<any>) {
        this.modalObject = {};
        this.input_first = '';
        this.modalObject.data = loaderSampleHeader;
        this.modalRef = this.modalService.show(template);
      $('.modal-dialog').draggable();
    }

    dateTypeMethod(colData) {

        // console.log(colData.col_name);
        // console.log(colData.date_type);
        // this.processDateTransform(colData);
        this.modalRef.hide();
        this.toastrService.success('Date Type selected Successfully', 'Success');
    }



    loadToRedshift() {
      // localStorage.setItem('loaderSettingsForm', JSON.stringify(this.loader_sett_form));
      // this.router.navigate(['/loader/targets']);
    }
}
