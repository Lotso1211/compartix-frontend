import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarMultaComponent } from './registrar-multa.component';

describe('RegistrarMultaComponent', () => {
  let component: RegistrarMultaComponent;
  let fixture: ComponentFixture<RegistrarMultaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarMultaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarMultaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
