import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { IaService, IaConsultaResponse, IaEscaneoResponse } from '../../core/services/ia.service';
import { GrupoService } from '../../core/services/grupo.service';
import { IaMarkdownPipe } from '../../core/pipes/ia-markdown.pipe';
// y en imports del @Component:


export interface Mensaje {
  tipo:                   'usuario' | 'ia' | 'accion' | 'error';
  texto:                  string;
  hora:                   Date;
  intencion?:             string;
  confianza?:             number;
  accionRealizada?:       string;
  movimientoId?:          number;
}

@Component({
  selector: 'app-ia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatCardModule,
    IaMarkdownPipe
  ],
  templateUrl: './ia.component.html',
  styleUrls: ['./ia.component.scss']
})
export class IaComponent implements OnInit {

  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  grupoId!: number;
  rolUsuario = 'MIEMBRO';
  pregunta = '';
  mensajes: Mensaje[] = [];
  loadingChat = false;

  // Escaneo
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  loadingEscaneo = false;
  resultadoEscaneo: IaEscaneoResponse | null = null;

  // Formulario confirmación gasto
  formGasto: FormGroup;
  guardandoGasto = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private iaService: IaService,
    private grupoService: GrupoService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.formGasto = this.fb.group({
      descripcion: ['', Validators.required],
      monto:       [null, [Validators.required, Validators.min(0.01)]],
      fecha:       ['', Validators.required]
    });
  }

  get esDirectiva(): boolean {
    return this.rolUsuario === 'DIRECTIVA';
  }

  ngOnInit(): void {
    this.grupoId = Number(this.route.snapshot.paramMap.get('grupoId'));
    this.grupoService.obtenerMiRol(this.grupoId).subscribe({
      next: (rol) => {
        this.rolUsuario = rol;
        this.agregarMensajeBienvenida();
      },
      error: () => this.agregarMensajeBienvenida()
    });
  }

  agregarMensajeBienvenida(): void {
    let texto = `Soy el asistente financiero de **CompartiX**.\n\n`;

    if (this.esDirectiva) {
      texto += `**Puedo ayudarte a consultar:**\n` +
               `• Saldo del grupo o personal\n` +
               `• Deudas pendientes\n` +
               `• Aportes y ranking de pagos\n` +
               `• Gastos del grupo\n` +
               `• Multas\n` +
               `• Miembros y roles\n\n` +
               `**También puedo registrar movimientos:**\n` +
               `• *"Juan pagó 50 Bs"* → registra un aporte\n` +
               `• *"Gastamos 100 entre todos"* → registra un gasto compartido\n` +
               `• *"Ponle una multa a Pedro de 20 Bs"* → registra una multa\n` +
               `• *"Ingresó 300 al fondo"* → registra un ingreso directo`;
    } else {
      texto += `**Puedo ayudarte a consultar tu información personal:**\n` +
               `• Tu saldo y kardex\n` +
               `• Tus deudas y cuotas pendientes\n` +
               `• Tus aportes\n` +
               `• Tus multas\n\n` +
               `Por privacidad, solo puedo mostrarte tus propios datos, no los del grupo ni los de otros miembros.`;
    }

    this.mensajes.push({ tipo: 'ia', texto, hora: new Date() });
  }

  enviarPregunta(): void {
    const texto = this.pregunta.trim();
    if (!texto || this.loadingChat) return;

    this.mensajes.push({ tipo: 'usuario', texto, hora: new Date() });
    this.pregunta = '';
    this.loadingChat = true;
    this.scrollAlFinal();

    this.iaService.consultar(this.grupoId, texto).subscribe({
      next: (res: IaConsultaResponse) => {
        this.loadingChat = false;
        const tipo = res.esAccion && res.accionRealizada ? 'accion' : 'ia';
        this.mensajes.push({
          tipo,
          texto:            res.respuesta,
          hora:             new Date(),
          intencion:        res.intencion,
          confianza:        res.confianza,
          accionRealizada:  res.accionRealizada,
          movimientoId:     res.movimientoRegistradoId,
        });
        this.scrollAlFinal();
      },
      error: () => {
        this.loadingChat = false;
        this.mensajes.push({
          tipo: 'error',
          texto: 'No pude conectarme al servicio de IA. Verifica que el microservicio esté corriendo.',
          hora: new Date()
        });
        this.scrollAlFinal();
      }
    });
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarPregunta();
    }
  }

  scrollAlFinal(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop =
          this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  // ── Escaneo ──────────────────────────────────────────

  seleccionarImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.imagenSeleccionada = file;
    this.resultadoEscaneo = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagenPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  escanearFactura(): void {
    if (!this.imagenSeleccionada) return;
    this.loadingEscaneo = true;
    this.resultadoEscaneo = null;

    this.iaService.escanear(this.grupoId, this.imagenSeleccionada).subscribe({
      next: (res: IaEscaneoResponse) => {
        this.loadingEscaneo = false;
        this.resultadoEscaneo = res;
        // Prellenar formulario
        this.formGasto.patchValue({
          monto:       res.monto || '',
          fecha:       res.fecha || new Date().toISOString().split('T')[0],
          descripcion: res.descripcion || ''
        });
      },
      error: () => {
        this.loadingEscaneo = false;
        this.snackBar.open('Error al escanear la factura', 'Cerrar', {
          duration: 3000, panelClass: ['snack-error']
        });
      }
    });
  }

  limpiarEscaneo(): void {
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.resultadoEscaneo = null;
    this.formGasto.reset();
  }

  confirmarGasto(): void {
    if (this.formGasto.invalid) {
      this.formGasto.markAllAsTouched();
      return;
    }
    // Navegar al grupo con los datos prellenados vía queryParams
    const { descripcion, monto, fecha } = this.formGasto.value;
    this.router.navigate(['/app/grupo', this.grupoId], {
      queryParams: { preGasto: 'true', descripcion, monto, fecha }
    });
  }

  volver(): void {
    this.router.navigate(['/app']);
  }

  irAMetricas(): void {
    this.router.navigate(['/app/metricas-ia']);
  }
}