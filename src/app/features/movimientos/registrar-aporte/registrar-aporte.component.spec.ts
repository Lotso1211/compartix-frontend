import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarAporteComponent } from './registrar-aporte.component';

describe('RegistrarAporteComponent', () => {
  let component: RegistrarAporteComponent;
  let fixture: ComponentFixture<RegistrarAporteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarAporteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarAporteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
