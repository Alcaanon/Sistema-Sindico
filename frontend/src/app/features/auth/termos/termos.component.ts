import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonItem, IonLabel, IonButton } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-termos',
  standalone: true,
  imports: [IonButton, CommonModule, FormsModule, IonContent],
  templateUrl: './termos.component.html',
  styleUrls: ['./termos.component.scss']
})
export class TermosComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  public aceiteTermos = false;
  public isLoading = false;

  public async confirmarTermos(): Promise<void> {
    if (!this.aceiteTermos) return;

    this.isLoading = true;

    const userData = await this.authService.getUserData();

    if (!userData || !userData.id) {
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    const payloadUpdate = {
      aceiteLgpd: true,
      dataAceite: new Date().toISOString()
    };

    this.authService.atualizarUsuario(userData.id, payloadUpdate).subscribe({
      next: () => {
        this.isLoading = false;

        if (userData.perfil === 'SINDICO') {
          this.router.navigate(['/sindico']);
        } else {
          this.router.navigate(['/morador']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erro ao registrar aceite da LGPD', err);
      }
    });
  }
}