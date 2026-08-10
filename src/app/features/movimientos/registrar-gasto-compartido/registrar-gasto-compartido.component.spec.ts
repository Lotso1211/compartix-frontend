import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarGastoCompartidoComponent } from './registrar-gasto-compartido.component';

describe('RegistrarGastoCompartidoComponent', () => {
  let component: RegistrarGastoCompartidoComponent;
  let fixture: ComponentFixture<RegistrarGastoCompartidoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarGastoCompartidoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarGastoCompartidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
