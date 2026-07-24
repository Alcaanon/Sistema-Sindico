import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService, UsuarioPayload } from '../../../../core/services/api.service';

@Component({
  selector: 'app-cadastro-usuario',
  standalone: true,
  imports: [CommonModule, IonContent, ReactiveFormsModule], 
  templateUrl: './cadastro-usuario.component.html',
  styleUrls: ['./cadastro-usuario.component.scss']
})
export class CadastroUsuarioComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private location = inject(Location);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public cadastroForm!: FormGroup;
  public isSubmitting = false;
  public unidadesDisponiveis: any[] = [];
  public perfilDefinido = 'MORADOR';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['perfilAcesso']) {
        this.perfilDefinido = params['perfilAcesso'];
      }
    });

    this.iniciarFormulario();
    this.carregarUnidades();
  }

  private iniciarFormulario() {
    this.cadastroForm = this.fb.group({
      nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      whatsapp: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      unidadeNumero: ['', [Validators.required]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      aceiteLgpd: [false, [Validators.requiredTrue]]
    });
  }

  private carregarUnidades() {
    this.apiService.getUnidades().subscribe({
      next: (unidades) => {
        this.unidadesDisponiveis = unidades;
      },
      error: (err) => {
        console.error('Erro ao carregar lista de unidades:', err);
      }
    });
  }

  public onSubmit() {
    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValues = this.cadastroForm.value;

    const payload: UsuarioPayload = {
      unidadeNumero: formValues.unidadeNumero,
      nomeCompleto: formValues.nomeCompleto,
      cpf: formValues.cpf,
      whatsapp: formValues.whatsapp,
      email: formValues.email,
      perfil: this.perfilDefinido,
      senha: formValues.senha,
      aceiteLgpd: formValues.aceiteLgpd,
      dataAceite: new Date().toISOString() 
    };

    this.apiService.criarUsuario(payload).subscribe({
      next: () => {
        alert('Usuário cadastrado com sucesso!');
        this.voltar();
      },
      error: (err) => {
        console.error('Erro na requisição', err);
        if (err.status === 409) {
          alert('Este CPF já encontra-se cadastrado no sistema.');
        } else {
          alert('Erro ao cadastrar usuário. Verifique os dados e tente novamente.');
        }
        this.isSubmitting = false;
      }
    });
  }

  public temErro(campo: string): boolean {
    const control = this.cadastroForm.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  public voltar() {
    this.location.back();
  }
}