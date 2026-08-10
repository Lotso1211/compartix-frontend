import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesViewComponent } from './reportes-view.component';

describe('ReportesViewComponent', () => {
  let component: ReportesViewComponent;
  let fixture: ComponentFixture<ReportesViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
