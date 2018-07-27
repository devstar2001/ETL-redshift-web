import { Component, OnInit } from '@angular/core';
import { TargetService } from '../shared/services/target.service'
import { ToastrService } from 'ngx-toastr';
import {ActivatedRoute, Router} from '@angular/router';
/*tslint:disable*/
@Component({
  templateUrl: './target-edit.component.html',
  styleUrls: ['../app.component.css'],
})
export class UserTargetEditComponent implements OnInit{
	private dbId;
  isLoading:boolean = false
	database_form  = {
		id: null,
		target_name: null,
		name: null,
		host: null,
		port: null,
		username: null,
		password: null

	}
	constructor(private targetService: TargetService, private toastrService: ToastrService, private router:Router, private route:ActivatedRoute){}
	ngOnInit() {
    console.log("<<<< target-edit comp started >>>")
    this.dbId = parseInt(this.route.snapshot.params['id']);
    this.isLoading = true;
	   this.targetService.getTargets(this.dbId)
	   .subscribe(
	     data => {
	       this.isLoading = false;
	       if(typeof data == 'undefined')
	       	{
	       		this.toastrService.error('Invalid Id Selected', 'Error');
			      this.router.navigate(['/targets']);
	       	}
	       	this.database_form.target_name = data.target_name;
	       	this.database_form.id = data.id;
	       	this.database_form.name = data.name;
	       	this.database_form.host = data.host;
	       	this.database_form.port = data.port;
	       	this.database_form.username = data.username;
	       	this.database_form.password = data.password;
	       },
	       err => {
	        this.toastrService.error('Error Occurred. Please try again', 'Error');
			    this.router.navigate(['/targets']);
	       }
	     )
	  }

	  /**
	   * Login a user
	   */
	EditSave() {
      this.isLoading = true;
		this.targetService.editDatabase(this.dbId, this.database_form)
		.subscribe(
			data => {
        this.isLoading = false;
				this.toastrService.success('Target Database is updated', 'Success');
				this.router.navigate(['/targets']);
			},
			err => {
				this.toastrService.error(err, 'Error');
			}
		);
	}
}
