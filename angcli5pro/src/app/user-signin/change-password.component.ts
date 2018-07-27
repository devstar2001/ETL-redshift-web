import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../shared/services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  templateUrl: './change-password.component.html',
  styleUrls: ['../app.component.css']
})

export class ChangePasswordComponent implements OnInit {

  isLoading = false;
  username;
  user_domain;
  firs_password;
  second_password;
  constructor(private userService: UserService,
              private router: Router,
              private route: ActivatedRoute,
              private toastrService: ToastrService) {
  }

  ngOnInit() {
    // console.log('<<<< change-password comp started >>>');
    this.route.queryParams.subscribe(
      params => {
        this.username = params['user_email'];
        const a = this.username.indexOf('@');
        const b = this.username.indexOf('.');
        this.user_domain = this.username.substring(0, a + 1);
        // console.log(this.username);
    });
  }

  sendPassword() {
    if (this.firs_password !== this.second_password) {
      this.toastrService.error('Password is not equal.');
      return;
    }
    this.isLoading = true;
    this.userService.changePasswordFor(this.username, this.firs_password).subscribe(
      data => {
        this.isLoading = false;
        this.toastrService.success('Your password is changed successfully.');
        this.router.navigate(['/signin']);
      },
      err => {
          this.toastrService.error(err, 'Error');
      }
    );
  }

}
