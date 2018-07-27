/* tslint:disable */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../shared/services/loader.service'
import {UserService} from "../shared/services/user.service";


@Component({
  templateUrl: './loader-list.component.html',
  styleUrls: ['../app.component.css'],
  // styles: []
})
export class LoaderListComponent implements OnInit{
	constructor(
		private loaderService: LoaderService,
        private router:Router,
        private userService:UserService,
        private toastrService: ToastrService,
	){}
	loaderList;
  isRunnings=[];
  isDeletings=[];
  isCopyings=[];
  timerInterval;
  loadingData: boolean = true
	ngOnInit() {
        // console.log("<<<< Loader comp started >>>")
        this.loaderService.getLoaders()
          .subscribe(
              data => {
                this.loaderList = data;
                this.loadingData = false;
                for (var i=0;i<data.length;i++)
                {
                  this.isRunnings[i] = false;
                  this.isDeletings[i] = false;
                  this.isCopyings[i] = false;
                }

              },
                err => {
                  if ( err.indexOf('No such user') >=0)
                  {
                    this.toastrService.error("Your Token is expired.\n Please login again.")
                    this.userService.logout();
                    this.router.navigate(['/signin']);
                  }
                  else
                    this.toastrService.error('Error ', err)

                }
        )
        this.timerInterval = setInterval(() => {
              this.loadLoaders();
        }, 60000);
  }

  	loadLoaders() {
        this.loaderService.getLoaders()
            .subscribe(
                data => this.loaderList = data,
                err => {
                    // console.log('Error ' + err)
                }
            )
	  }
    editLoader(bundle_id){
        localStorage.setItem('bundleId', bundle_id);
        this.router.navigate(['/loader/summary']);
    }

    deleteLoader(bundleId, index) {
      this.isDeletings[index] = true;
        this.loaderService.deleteLoaderSettings(bundleId)
            .subscribe(
                data => {
                  this.isDeletings[index] = false;
                    this.toastrService.success('Loader Deleted.', 'Success');
                    this.loadLoaders();
                },
                err => {
                  this.isDeletings[index] = false;
                    this.toastrService.error('Error in Deleting Loader. Please try again', 'Error');
                    console.log('Error ' + err)
                }
            )
	}

    // stopLoader(bundleId) {
    //     this.loaderService.stopLoaderSettings(bundleId)
    //         .subscribe(
    //             data => {
    //                 this.toastrService.success('Loader Stopped.', 'Success');
    //                 this.loadLoaders();
    //             },
    //             err => {
    //                 this.toastrService.error(err, 'Error');
    //                 // this.toastrService.error('Error in Stopping Loader. Please try again', 'Error');
    //                 console.log('Error ' + err)
    //             }
    //         )
    // }

    runLoader(bundleId, index) {
        this.isRunnings[index] = true;
        this.loaderService.runLoader(bundleId)
            .subscribe(
              data => {
                this.isRunnings[index] = false;
                this.toastrService.success('Loader has worked successfully.', 'Success');
                this.loadLoaders();
                },
              err => {
                this.isRunnings[index] = false;
                if ( err.indexOf('No such user') >=0)
                {
                  this.toastrService.error("Your Token is expired.\n Please login again.")
                  this.userService.logout();
                  this.router.navigate(['/signin']);
                }
                else
                {
                  if(JSON.parse(err)['details'])
                    this.toastrService.error(JSON.parse(err)['details'])
                }

                    // this.toastrService.error('Issue while running loader.\n Please try again', 'Error');
                }
            )
    }

    copyLoader(bundleId, index) {
      this.isCopyings[index] = true;
        this.loaderService.copyLoaderSettings(bundleId)
            .subscribe(
                data => {
                  this.isCopyings[index] = false;
                    this.toastrService.success('Loader Copied. Please update the new settings.', 'Success');
                },
                err => {
                  this.isCopyings[index] = false;
                  if ( err.indexOf('No such user') >=0)
                  {
                    this.toastrService.error("Your Token is expired.\n Please login again.")
                    this.userService.logout();
                    this.router.navigate(['/signin']);
                  }
                  else
                    // this.toastrService.error('Error ', err)
                    this.toastrService.error('Error in Copying Loader. Please try again', 'Error');
                    // console.log('Error ' + err)
                }
            )
    }

    ngOnDestroy() {
        // Will clear when component is destroyed e.g. route is navigated away from.
        clearInterval(this.timerInterval);
    }


}
