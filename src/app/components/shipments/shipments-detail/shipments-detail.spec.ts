import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentsDetail } from './shipments-detail';

describe('ShipmentsDetail', () => {
  let component: ShipmentsDetail;
  let fixture: ComponentFixture<ShipmentsDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipmentsDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipmentsDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
