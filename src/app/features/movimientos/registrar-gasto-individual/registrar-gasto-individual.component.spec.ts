import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarGastoIndividualComponent } from './registrar-gasto-individual.component';

describe('RegistrarGastoIndividualComponent', () => {
  let component: RegistrarGastoIndividualComponent;
  let fixture: ComponentFixture<RegistrarGastoIndividualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarGastoIndividualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarGastoIndividualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
