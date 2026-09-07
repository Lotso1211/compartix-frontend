import { Component, ElementRef, HostListener, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface OpcionBuscable {
  id: number | string;
  label: string;
}

/**
 * Input de texto que filtra una lista mientras se escribe, en vez de un
 * <select> que hay que scrollear con el mouse. Navegable con teclado
 * (flechas + Enter + Escape) y compatible con [(ngModel)].
 */
@Component({
  selector: 'app-selector-buscable',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './selector-buscable.component.html',
  styleUrls: ['./selector-buscable.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectorBuscableComponent),
    multi: true
  }]
})
export class SelectorBuscableComponent implements ControlValueAccessor {
  @Input() opciones: OpcionBuscable[] = [];
  @Input() placeholder = 'Escribe para buscar...';
  @Input() sinResultadosTexto = 'Sin resultados';
  @Input() disabled = false;
  @Input() compacto = false;

  query = '';
  abierto = false;
  indiceActivo = -1;
  valorSeleccionado: number | string | null = null;

  private onChange: (val: number | string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elRef: ElementRef<HTMLElement>) {}

  writeValue(val: number | string | null): void {
    this.valorSeleccionado = val;
    const opcion = this.opciones.find(o => o.id === val);
    this.query = opcion ? opcion.label : '';
  }

  registerOnChange(fn: (val: number | string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  get opcionesFiltradas(): OpcionBuscable[] {
    const q = this.normalizar(this.query);
    if (!q) return this.opciones;
    const tokens = q.split(/\s+/).filter(Boolean);
    return this.opciones.filter(o => {
      const label = this.normalizar(o.label);
      return tokens.every(t => label.includes(t));
    });
  }

  // Quita tildes a mano (evita depender de rangos Unicode de combining marks,
  // que son faciles de escribir mal) para que "jose" encuentre "José".
  private normalizar(s: string): string {
    return (s || '')
      .toLowerCase()
      .replace(/[aàáâã]/g, 'a')
      .replace(/[eèéê]/g, 'e')
      .replace(/[iìíî]/g, 'i')
      .replace(/[oòóôõ]/g, 'o')
      .replace(/[uùúû]/g, 'u')
      .replace(/ñ/g, 'n');
  }

  onInput(): void {
    this.abierto = true;
    this.indiceActivo = 0;
    if (this.valorSeleccionado !== null) {
      const actual = this.opciones.find(o => o.id === this.valorSeleccionado);
      if (!actual || actual.label !== this.query) {
        this.valorSeleccionado = null;
        this.onChange(null);
      }
    }
  }

  onFocus(): void {
    if (this.disabled) return;
    this.abierto = true;
    this.indiceActivo = this.opcionesFiltradas.findIndex(o => o.id === this.valorSeleccionado);
  }

  seleccionar(opcion: OpcionBuscable): void {
    this.valorSeleccionado = opcion.id;
    this.query = opcion.label;
    this.abierto = false;
    this.onChange(opcion.id);
    this.onTouched();
  }

  onKeydown(event: KeyboardEvent): void {
    const filtradas = this.opcionesFiltradas;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.abierto = true;
      this.indiceActivo = Math.min(this.indiceActivo + 1, filtradas.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.indiceActivo = Math.max(this.indiceActivo - 1, 0);
    } else if (event.key === 'Enter') {
      if (this.abierto && filtradas[this.indiceActivo]) {
        event.preventDefault();
        this.seleccionar(filtradas[this.indiceActivo]);
      }
    } else if (event.key === 'Escape') {
      this.abierto = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target as Node)) {
      this.abierto = false;
      const opcion = this.opciones.find(o => o.id === this.valorSeleccionado);
      this.query = opcion ? opcion.label : '';
    }
  }
}
