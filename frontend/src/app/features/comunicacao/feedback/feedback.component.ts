import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent],
  templateUrl: './feedback.component.html'
})
export class FeedbackComponent {
  private api = inject(ApiService);
  private location = inject(Location);
  private fb = inject(FormBuilder);

  public feedbackForm: FormGroup = this.fb.group({
    tipo: ['SUGESTAO', Validators.required],
    comentario: ['', Validators.required],
    nota: [5] // Nota padrão, pode ser expandida depois para um seletor de estrelas
  });

  public isSending = false;

  public enviar() {
    if (this.feedbackForm.valid) {
      this.isSending = true;
      this.api.enviarAvaliacao(this.feedbackForm.value).subscribe({
        next: () => {
          alert('Feedback enviado com sucesso! Obrigado por ajudar.');
          this.location.back();
        },
        error: () => {
          alert('Erro ao enviar feedback.');
          this.isSending = false;
        }
      });
    }
  }

  public voltar() { this.location.back(); }
}