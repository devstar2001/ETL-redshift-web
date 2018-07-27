/*tslint:disable*/

import { BrowserModule } from '@angular/platform-browser';
import {Injectable, NgModule} from '@angular/core';
import { AppComponent } from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {HomeModule} from './home/home.module';
import {HttpModule} from '@angular/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ToastrModule} from 'ngx-toastr';
import {AuthGuard} from './shared/guards/auth-guard.service';
import {ActiveComponent} from './user-signup/active.component';
import {FileUploadModule} from 'ng2-file-upload';
import {AboutComponent} from './about/about.component';
import {CanDeactivateGuard} from './shared/guards/can-deactivate-guard.service';
import {UserProfileComponent} from './users/user-profile.component';
import {UserFormComponent} from './users/user-form.component';
import {UserSourceComponent} from './source/source.component';
import {UserSourceAddComponent} from './source/source-add.component';
import {NotFoundComponent} from './not-found/notfound.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import 'reflect-metadata';
import { ClipboardService} from 'ngx-clipboard';
import { ClipboardModule } from 'ngx-clipboard';
import {ContextMenuModule} from 'ngx-contextmenu';
import {DataTablesModule} from 'angular-datatables';

import {
        MatAutocompleteModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatCheckboxModule,
        MatChipsModule,
        MatDatepickerModule,
        MatDialogModule,
        MatDividerModule,
        MatFormFieldModule,
        MatExpansionModule,
        MatGridListModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatNativeDateModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatRadioModule,
        MatRippleModule,
        MatSelectModule,
        MatSidenavModule,
        MatSliderModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatSortModule,
        MatStepperModule,
        MatTableModule,
        MatTabsModule,
        MatToolbarModule,
        MatTooltipModule
        } from '@angular/material';


import {CdkTableModule} from '@angular/cdk/table';
import {SourceConvertPdfComponent} from './source/source-convert-pdf.component';
// import {EditableTableService} from 'ng-editable-table';
import {WINDOW_PROVIDERS} from './window.service';
import {SourceWebComponent} from './source/source-web.component';
import { TabsModule } from 'ngx-bootstrap/tabs';
import {MyHttpInterceptor } from './httpinterceptor';
import {Router} from '@angular/router';
import {PdfViewerModule} from 'ng2-pdf-viewer';
import {RedshiftSqlComponent} from './redshift/redshift-sql.component';


@NgModule({
  exports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatStepperModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,

  ],

})
export class DemoMaterialModule {}


@NgModule({
  imports: [
    DemoMaterialModule,ContextMenuModule.forRoot(),ClipboardModule,ReactiveFormsModule,TabsModule.forRoot(),
    BrowserModule, FormsModule, AppRoutingModule, HomeModule,HttpClientModule,BsDropdownModule.forRoot(),
    HttpModule, BrowserAnimationsModule,CdkTableModule,
    ToastrModule.forRoot(), FileUploadModule,DataTablesModule

  ],

  declarations: [
    AppComponent, UserProfileComponent, UserFormComponent,RedshiftSqlComponent,
    AboutComponent, UserSourceComponent,UserSourceAddComponent, NotFoundComponent,SourceWebComponent,
    ActiveComponent, SourceConvertPdfComponent

  ],

  providers: [AuthGuard, CanDeactivateGuard, ClipboardService,
    WINDOW_PROVIDERS,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MyHttpInterceptor ,
      multi: true

    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
