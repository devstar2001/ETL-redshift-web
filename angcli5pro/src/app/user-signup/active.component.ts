import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { UserService } from '../shared/services/user.service';

@Component({
  template: ''
})
export class ActiveComponent implements OnInit {
  constructor(
      private router: Router,
      private route: ActivatedRoute,
      private userService: UserService,
    ) {}
  token
  myData: any[] = [];
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      // console.log(this.token);
      });

    this.userService.activeRequest(this.token).subscribe(
      (res: any) => {
         this.myData = res.data;
         // console.log(res);
         this.router.navigate(['/']);
      },
      err => {
//        this.toastrService.error(err, 'Error');
      }
    );
  }
}
