import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OuvidoriaSindicoComponent } from './ouvidoria-sindico.component';

describe('OuvidoriaSindicoComponent', () => {
  let component: OuvidoriaSindicoComponent;
  let fixture: ComponentFixture<OuvidoriaSindicoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OuvidoriaSindicoComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(OuvidoriaSindicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
