import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../core/services/theme.service';
import { Room } from '../../shared/interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './rooms.html',
  styleUrl: './rooms.css'
})
export class RoomsComponent implements OnInit {
  // Инъекции зависимостей
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  public themeService = inject(ThemeService);

  // Состояния (Signals)
  public myRooms = signal<Room[]>([]);
  public currentUser = this.authService.getUser();
  public loading = signal(true);

  // Формы
  public createForm: FormGroup;
  public joinForm: FormGroup;

  // UI Состояния
  public showCreate = false;
  public showJoin = false;
  public joinError = '';
  public createError = '';
  public isCreating = false;
  public isJoining = false;

  constructor() {
    // Инициализация формы создания
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      password: [''] // По умолчанию пусто
    });

    // Инициализация формы входа (код из 6 символов)
    this.joinForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{6}$/i)]],
      password: ['']
    });
  }

  ngOnInit(): void {
    this.loadRooms();
  }

  /**
   * Загрузка списка комнат пользователя
   */
  public loadRooms(): void {
    this.loading.set(true);
    this.api.get<Room[]>('rooms/')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.myRooms.set(data),
        error: (err) => console.error('Failed to load rooms', err)
      });
  }

  /**
   * Переключение панели создания комнаты
   */
  public toggleCreate(): void {
    this.showCreate = !this.showCreate;
    this.showJoin = false;
    this.createError = '';
    if (this.showCreate) this.createForm.reset();
  }

  /**
   * Переключение панели входа в комнату
   */
  public toggleJoin(): void {
    this.showJoin = !this.showJoin;
    this.showCreate = false;
    this.joinError = '';
    if (this.showJoin) this.joinForm.reset();
  }

  /**
   * Создание новой комнаты
   */
  public createRoom(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isCreating = true;
    this.createError = '';

    const { name, password } = this.createForm.value;

    // Подготовка данных (Payload)
    const payload = {
      name: name.trim(),
      password: password || "",
    };

    this.api.post<Room>('rooms/create/', payload)
      .pipe(finalize(() => this.isCreating = false))
      .subscribe({
        next: (newRoom) => {
          // Добавляем новую комнату в начало списка
          this.myRooms.update(rooms => [newRoom, ...rooms]);
          this.showCreate = false;
          this.createForm.reset();
        },
        error: (err) => {
          // Обработка разных форматов ошибок от Django
          const errorData = err.error;
          if (typeof errorData === 'object') {
            this.createError = errorData.detail || errorData.password?.[0] || errorData.name?.[0] || 'Validation error.';
          } else {
            this.createError = 'Failed to create room. Please try again.';
          }
        }
      });
  }

  /**
   * Вход в существующую комнату по коду
   */
  public joinRoom(): void {
    if (this.joinForm.invalid) {
      this.joinForm.markAllAsTouched();
      return;
    }

    this.isJoining = true;
    this.joinError = '';

    const { code, password } = this.joinForm.value;

    const payload = {
      code: code.toUpperCase().trim(),
      password: password || ""
    };

    this.api.post<{room: any, detail?: string}>('rooms/join/', payload)
      .pipe(finalize(() => this.isJoining = false))
      .subscribe({
        next: (res) => {
          // res.room может быть объектом или ID, в зависимости от твоего API
          const roomId = typeof res.room === 'object' ? res.room.id : res.room;
          this.router.navigate(['/rooms', roomId, 'schedule']);
        },
        error: (err) => {
          const errorData = err.error;
          this.joinError = errorData?.detail || errorData?.non_field_errors?.[0] || 'Invalid Code or Password.';
        }
      });
  }

  /**
   * Переход на страницу расписания комнаты
   */
  public openRoom(room: Room): void {
    this.router.navigate(['/rooms', room.id, 'schedule']);
  }

  /**
   * Удаление комнаты (только для создателя)
   */
  public deleteRoom(event: Event, roomId: number): void {
    event.stopPropagation(); // Чтобы не сработал клик по карточке (openRoom)

    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    this.api.delete(`rooms/${roomId}/delete/`).subscribe({
      next: () => {
        // Удаляем комнату из локального списка (Signal)
        this.myRooms.update(rooms => rooms.filter(r => r.id !== roomId));
      },
      error: (err) => {
        const msg = err.error?.detail || 'Failed to delete room.';
        alert(msg);
      }
    });
  }

  /**
   * Переключение темы (Dark/Light)
   */
  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Выход из аккаунта
   */
  public logout(): void {
    this.authService.logout().pipe(
      finalize(() => {
        this.authService.clearAll();
        this.router.navigate(['/login']);
      })
    ).subscribe();
  }
}
