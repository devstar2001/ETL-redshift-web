/*tslint:disable*/
import {Component, EventEmitter, Injectable, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import { SourceService } from '../shared/services/source.service';
import { ToastrService } from 'ngx-toastr';
import {MatSelectionList, MatSelectionListChange, Sort} from '@angular/material';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {ContextMenuComponent, ContextMenuService} from 'ngx-contextmenu';

import {AmazingTimePickerService} from 'amazing-time-picker';
import * as moment from "moment";
import * as momenttz from 'moment-timezone';
// import moment = require('moment');
// import momenttz = require('moment-timezone');
import { TabsetComponent } from 'ngx-bootstrap';
import {AppSettings} from '../app.constant';
import {UserService} from '../shared/services/user.service';
import {Router} from '@angular/router';

@Component({
  templateUrl: './source-web.component.html',
  styleUrls: ['./source.component.css'],


})



export class SourceWebComponent implements OnInit {
  constructor(
            private sourceService: SourceService,
            private modalService: BsModalService,
            private atp: AmazingTimePickerService,
            private toastrService: ToastrService,
            private userService:UserService,
            private router:Router,
            private contextMenuService: ContextMenuService,
              ) {
    this.current_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.old_timezone =this.current_timezone
    this.optionsTimezoneData = [
      "Africa/Abidjan", "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers", "Africa/Asmara", "Africa/Bamako", "Africa/Bangui", "Africa/Banjul", "Africa/Bissau", "Africa/Blantyre", "Africa/Brazzaville", "Africa/Bujumbura", "Africa/Cairo", "Africa/Casablanca", "Africa/Ceuta", "Africa/Conakry", "Africa/Dakar", "Africa/Dar_es_Salaam", "Africa/Djibouti", "Africa/Douala", "Africa/El_Aaiun", "Africa/Freetown", "Africa/Gaborone", "Africa/Harare", "Africa/Johannesburg", "Africa/Juba", "Africa/Kampala", "Africa/Khartoum", "Africa/Kigali", "Africa/Kinshasa", "Africa/Lagos", "Africa/Libreville", "Africa/Lome", "Africa/Luanda", "Africa/Lubumbashi", "Africa/Lusaka", "Africa/Malabo", "Africa/Maputo", "Africa/Maseru", "Africa/Mbabane", "Africa/Mogadishu", "Africa/Monrovia", "Africa/Nairobi", "Africa/Ndjamena", "Africa/Niamey", "Africa/Nouakchott", "Africa/Ouagadougou", "Africa/Porto-Novo", "Africa/Sao_Tome", "Africa/Tripoli", "Africa/Tunis", "Africa/Windhoek", "America/Adak", "America/Anchorage", "America/Anguilla", "America/Antigua", "America/Araguaina", "America/Argentina/Buenos_Aires", "America/Argentina/Catamarca", "America/Argentina/Cordoba", "America/Argentina/Jujuy", "America/Argentina/La_Rioja", "America/Argentina/Mendoza", "America/Argentina/Rio_Gallegos", "America/Argentina/Salta", "America/Argentina/San_Juan", "America/Argentina/San_Luis", "America/Argentina/Tucuman", "America/Argentina/Ushuaia", "America/Aruba", "America/Asuncion", "America/Atikokan", "America/Bahia", "America/Bahia_Banderas", "America/Barbados", "America/Belem", "America/Belize", "America/Blanc-Sablon", "America/Boa_Vista", "America/Bogota", "America/Boise", "America/Cambridge_Bay", "America/Campo_Grande", "America/Cancun", "America/Caracas", "America/Cayenne", "America/Cayman", "America/Chicago", "America/Chihuahua", "America/Costa_Rica", "America/Creston", "America/Cuiaba", "America/Curacao", "America/Danmarkshavn", "America/Dawson", "America/Dawson_Creek", "America/Denver", "America/Detroit", "America/Dominica", "America/Edmonton", "America/Eirunepe", "America/El_Salvador", "America/Fort_Nelson", "America/Fortaleza", "America/Glace_Bay", "America/Godthab", "America/Goose_Bay", "America/Grand_Turk", "America/Grenada", "America/Guadeloupe", "America/Guatemala", "America/Guayaquil", "America/Guyana", "America/Halifax", "America/Havana", "America/Hermosillo", "America/Indiana/Indianapolis", "America/Indiana/Knox", "America/Indiana/Marengo", "America/Indiana/Petersburg", "America/Indiana/Tell_City", "America/Indiana/Vevay", "America/Indiana/Vincennes", "America/Indiana/Winamac", "America/Inuvik", "America/Iqaluit", "America/Jamaica", "America/Juneau", "America/Kentucky/Louisville", "America/Kentucky/Monticello", "America/Kralendijk", "America/La_Paz", "America/Lima", "America/Los_Angeles", "America/Lower_Princes", "America/Maceio", "America/Managua", "America/Manaus", "America/Marigot", "America/Martinique", "America/Matamoros", "America/Mazatlan", "America/Menominee", "America/Merida", "America/Metlakatla", "America/Mexico_City", "America/Miquelon", "America/Moncton", "America/Monterrey", "America/Montevideo", "America/Montserrat", "America/Nassau", "America/New_York", "America/Nipigon", "America/Nome", "America/Noronha", "America/North_Dakota/Beulah", "America/North_Dakota/Center", "America/North_Dakota/New_Salem", "America/Ojinaga", "America/Panama", "America/Pangnirtung", "America/Paramaribo", "America/Phoenix", "America/Port-au-Prince", "America/Port_of_Spain", "America/Porto_Velho", "America/Puerto_Rico", "America/Punta_Arenas", "America/Rainy_River", "America/Rankin_Inlet", "America/Recife", "America/Regina", "America/Resolute", "America/Rio_Branco", "America/Santarem", "America/Santiago", "America/Santo_Domingo", "America/Sao_Paulo", "America/Scoresbysund", "America/Sitka", "America/St_Barthelemy", "America/St_Johns", "America/St_Kitts", "America/St_Lucia", "America/St_Thomas", "America/St_Vincent", "America/Swift_Current", "America/Tegucigalpa", "America/Thule", "America/Thunder_Bay", "America/Tijuana", "America/Toronto", "America/Tortola", "America/Vancouver", "America/Whitehorse", "America/Winnipeg", "America/Yakutat", "America/Yellowknife", "Asia/Aden", "Asia/Almaty", "Asia/Amman", "Asia/Anadyr", "Asia/Aqtau", "Asia/Aqtobe", "Asia/Ashgabat", "Asia/Atyrau", "Asia/Baghdad", "Asia/Bahrain", "Asia/Baku", "Asia/Bangkok", "Asia/Barnaul", "Asia/Beirut", "Asia/Bishkek", "Asia/Brunei", "Asia/Chita", "Asia/Choibalsan", "Asia/Colombo", "Asia/Damascus", "Asia/Dhaka", "Asia/Dili", "Asia/Dubai", "Asia/Dushanbe", "Asia/Famagusta", "Asia/Gaza", "Asia/Hebron", "Asia/Ho_Chi_Minh", "Asia/Hong_Kong", "Asia/Hovd", "Asia/Irkutsk", "Asia/Jakarta", "Asia/Jayapura", "Asia/Jerusalem", "Asia/Kabul", "Asia/Kamchatka", "Asia/Karachi", "Asia/Kathmandu", "Asia/Khandyga", "Asia/Kolkata", "Asia/Krasnoyarsk", "Asia/Kuala_Lumpur", "Asia/Kuching", "Asia/Kuwait", "Asia/Macau", "Asia/Magadan", "Asia/Makassar", "Asia/Manila", "Asia/Muscat", "Asia/Nicosia", "Asia/Novokuznetsk", "Asia/Novosibirsk", "Asia/Omsk", "Asia/Oral", "Asia/Phnom_Penh", "Asia/Pontianak", "Asia/Pyongyang", "Asia/Qatar", "Asia/Qyzylorda", "Asia/Riyadh", "Asia/Sakhalin", "Asia/Samarkand", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Srednekolymsk", "Asia/Taipei", "Asia/Tashkent", "Asia/Tbilisi", "Asia/Tehran", "Asia/Thimphu", "Asia/Tokyo", "Asia/Tomsk", "Asia/Ulaanbaatar", "Asia/Urumqi", "Asia/Ust-Nera", "Asia/Vientiane", "Asia/Vladivostok", "Asia/Yakutsk", "Asia/Yangon", "Australia/Adelaide", "Australia/Brisbane", "Australia/Broken_Hill", "Australia/Currie", "Australia/Darwin", "Australia/Eucla", "Australia/Hobart", "Australia/Lindeman", "Australia/Lord_Howe", "Australia/Melbourne", "Australia/Perth", "Australia/Sydney", "Europe/Amsterdam", "Europe/Andorra", "Europe/Astrakhan", "Europe/Athens", "Europe/Belgrade", "Europe/Berlin", "Europe/Bratislava", "Europe/Brussels", "Europe/Bucharest", "Europe/Budapest", "Europe/Busingen", "Europe/Chisinau", "Europe/Copenhagen", "Europe/Dublin", "Europe/Gibraltar", "Europe/Guernsey", "Europe/Helsinki", "Europe/Isle_of_Man", "Europe/Istanbul", "Europe/Jersey", "Europe/Kaliningrad", "Europe/Kiev", "Europe/Kirov", "Europe/Lisbon", "Europe/Ljubljana", "Europe/London", "Europe/Luxembourg", "Europe/Madrid", "Europe/Malta", "Europe/Mariehamn", "Europe/Minsk", "Europe/Monaco", "Europe/Moscow", "Europe/Oslo", "Europe/Paris", "Europe/Podgorica", "Europe/Prague", "Europe/Riga", "Europe/Rome", "Europe/Samara", "Europe/San_Marino", "Europe/Sarajevo", "Europe/Saratov", "Europe/Simferopol", "Europe/Skopje", "Europe/Sofia", "Europe/Stockholm", "Europe/Tallinn", "Europe/Tirane", "Europe/Ulyanovsk", "Europe/Uzhgorod", "Europe/Vaduz", "Europe/Vatican", "Europe/Vienna", "Europe/Vilnius", "Europe/Volgograd", "Europe/Warsaw", "Europe/Zagreb", "Europe/Zaporozhye", "Europe/Zurich", "Indian/Antananarivo", "Indian/Chagos", "Indian/Christmas", "Indian/Cocos", "Indian/Comoro", "Indian/Kerguelen", "Indian/Mahe", "Indian/Maldives", "Indian/Mauritius", "Indian/Mayotte", "Indian/Reunion"
    ];
    this.optionsDayData = [
      ,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31
    ]
    this.hourData = [
      1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24
    ]
    this.dayData= [
      "Sunday", "Monday", "Tuesday","Wednesday","Thursday","Friday","Saturday"
    ]
    this.monthData = [
      {"key":"January", "value":"1"},{"key":"February", "value":"2"},{"key":"March", "value":"3"},{"key":"April", "value":"4"},{"key":"May", "value":"5"},{"key":"June", "value":"6"},{"key":"July", "value":"7"},{"key":"August", "value":"8"},{"key":"September", "value":"9"},{"key":"October", "value":"10"},{"key":"November", "value":"11"},{"key":"December", "value":"12"}
    ]

  }
  @Input() contextMenu: ContextMenuComponent;
  @ViewChild('staticTabs') staticTabs: TabsetComponent;
  @ViewChild(MatSelectionList) list1: MatSelectionList;
  modalRef: BsModalRef;
  modal_config = {
    keyboard: false,
    backdrop:false,
    ignoreBackdropClick: true,
    class:'gray modal-lg'
  };
  source_path;
  bucket_name;
  selected_table_numbers = []
  tables;
  is_uploading:boolean;
  is_extracting:boolean;
  is_saving:boolean;
  getting_schedule:boolean;
  is_loading:boolean = false;
  site_url;
  file_name;
  raw_data;

  isSavingSchedule:boolean;
  current_date
  current_time
  schedule_frequency='None'
  hours_of_day=[];
  hours_of_day_utc=[];
  days_of_week=[]
  weeks_of_month=[]
  months_of_year=[]
  frequencyUnit;
  frequency=1;
  hourData;
  monthData;
  dayData;
  days_of_month;
  optionsDayData
  old_timezone;
  current_timezone;
  optionsTimezoneData;
  is_schedule:boolean = false;
  rec_data;

  scraper_id;
  scraper_name;
  scraper_list=[];
  scraper_flag = "New";
  scraper_schedule_id;




  handleTokenExpire(err){
    if(err.indexOf("No such user")>1)
    {
      this.toastrService.error("Token expired. Please signin again.")
      this.userService.logout()
      this.router.navigateByUrl('/signin')

    }
  }
  ngOnInit(){
    this.rec_data = {};
    var date = new Date();
    this.current_date = moment(date).format('YYYY-MM-DD');
    this.current_time = moment(date).format('HH:mm')


    // this.tables = [{'name':'projects.newsday.com_1.csv', 'selected':false }]
    this.source_path = localStorage.getItem('source_path')
    this.bucket_name = localStorage.getItem("bucket")
    this.selected_table_numbers.push(1)
  }




  public onContextMenu($event: MouseEvent, item: any): void {
    this.contextMenuService.show.next({
      // Optional - if unspecified, all context menu components will open
      contextMenu: this.contextMenu,
      event: $event,
      item: item,
    });
    $event.preventDefault();
    $event.stopPropagation();
  }
  selectTab(tab_id: number) {
    // this.staticTabs.tabs[tab_id].active = true;
    if(tab_id == 2){
      this.is_loading = true

      this.sourceService.GetScrapers().subscribe(
        data=>{
          this.is_loading = false
          this.scraper_list = data.scrapers;
        },
        err=>{
          this.is_loading = false
          this.handleTokenExpire(err)

        }
      )
    }
  }
  scraper_Save(){
    this.is_saving = true
    let select_data_time = this.current_date +" " + this.current_time
    var cur_local    = momenttz.tz(select_data_time , this.current_timezone);
    let cur_utc = momenttz.utc(cur_local).format('YYYY-MM-DD HH:mm')
    let send_data = {
      scraper_name:this.scraper_name,
      source_path:this.source_path,
      table_indexs:this.selected_table_numbers,
      site_url:this.site_url,
      scraper_id:this.scraper_id,
        schedule_frequency:this.schedule_frequency,
        hours_of_day:this.hours_of_day_utc,
        days_of_week:this.days_of_week,
        days_of_month:this.days_of_month,
        weeks_of_month:this.weeks_of_month,
        months_of_year:this.months_of_year,
        frequency:this.frequency,
        cur_utc:cur_utc
    }

    this.sourceService.Scraper_Save(send_data).subscribe(
      data=>{
        this.is_saving = false
        this.toastrService.success(data.status)
      },
      err=>{
        this.is_saving = false
        this.handleTokenExpire(err)
        this.toastrService.error(err.details)
      }
    )

  }
  editScraper(id){
    this.rec_data = {}
    this.setRecData()
    this.staticTabs.tabs[0].active = true;
    this.scraper_id = id
    this.scraper_flag = "Edit"
    this.scraper_list.forEach((item)=>
    {
      if(item.id == this.scraper_id){
        this.site_url = item.site
        this.selected_table_numbers = JSON.parse(item.table_numbers)
        this.source_path = item.upload_path
        this.scraper_name = item.name
        this.scraper_schedule_id = item.schedule
      }
    })
    if(this.scraper_schedule_id > 0 && this.scraper_schedule_id != undefined){
      this.getting_schedule = true

      let send_data = {
        schedule_id:this.scraper_schedule_id
      }
      this.sourceService.GetSchedule(send_data).subscribe(
        data=>{
          if(data.start_utc_time == null || data.start_utc_time ==undefined)
            data.start_utc_time = this.current_date
          this.rec_data = {
            schedule_frequency:data.schedule_frequency,
            start_utc_time:data.start_utc_time,
            ct_minute:data.ct_minute,
            ct_hour:data.ct_hour,
            ct_day_of_week:data.ct_day_of_week,
            ct_day_of_month:data.ct_day_of_month,
            ct_month_of_year:data.ct_month_of_year,
          };

          this.setRecData()
          this.getting_schedule = false

        },
        err=>{

          this.getting_schedule = false
          this.handleTokenExpire(err)
        }
      )
    }

  }
  new_scraper(){
    this.scraper_flag = "New"
    this.scraper_id = undefined;
    this.site_url = ""
    this.selected_table_numbers = [1]
    this.source_path = localStorage.getItem("source_path")
    this.scraper_name = ""
    this.rec_data = {}
    this.setRecData()
  }
  removeScraper(id){
    let send_data={
      id:id
    }
    this.sourceService.RemoveScraper(send_data).subscribe(
      data=>{
        this.toastrService.success(data.status)
        this.is_loading = true
        this.sourceService.GetScrapers().subscribe(
          data=>{
            this.is_loading = false
            this.scraper_list = data.scrapers;
          },
          err=>{
            this.is_loading = false
          }
        )
      },
      err=>{
        this.toastrService.error(err)

      }
    )


  }
  Try_Scrape(){
    this.is_extracting = true
    let send_data = {
      site_url:this.site_url
    }
    this.sourceService.ExtractFromWeb(send_data).subscribe(
      data=>{
        this.is_extracting = false
        this.tables = data.filenames
      },
      err =>{
        this.is_extracting = false
      }
    )

  }


  onSelectedOptionsChange(event, item) {
    // if (event.selected == undefined || event.selected == false )
    //   item.selected = true;
    // if (event.selected == true)
    //   item.selected = false;
    //
    var re = /\d+/
    this.selected_table_numbers = []
    this.tables.forEach( (table)=>{
      if(table.name == item.name){
        table.selected = event.selected;
      }

      if (table.selected){
        var num = Number(table.name.match(re))
        this.selected_table_numbers.push(num)
      }



    });
    // console.log(this.selected_table_numbers)

    let send_data = {
      file_name:item.name
    }
    this.sourceService.GetTableRawData(send_data).subscribe(
      data=>{
        this.raw_data = data.raw_data
        this.file_name = data.file_name
      },
      err=>
      {
        this.handleTokenExpire(err)
        this.toastrService.error(err)

      }
    )

  }
  downloadCSVfiles(){
    // this.is_uploading = true
    this.tables.forEach((table)=>{
      if(table.selected){
        window.open(AppSettings.API_ENDPOINT + "/media/" + table.name )
      }
    })

  }
  uploadToRedshift(){
    let send_data = {
      'bucket':this.bucket_name,
      'source_path':this.source_path,
      'site_url':this.site_url,
      'table_numbers':this.selected_table_numbers
    }
    this.is_uploading = true
    this.sourceService.UploadToRS(send_data).subscribe(
      data=>{
        this.is_uploading = false
        this.toastrService.success("Uploading OK")
      },
        err=>{

          this.is_uploading = false
          this.handleTokenExpire(err)
      })
  }


  //////_---------------------scheduling --------------
  openSelectFileModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, this.modal_config);
  }
  clearCurrentData(){
    this.days_of_month=1
    this.hours_of_day=[]
    this.months_of_year=[]
    this.days_of_week = []
  }
  ChangeFrequency(){
    this.clearCurrentData()
    if (this.schedule_frequency =='Minutely')
      this.frequencyUnit = 'Minute(s)'
    if (this.schedule_frequency =='Hourly')
      this.frequencyUnit = 'Hour(s)'
    if (this.schedule_frequency =='Daily')
      this.frequencyUnit = 'Day(s)'
    if (this.schedule_frequency =='Weekly')
      this.frequencyUnit = 'Week(s)'
    if (this.schedule_frequency == 'Monthly')
      this.frequencyUnit = 'Month(s)'
    if (this.schedule_frequency =='Yearly')
      this.frequencyUnit = 'Year(s)'


  }

  hideModal(): void {
    this.modalRef.hide();
    this.setRecData();
  }
  changeSelectHours(event){
    var hour_val = Number(event.target.defaultValue)
    var index = this.hours_of_day.indexOf(hour_val);
    let select_data_time = this.current_date
    if (String(hour_val).length == 1)
      select_data_time = select_data_time +" 0" + hour_val+":00"
    else
      select_data_time = select_data_time +" " + hour_val+":00"
    var cur_local    = momenttz.tz(select_data_time , this.current_timezone);
    // var cur_utc    = cur_local.clone().tz("Europe/London");
    let cur_utc = momenttz.utc(cur_local).format('YYYY-MM-DD HH:mm')
    let tt = cur_utc.split(" ")[1]
    let utc_hour_val = Number(tt.split(":")[0])

    if (index !== -1) {
      if(!event.target.checked){
        this.hours_of_day.splice(index, 1);
        this.hours_of_day_utc.splice(index, 1);
        if (this.hours_of_day.length == 0)
          this.hours_of_day_utc = []
      }

    }
    else {
      if(event.target.checked){
        this.hours_of_day.push(hour_val)
        this.hours_of_day_utc.push(utc_hour_val)
      }

    }

    // console.log(this.hours_of_day);
    // console.log(this.hours_of_day_utc);
  }
  changeDate(){
    // console.log(this.old_timezone)
    // console.log(this.current_timezone)
    let select_data_time = this.current_date +" " + this.current_time
    var cur_local    = momenttz.tz(select_data_time , this.old_timezone);
    cur_local = cur_local.clone().tz(this.current_timezone).format('YYYY-MM-DD HH:mm');
    var temp = cur_local.split(" ")
    // console.log(temp)
    this.current_date = temp[0]
    this.current_time = temp[1]
    this.old_timezone = this.current_timezone


  }

  changeMonthOfYear(event){

    var index = this.months_of_year.indexOf(event.target.defaultValue);

    if (index !== -1) {
      if(!event.target.checked)
        this.months_of_year.splice(index, 1);
    }
    else {
      if(event.target.checked)
        this.months_of_year.push(event.target.defaultValue)
    }
    // console.log(event.target.checked);
    // console.log(event.target.defaultValue);
    // console.log(this.months_of_year);

  }
  changeDayOfWeek(event){
    var val = event.target.defaultValue
    var index = this.days_of_week.indexOf(val.toLowerCase());

    if (index !== -1) {
      if(!event.target.checked)
        this.days_of_week.splice(index, 1);
    }
    else {
      if(event.target.checked)
        this.days_of_week.push(val.toLowerCase())
    }
    // console.log(event.target.checked);
    // console.log(event.target.defaultValue);
    // console.log(this.days_of_week);
    if(event.target.checked)
      this.days_of_month = undefined
  }
  changeDayOfMonth(){
    if (this.days_of_month !=undefined)
    {
      this.days_of_week=[]
      $('#loader_days_of_week_sunday').prop('checked', false);
      $('#loader_days_of_week_monday').prop('checked', false);
      $('#loader_days_of_week_tuesday').prop('checked', false);
      $('#loader_days_of_week_wednesday').prop('checked', false);
      $('#loader_days_of_week_thursday').prop('checked', false);
      $('#loader_days_of_week_friday').prop('checked', false);
      $('#loader_days_of_week_saturday').prop('checked', false);



    }
  }
  open() {

    const amazingTimePicker = this.atp.open({
      time:  this.current_time,
      theme: 'dark',
      arrowStyle: {
        background: 'red',
        color: 'white',

      }
    });

    (document.querySelector('#time-picker-wrapper') as HTMLElement).style.zIndex = '1500';
    // document.querySelector("#time-picker-wrapper").style.zIndex='1500'
    amazingTimePicker.afterClose().subscribe(time => {
      this.current_time = time;
    });
  }

  getCheckHours(hour){
    var val = false
    this.hours_of_day.forEach(function (item) {
      if (hour==item)
        val = true
    })
    return val;
  }
  getCheckMonth(data){
    var val = false
    this.months_of_year.forEach(function (item) {
      if (item == data)
        val = true
    })
    return val;
  }
  getCheckDaysOfWeek(day){
    var val = false
    this.days_of_week.forEach(function (item) {
      if (item == day.toLowerCase())
        val = true
    })
    return val;
  }
  setRecData(){
    this.hours_of_day=[]
    this.hours_of_day_utc=[]
    if (this.rec_data.schedule_frequency == undefined) {
      this.schedule_frequency = 'None'
      this.ChangeFrequency()
      return
    }
    this.schedule_frequency = this.rec_data.schedule_frequency
    this.ChangeFrequency()
    if (this.schedule_frequency == 'None') return

    let temp_date = momenttz(this.rec_data.start_utc_time)
    var str_date_time_utc = temp_date.utc().format('YYYY-MM-DD HH:mm')
    temp_date = temp_date.clone().tz(this.current_timezone)
    let str_date_time =temp_date.format('YYYY-MM-DD HH:mm')
    var temp = str_date_time.split(" ")
    // console.log(temp)
    this.current_date = temp[0]
    this.current_time = temp[1]
    if(this.rec_data.ct_minute.indexOf("/") != -1){
      this.frequency = this.rec_data.ct_minute.split("/")[1]
    }
    if(this.rec_data.ct_hour.indexOf("/") != -1){
      this.frequency = this.rec_data.ct_hour.split("/")[1]
    }
    if(this.rec_data.ct_day_of_week.indexOf("/") != -1){
      this.frequency = this.rec_data.ct_day_of_week.split("/")[1]
    }
    if(this.rec_data.ct_day_of_month.indexOf("/") != -1){
      this.frequency = this.rec_data.ct_day_of_month.split("/")[1]
    }
    if(this.rec_data.ct_month_of_year.indexOf("/") != -1){
      this.frequency = this.rec_data.ct_month_of_year.split("/")[1]
    }



    if(this.rec_data.ct_hour == '*') this.hours_of_day = []
    else
    {
      this.hours_of_day_utc = this.rec_data.ct_hour.split(",").map(Number);
      this.hours_of_day_utc.forEach((hour)=>{
        let str_select_data_time = str_date_time_utc.split(" ")[0]
        if (hour.length ==1)
          str_select_data_time = str_select_data_time + " 0"+ hour + ":00"
        else
          str_select_data_time = str_select_data_time + " "+ hour + ":00"
        var select_data_time_    = momenttz.utc(str_select_data_time).tz(this.current_timezone);
        var cur_local_time    = momenttz.tz(select_data_time_, this.current_timezone);
        let str_cur_local_time = cur_local_time.format('YYYY-MM-DD HH:mm').split(" ")[1]
        this.hours_of_day.push(Number(str_cur_local_time.split(":")[0]))
      });

    }

    if(this.rec_data.ct_day_of_week == '*') this.days_of_week = []
    else
      this.days_of_week = this.rec_data.ct_day_of_week.split(",")
    if(this.rec_data.ct_day_of_month == '*') this.days_of_month = undefined
    if(this.rec_data.ct_month_of_year == '*') this.months_of_year = []
    else
      this.months_of_year = this.rec_data.ct_month_of_year.split(",")

  }
  applySchedule(){
    this.modalRef.hide()

  }

}
