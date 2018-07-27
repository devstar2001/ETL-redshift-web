import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {UserService} from '../shared/services/user.service';
import {User} from '../shared/models/user';
import { ToastrService } from 'ngx-toastr';
/*tslint:disable*/
@Component({
  templateUrl: './user-signup.component.html',
  styleUrls: ['../app.component.css']
})
export class UserSignUpComponent implements OnInit{
	user: User = new User();
  recapcha_flag:boolean = true;
  isLoading: boolean;
  active_status =false;
  first_password;
  second_password;
  isMatched:boolean = true;
	constructor(
		private route: ActivatedRoute,
		private userService: UserService,
		private router:Router,
		private toastrService: ToastrService
	){}
	ngOnInit(){
    // console.log("<<<< user-signup comp started >>>")
      // this.recapcha_flag = true;
    // this.route.queryParams.subscribe(params => {
    //   this.active_status= (params['active_status']==='true');
    // });
	}
	register() {

    if (this.first_password != this.second_password)
    {
      this.isMatched = false
      this.toastrService.error('Password is not equal.', 'Error');
      return;
    }
    this.isLoading =true;
		this.userService.register(this.user.username, this.first_password, this.user.last_name, this.user.first_name)
      .subscribe(
       (res: any) => {

        this.active_status = true;
        this.toastrService.success('Registered', 'Success');
        this.isLoading =false;

			},
			err => {
        this.isLoading =false;
        this.toastrService.error(err, 'Error');
			}
		);
	}
  /**
   * Robot checking via reCapcha
   */
  handleCorrectCaptcha($event){
    this.recapcha_flag = event.isTrusted;
  }
}
