import { TestBed } from '@angular/core/testing';

import { KeyManagement } from './key-management';

describe('KeyManagement', () => {
  let service: KeyManagement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeyManagement);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
