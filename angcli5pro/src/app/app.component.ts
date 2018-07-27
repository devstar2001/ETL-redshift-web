/*tslint:disable*/
import {Component, EventEmitter, HostListener, Inject, Injectable, Input, OnInit, Output} from '@angular/core';
import {UserService} from './shared/services/user.service';
import {ActivatedRoute, NavigationEnd, NavigationExtras, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {DOCUMENT} from '@angular/common';
import {WINDOW} from './window.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent implements OnInit {

  cloudBackgroundShow = false;
  indexContentShow =  false;
  subscribeEmail = '';

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: ToastrService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window: Window

  )
  {

    this.router.events
      .filter(event => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        // console.log();
      });

  }

  ngOnInit() {

    this.router.events
      .filter((event) => event instanceof NavigationEnd)
      .map(() => this.route)
      .map((route) => {
        while (route.firstChild) {
            route = route.firstChild;
          }
        return route;
      })
      .filter((route) => route.outlet === 'primary')
      .mergeMap((route) => route.data)
      .subscribe((event) => {

        this.indexContentShow = typeof(event.indexContentShow) === 'undefined' ? 0 : event.indexContentShow;
        this.cloudBackgroundShow = typeof(event.cloudBackgroundShow) === 'undefined' ? 1 : event.cloudBackgroundShow;

      });
  }

  @HostListener('window:scroll', ['$event'])
  public onWindowScroll(event: Event): void {
    const offset = this.window.pageYOffset || this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;

    let header_ele = this.document.getElementById("header")
    let banner_ele = this.document.getElementById("banner")
    if (banner_ele==null) return
    if (this.cloudBackgroundShow){
      if (offset > banner_ele.clientHeight)
      {
        header_ele.classList.add("reveal");
        header_ele.classList.remove("alt");
        header_ele.classList.remove("fix");

      }
      else {
        header_ele.classList.add("reveal");
        header_ele.classList.add("alt");
        header_ele.classList.remove("fix");

      }
    }else {
      header_ele.classList.remove("reveal");
      header_ele.classList.remove("alt");
      header_ele.classList.add("fix");
    }

  }
  /**
   * Is the user logged in?
   */
  get indexContentShowF() {
    return this.indexContentShow;
  }

  /**
   * Is the user logged in?
   */
  get cloudBackgroundShowF() {
    return this.cloudBackgroundShow;
  }



  /**
   * Is the user logged in?
   */
  get isLoggedIn() {
    return this.userService.isLoggedIn();
  }

  /**
   * Is the user logged in?
   */
  get loggedInData() {
    return this.userService.getLoggedInData();
  }

  /**
   * Log the user out
   */
  logout() {
    this.userService.logout();
    this.router.navigate(['/signin']);
  }
  /**
   * Sign up
   * */
  signup(){
    let navigationExtras: NavigationExtras = {
      queryParams: {
        'active_status':false,
      }
    };

    this.router.navigate(['/signup'],navigationExtras);
  }

  /**
   * Log the user out
   */
  onSubmit() {
    this.userService.subscribeEmail(this.subscribeEmail).subscribe(
      data => {
        this.subscribeEmail = '';
        this.toastrService.success('Registered', 'Success');
      },
      err => {
        this.subscribeEmail = '';
        this.toastrService.success('Registered', 'Success');
      }
    );
  }
}
