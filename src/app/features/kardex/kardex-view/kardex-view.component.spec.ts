import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KardexViewComponent } from './kardex-view.component';

describe('KardexViewComponent', () => {
  let component: KardexViewComponent;
  let fixture: ComponentFixture<KardexViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KardexViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KardexViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
