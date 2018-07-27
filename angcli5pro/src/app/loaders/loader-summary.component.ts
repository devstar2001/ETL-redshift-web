import {Component, OnInit, TemplateRef} from '@angular/core';
import { LoaderService } from '../shared/services/loader.service';
import {ActivatedRoute, Router} from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import * as moment from "moment";
import * as momenttz from 'moment-timezone';
// import moment = require('moment');
// import momenttz = require('moment-timezone');
import {AmazingTimePickerService} from 'amazing-time-picker';

/*tslint:disable*/
@Component({
  templateUrl: './loader-summary.component.html',
  styleUrls: ['../app.component.css'],

})
export class LoaderSummaryComponent implements OnInit{
	constructor(private loaderService: LoaderService,
              private router:Router,
              private toastrService: ToastrService,
              private modalService: BsModalService,
              private atp: AmazingTimePickerService,
  ){
        localStorage.setItem('loaderSettingsForm', JSON.stringify({}));
        this.columnCount = 0;
        this.transformationCount = 0;
        this.isLoading = false;
        this.isGettingCol = false;
        this.isGettingStrategy = false;
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

    };
	hours_of_day=[];
  hours_of_day_utc=[];
  hourData;
  monthData;
  dayData;
  days_of_month;
  optionsDayData
  old_timezone;
  current_timezone;
  optionsTimezoneData;
  bundleId;
  isLoading: boolean;
  pk_coumn_name;
  isGettingCol:boolean;
  isGettingStrategy:boolean;
  isSavingSchedule:boolean;
  transformationCount;
  columnCount;
  lineCount = 0;
  loader_sett_form  = {
      bundle_id: '',
      file:'',
      name: null,
      delimiter: ',',
      is_header: 1,
      table_name: '',
      redshift_id: '',
      sample_size : 50,
      encoding : 'UTF-8',
      strategy : 'Replace',
      load_type : 'file',
      folder:null,
      file_count:0
  }
  current_date
  current_time
  schedule_frequency='None'
  days_of_week=[]
  weeks_of_month=[]
  months_of_year=[]
  frequencyUnit;
  frequency=1;
  modal_config = {
    keyboard: false,
    backdrop:false,
    ignoreBackdropClick: true,
    class:'gray modal-lg'
  };
  modalRef: BsModalRef;
  rec_data;
  file_exist:boolean = false

	ngOnInit() {
	  this.rec_data = {};
    var date = new Date();
    this.current_date = moment(date).format('YYYY-MM-DD');
    this.current_time = moment(date).format('HH:mm')
    // console.log("<<<< loader-summary comp started >>>")
    this.bundleId = localStorage.getItem('bundleId');
        if(!this.bundleId)
        {
            this.toastrService.error('Invalid Loader. Please select some other files', 'Error');
            this.router.navigate(['/sources']);
        } else {
            this.isGettingStrategy = true;
            this.loaderService.getLoaderSettings(this.bundleId)
                .subscribe(
                    data => {

                        this.isGettingStrategy = false;
                        this.loader_sett_form.name = data.name;
                        this.loader_sett_form.file = data.file;
                        this.file_exist = data.file_exist;
                        this.loader_sett_form.bundle_id = this.bundleId;
                        this.loader_sett_form.redshift_id = data.redshift;
                        this.loader_sett_form.load_type = data.loader_type;
                        this.loader_sett_form.folder = data.folder ;
                        this.loader_sett_form.file_count = data.file_count ;
                        this.loader_sett_form.strategy = data.strategy;
                        this.loader_sett_form.table_name = data.table_name;
                        this.loader_sett_form.is_header = (data.is_header) ? 1 : 0;
                        this.loader_sett_form.delimiter = data.delimiter || ',';
                        this.loader_sett_form.encoding = data.encoding || 'UTF-8';
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

                    },
                    err => {
                        this.toastrService.error('Invalid Loader. Please select some other files', 'Error');
                        this.router.navigate(['/sources']);
                        console.log('Error ' + err)
                    }
                )

            var $this = this;
            this.isGettingCol = true;
            this.loaderService.getTransformHeaderData(this.bundleId)
                .subscribe(
                    data => {
                        this.isGettingCol = false;
                        let iskeys = ''
                        let headers = JSON.parse(data.meta_data).headers;
                        $this.columnCount = headers.length
                        $this.lineCount = JSON.parse(data.meta_data).line_count;
                        headers.forEach(function(datum) {
                            let filterCount = parseInt(datum.filters.length) || 0;
                            $this.transformationCount += filterCount;
                            if (datum.is_key == true)
                              iskeys = iskeys + datum.col_name + ','
                        })
                        this.pk_coumn_name = iskeys;

                    },
                    err => {
                        this.toastrService.error('Invalid Loader. Please select some other files', 'Error');
                        this.router.navigate(['/sources']);
                        console.log('Error ' + err)
                    }
                )
        }

	  }
	  clearCurrentData(){
	    this.days_of_month=1
      this.hours_of_day=[]
      this.months_of_year=[]
      this.days_of_week = []
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
        this.hours_of_day_utc = this.rec_data.ct_hour.split(",")
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

    runLoader() {
        this.isLoading = true;
        this.loaderService.runLoader(this.bundleId)
            .subscribe(
                data => {
                    this.isLoading = false;
                    this.toastrService.success('Loader has worked successfully. Please check the status in loaders page', 'Success');
                    this.router.navigate(['/loaders']);
                },
                err => {
                    this.isLoading = false;
                    // if(JSON.parse(err)['details'])
                    this.toastrService.error(err);


                }
            )
    }


    test(){
      this.isSavingSchedule = true;
      let select_data_time = this.current_date +" " + this.current_time
      var cur_local    = momenttz.tz(select_data_time , this.current_timezone);
      let cur_utc = momenttz.utc(cur_local).format('YYYY-MM-DD HH:mm')



      let send_data = {
        schedule_frequency:this.schedule_frequency,
        hours_of_day:this.hours_of_day_utc,
        days_of_week:this.days_of_week,
        days_of_month:this.days_of_month,
        weeks_of_month:this.weeks_of_month,
        months_of_year:this.months_of_year,
        frequency:this.frequency,
        cur_utc:cur_utc,
        bundleId:this.bundleId
      }
      this.loaderService.saveSchedule(send_data)
        .subscribe(
          data=>{
            this.toastrService.success('Saved in success.')
            let temp_date = momenttz(data.start_utc_time)
            temp_date = temp_date.clone().tz(this.current_timezone)
            let str_date_time =temp_date.format('YYYY-MM-DD HH:mm')
            var temp = str_date_time.split(" ")
            // console.log(temp)
            this.current_date = temp[0]
            this.current_time = temp[1]
            this.schedule_frequency = data.schedule_type

            this.isSavingSchedule = false;
            this.modalRef.hide()
          },
          err=>{
            this.isSavingSchedule = false;
            this.modalRef.hide()
      }
        );
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
    openSelectFileModal(template: TemplateRef<any>) {
      this.modalRef = this.modalService.show(template, this.modal_config);
    }
    hideModal(): void {
      this.modalRef.hide();
      this.setRecData();
    }

    changeSelectHours(event){
      var hour_val = event.target.defaultValue
      var index = this.hours_of_day.indexOf(event.target.defaultValue);
      let select_data_time = this.current_date
      if (hour_val.length == 1)
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
        }

      }
      else {
        if(event.target.checked)
          this.hours_of_day.push(event.target.defaultValue)
          this.hours_of_day_utc.push(utc_hour_val)
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
    // changeWeekOfMonth(event){
    //
    //   var index = this.weeks_of_month.indexOf(event.target.defaultValue);
    //
    //   if (index !== -1) {
    //     if(!event.target.checked)
    //       this.weeks_of_month.splice(index, 1);
    //   }
    //   else {
    //     if(event.target.checked)
    //       this.weeks_of_month.push(event.target.defaultValue)
    //   }
    //   console.log(event.target.checked);
    //   console.log(event.target.defaultValue);
    //   console.log(this.weeks_of_month);
    //
    // }
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
}
