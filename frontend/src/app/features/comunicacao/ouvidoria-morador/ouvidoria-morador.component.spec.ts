import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OuvidoriaMoradorComponent } from './ouvidoria-morador.component';

describe('OuvidoriaMoradorComponent', () => {
  let component: OuvidoriaMoradorComponent;
  let fixture: ComponentFixture<OuvidoriaMoradorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OuvidoriaMoradorComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(OuvidoriaMoradorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
