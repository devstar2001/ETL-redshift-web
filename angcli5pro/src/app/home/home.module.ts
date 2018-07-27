import {Injectable} from '@angular/core';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {homeRouting} from './home.routing';
import {FormControl, FormGroup, FormsModule, Validators} from '@angular/forms';
import {AngularMultiSelectModule} from 'angular2-multiselect-dropdown';
import {CommonModule} from '@angular/common';
import {ReCaptchaModule} from 'angular2-recaptcha';
import {HomeComponent} from './home.component';
import {UserSignUpComponent} from '../user-signup/user-signup.component';
import {UserSignInComponent} from '../user-signin/user-signin.component';
import {ForgotPasswordComponent} from '../user-signin/send-passwordlink.component';
import {ChangePasswordComponent} from '../user-signin/change-password.component';
import {MainHomeComponent} from '../main-home/main-home.component';
import {UserSourceLoadRedComponent} from '../source/source-select-red.component';
import {SourceConvertPdfComponent} from '../source/source-convert-pdf.component';
import {UserService} from '../shared/services/user.service';
import {SourceService} from '../shared/services/source.service';
import {TargetService} from '../shared/services/target.service';
import {LoaderService} from '../shared/services/loader.service';
import {UserTargetListComponent} from '../target/target.component';
import {UserTargetAddComponent} from '../target/target-add.component';
import {LoaderListComponent} from '../loaders/loader-list.component';
import {UserTargetEditComponent} from '../target/target-edit.component';
import {LoaderTransformComponent} from '../loaders/loader-transformation.component';
import {LoaderSummaryComponent} from '../loaders/loader-summary.component';
import {LoaderSettingComponent} from '../loaders/loader-settings.component';
import {Ng4LoadingSpinnerModule} from 'ng4-loading-spinner';
import { ModalModule } from 'ngx-bootstrap/modal';
import {BsDropdownModule} from 'ngx-bootstrap';
import {AmazingTimePickerModule} from 'amazing-time-picker';
import {WINDOW_PROVIDERS} from '../window.service';

import {RedshiftSqlComponent} from '../redshift/redshift-sql.component';
import {RedshiftService} from '../shared/services/redshift.service';


/*tslint:disable*/

@NgModule({
  imports : [
    homeRouting, CommonModule, FormsModule, AngularMultiSelectModule,Ng4LoadingSpinnerModule,
    ModalModule.forRoot(),BsDropdownModule,AmazingTimePickerModule,
    ReCaptchaModule ],
  declarations : [

    HomeComponent,
    UserSignUpComponent,
    UserSignInComponent,
    ForgotPasswordComponent,
    ChangePasswordComponent,
		MainHomeComponent,
		UserTargetListComponent,
		UserTargetAddComponent,
		UserSourceLoadRedComponent,
		LoaderListComponent,
		UserTargetEditComponent,
		LoaderSettingComponent,
		LoaderTransformComponent,
		LoaderSummaryComponent,


  ],
  providers: [UserService, SourceService, TargetService, LoaderService, RedshiftService],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})

export class HomeModule{}
