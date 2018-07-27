import { Component, OnInit } from '@angular/core';
import { Router} from '@angular/router';
import {UserService} from '../shared/services/user.service';
import { ToastrService } from 'ngx-toastr';
/*tslint:disable*/
@Component({
  templateUrl: './send-passwordlink.component.html',
  styleUrls: ['../app.component.css']
})

export class ForgotPasswordComponent implements OnInit {
  credentials = {username: '', password: ''};
  isLoading: boolean = false;
  sendOK:boolean = false;
  constructor(private userService: UserService,
              private router: Router,
              private toastrService: ToastrService) {
  }

  ngOnInit() {
    // console.log("<<<< send-passwordlink-comp started >>>")

  }
  send(){
    let username = this.credentials.username;
    this.isLoading = true;
    this.userService.sendMailFor(this.credentials.username).subscribe(
      data =>{
        this.sendOK = true;
        this.isLoading = false;
        this.toastrService.success('Sent password reset link to ' + this.credentials.username, 'Success');
      },
    err => {
      if (err.indexOf("exist") > -1){
          this.toastrService.error('Can\'t find that email, sorry.')
      } else
        this.toastrService.error(err, 'Error');
    }
    );
  }

}
