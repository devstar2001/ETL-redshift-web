/*tslint:disable*/
import { Component, OnInit } from '@angular/core';
import { Router} from '@angular/router';
import {UserService} from '../shared/services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  templateUrl: './user-signin.component.html',
  styleUrls: ['../app.component.css']
})
export class UserSignInComponent implements OnInit {
  credentials = { username: '', password: '' };
  recapcha_flag = false;
  isLoading = false;
  constructor(
    private userService: UserService,
    private router: Router,
    private toastrService: ToastrService
  ) {}
  ngOnInit() {
        // console.log('<<<< user-signin comp started >>>')
     this.recapcha_flag = true;
    localStorage.setItem("source_path",'/')
  }
  /**
   * Login a user
   */
  login() {
    if (!this.recapcha_flag) {
      this.router.navigate(['/signin']);
      return;
    }
    this.isLoading = true;
    this.userService.login(this.credentials.username, this.credentials.password).subscribe(
      data => {
        this.isLoading = false;
        this.toastrService.success('Logged In', 'Success');
        this.router.navigate(['/sources']);
        },
        err => {
        this.isLoading = false;
        // if (err.indexOf("Unauthorized") != -1)
        this.toastrService.error(err, 'Error');
      }
      );
  }
  /**
   * Robot checking via reCapcha
   */
  handleCorrectCaptcha($event) {
    this.recapcha_flag = event.isTrusted;
  }
}
