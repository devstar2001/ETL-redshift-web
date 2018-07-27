import { Component, OnInit } from '@angular/core';
import { TargetService } from '../shared/services/target.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../shared/services/loader.service';


/*tslint:disable*/
@Component({
  templateUrl: './source-select-red.component.html',
  styleUrls: ['../app.component.css'],
})
export class UserSourceLoadRedComponent implements OnInit{
	constructor(
		private toastrService: ToastrService,
		private targetService: TargetService,
		private route: ActivatedRoute,
		private router: Router,
		private loaderService: LoaderService
	){}
	targetList;
    bundleId;
    loader_sett_form  = {
        bundle_id: '',
        name: null,
        delimiter: ',',
        is_header: 1,
        table_name: '',
        redshift_id: '',
        sample_size : 50,
        encoding : 'UTF-8',
        strategy : 'Replace'
    }
	ngOnInit() {
        console.log("<<<< source-red comp started >>>")
        this.bundleId = localStorage.getItem('bundleId');

        this.targetService.getTargets()
        .subscribe(
           data => {
          this.targetList = data
           },
           err => {
           console.log('Error ' + err)
           }
         )

        this.loaderService.getLoaderSettings(this.bundleId)
            .subscribe(
                data => {
                    this.loader_sett_form.name = data.name;
                    this.loader_sett_form.bundle_id = this.bundleId;
                    this.loader_sett_form.redshift_id = data.redshift;
                    this.loader_sett_form.strategy = data.strategy;
                    this.loader_sett_form.table_name = data.table_name;
                    this.loader_sett_form.is_header = (data.is_header) ? 1 : 0;
                    this.loader_sett_form.delimiter = data.delimiter || ',';
                    this.loader_sett_form.encoding = data.encoding || 'UTF-8';
                },
                err => {
                    this.toastrService.error('Invalid Loader. Please select some other files', 'Error');
                    this.router.navigate(['/sources']);
                    console.log('Error ' + err)
                }
            )
	  }
	  // trigger-variable for Ladda
    isLoading: boolean = false;
    saveLoaderSettings() {
        this.loaderService.saveLoaderSettings(this.loader_sett_form)
            .subscribe(
                data => {
                    this.toastrService.success('Loader Settings Saved. Please review.', 'Success');
                    this.router.navigate(['/loader/summary']);
                },
                err => {
                    this.toastrService.error('Error in saving Loader Settings. Please try again', 'Error');
                    console.log('Error ' + err)
                }
            )
    }

}
