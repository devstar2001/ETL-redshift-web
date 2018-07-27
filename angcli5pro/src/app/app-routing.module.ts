import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {NotFoundComponent} from './not-found/notfound.component';
import {ChangePasswordComponent} from './user-signin/change-password.component';
import {ActiveComponent} from './user-signup/active.component';
import {LoaderSummaryComponent} from './loaders/loader-summary.component';
import {LoaderTransformComponent} from './loaders/loader-transformation.component';
import {UserSourceLoadRedComponent} from './source/source-select-red.component';
import {LoaderSettingComponent} from './loaders/loader-settings.component';
import {UserTargetEditComponent} from './target/target-edit.component';
import {UserTargetAddComponent} from './target/target-add.component';
import {LoaderListComponent} from './loaders/loader-list.component';
import {UserTargetListComponent} from './target/target.component';
import {UserSourceAddComponent} from './source/source-add.component';
import {SourceConvertPdfComponent} from './source/source-convert-pdf.component';
import {UserSourceComponent} from './source/source.component';
import {ForgotPasswordComponent} from './user-signin/send-passwordlink.component';
import {UserSignInComponent} from './user-signin/user-signin.component';
import {UserSignUpComponent} from './user-signup/user-signup.component';
import {AuthGuard} from './shared/guards/auth-guard.service';
import {SourceWebComponent} from './source/source-web.component';
import {RedshiftSqlComponent} from './redshift/redshift-sql.component';

const routes: Routes = [
  {path: '', component: HomeComponent, data: {cloudBackgroundShow: true, indexContentShow: true}},
  {path: 'signup', component: UserSignUpComponent, data: {cloudBackgroundShow: false}},
  {path: 'signin', component: UserSignInComponent, data: {cloudBackgroundShow: false}},
  {path: 'forgot', component: ForgotPasswordComponent},
  {path: 'sources', component: UserSourceComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: 'sources/scrape', component: SourceWebComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: 'sources/convert/pdf', component: SourceConvertPdfComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: 'sources/add', component: UserSourceAddComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: 'targets', component: UserTargetListComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: 'loaders', component: LoaderListComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: 'targets/add', component: UserTargetAddComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: 'targets/edit/:id', component: UserTargetEditComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: 'loader/settings', component: LoaderSettingComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: 'loader/targets', component: UserSourceLoadRedComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: 'loader/transforms', component: LoaderTransformComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: 'loader/summary', component: LoaderSummaryComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: 'front/active', component: ActiveComponent},
  {path: 'front/change', component: ChangePasswordComponent},
  {path: 'redshift', component: RedshiftSqlComponent, canActivate: [AuthGuard], data: {cloudBackgroundShow: false}},
  {path: '**', component: NotFoundComponent},
];

// export const appRouting: ModuleWithProviders = RouterModule.forRoot(appRoutes,{ useHash: true });
@NgModule({
  imports: [ RouterModule.forRoot(routes, {useHash: true}) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
