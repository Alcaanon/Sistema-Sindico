import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon, IonInput } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { businessOutline, personOutline, lockClosedOutline, alertCircleOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    IonIcon,
    IonButton,
    IonInput,
    CommonModule,
    ReactiveFormsModule,
    IonContent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  public loginForm: FormGroup = this.fb.group({
    cpf: ['', [Validators.required, Validators.minLength(11)]],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  public isLoading = false;
  public errorMessage: string | null = null;
  public mostrarSenha = false;

  constructor() {
    addIcons({
      'business-outline': businessOutline,
      'person-outline': personOutline,
      'lock-closed-outline': lockClosedOutline,
      'alert-circle-outline': alertCircleOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline
    });
  }

  public formatarCpf(event: any): void {
    let valor = event.target.value || '';
    valor = valor.replace(/\D/g, '');
    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }
    valor = valor
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');

    this.loginForm.get('cpf')?.setValue(valor, {
      emitEvent: false
    });
  }

  public toggleSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  public fazerLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const payload = {
      cpf: this.loginForm.value.cpf.replace(/\D/g, ''),
      senha: this.loginForm.value.senha
    };

    this.authService.login(payload).subscribe({
      next: async () => {
        try {
          const userData = await this.authService.getUserData();

          this.isLoading = false;

          if (!userData) {
            this.errorMessage = 'Não foi possível recuperar os dados do usuário.';
            return;
          }

          if (!userData.aceiteLgpd) {
            this.router.navigate(['/termos']);
            return;
          }

          if (userData.perfil === 'SINDICO') {
            this.router.navigate(['/sindico']);
          } else {
            this.router.navigate(['/morador']);
          }

        } catch (error) {
          this.isLoading = false;
          this.errorMessage = 'Erro ao recuperar os dados do usuário.';
        }
      },
      error: (err) => {
        this.isLoading = false;

        if (err.status === 401) {
          this.errorMessage = 'CPF ou senha inválidos.';
        } else {
          this.errorMessage =
            'Erro ao conectar ao servidor. Tente novamente mais tarde.';
        }
      }
    });
  }
}