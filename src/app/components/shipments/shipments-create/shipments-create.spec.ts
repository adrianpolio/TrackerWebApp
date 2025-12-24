import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentsCreate } from './shipments-create';

describe('ShipmentsCreate', () => {
  let component: ShipmentsCreate;
  let fixture: ComponentFixture<ShipmentsCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipmentsCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipmentsCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
