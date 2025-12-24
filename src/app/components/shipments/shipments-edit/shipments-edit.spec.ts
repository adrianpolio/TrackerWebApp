import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentsEdit } from './shipments-edit';

describe('ShipmentsEdit', () => {
  let component: ShipmentsEdit;
  let fixture: ComponentFixture<ShipmentsEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipmentsEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipmentsEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
