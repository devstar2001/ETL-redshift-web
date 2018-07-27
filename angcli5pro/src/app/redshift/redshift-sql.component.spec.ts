import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RedshiftSqlComponent } from './redshift-sql.component';

describe('RedshiftSqlComponent', () => {
  let component: RedshiftSqlComponent;
  let fixture: ComponentFixture<RedshiftSqlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RedshiftSqlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RedshiftSqlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
