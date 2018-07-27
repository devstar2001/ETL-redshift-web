/* tslint:disable*/
import {Component, HostListener, Inject, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {DOCUMENT} from '@angular/common';
@Component({
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit{
  cloudBackgroundShow = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ){
    this.router.events
      .filter(event => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        // console.log();
      });
  }
  ngOnInit() {
    this.router.events
      .filter((event) => event instanceof NavigationEnd)
      .map(() =>
        this.route)
      .map((route) => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      })
      .filter((route) => route.outlet === 'primary')
      .mergeMap((route) => route.data)
      .subscribe((event) => {


        this.cloudBackgroundShow = typeof(event.cloudBackgroundShow) === 'undefined' ? 1 : event.cloudBackgroundShow;

      });

  }

  /**
   * Is the user logged in?
   */
  get cloudBackgroundShowF() {
    return this.cloudBackgroundShow;
  }
}
