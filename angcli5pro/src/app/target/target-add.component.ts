import { Component, OnInit } from '@angular/core';
import { TargetService } from '../shared/services/target.service'
import { ToastrService } from 'ngx-toastr';
import {ActivatedRoute, Router} from '@angular/router';
/*tslint:disable*/
@Component({
  templateUrl: './target-add.component.html',
  styleUrls: ['../app.component.css'],
})
export class UserTargetAddComponent implements OnInit{
	database_form  = {
		target_name: null,
		name: null,
		host: null,
		port: null,
		username: null,
		password: null

	}
	constructor(private targetService: TargetService, private toastrService: ToastrService, private router:Router){}
  isLoading:boolean = false;

	ngOnInit() {
        console.log("<<<< target-add comp started >>>")
	}

	  /**
	   * Add a Target (Target is a redshift database)
	   */
    addTarget() {
	  this.isLoading = true;

		this.targetService.addDatabase(this.database_form)
		.subscribe(
			data => {
        this.isLoading = false;
				this.toastrService.success('New Target Database is added', 'Success');
				this.router.navigate(['/targets']);
			},
			err => {
				this.toastrService.error(err, 'Error');
			}
		);
	}
}
