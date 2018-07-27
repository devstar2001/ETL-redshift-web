import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {TargetService} from '../shared/services/target.service';
import {UserService} from '../shared/services/user.service';

/* tslint:disable */
@Component({
  templateUrl: './target.component.html',
  styleUrls: ['../app.component.css'],
  styles: []
})
export class UserTargetListComponent implements OnInit {
	constructor(private targetService: TargetService,
				private toastrService: ToastrService,
				private userService: UserService,
				private router:Router) {}

	  targetist;
    loadingData: boolean = true
	ngOnInit() {
        console.log("<<<< Target comp started >>>")
      this.targetService.getTargets()
        .subscribe(
          data => {
            this.targetist = data;
            this.loadingData=false;
          },
          err => {
            if ( err.indexOf('No such user') >=0)
            {
              this.toastrService.error("Your Token is expired.\n Please login again.")
              this.userService.logout();
              this.router.navigate(['/signin']);
            }

          }
        )
	   // this.refreshList()
	  }

	  refreshList() {
	  	this.targetService.getTargets()
	   .subscribe(
	       data => {

	            this.targetist = data;
              this.loadingData=false;
         },
             err => {
               if ( err.indexOf('No such user') >= 0)
               {
                 this.toastrService.error("Your Token is expired.\n Please login again.")
                 this.userService.logout();
                 this.router.navigate(['/signin']);
               }

             }
	     )
	  }

	  deleteTarget(id) {
	  	this.targetService.deleteTarget(id)
		.subscribe(
			data => {
				this.refreshList()
				this.toastrService.success('Target Database is deleted', 'Success');
			},
			err => {
				this.toastrService.error(err, 'Error');
			}
		);
	  }

	  testConnection(id) {
	  	this.targetService.testConnection(id)
		.subscribe(
			data => {
				this.toastrService.success(data.msg, 'Success');
			},
			err => {
				this.toastrService.error(err, 'Error');
			}
		);
	  }

}
