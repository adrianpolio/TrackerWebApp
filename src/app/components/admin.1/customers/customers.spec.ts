import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCustomers } from './admin-customers';

describe('AdminCustomers', () => {
  let component: AdminCustomers;
  let fixture: ComponentFixture<AdminCustomers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCustomers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCustomers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
