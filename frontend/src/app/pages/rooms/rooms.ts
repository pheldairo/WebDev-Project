import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../core/services/theme.service';
import { Room } from '../../shared/interfaces';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './rooms.html',
  styleUrl: './rooms.css'
})
export class RoomsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  public themeService = inject(ThemeService);

  myRooms = signal<Room[]>([]);
  currentUser = this.authService.getUser();
  loading = signal(true);
  
  createForm: FormGroup;
  joinForm: FormGroup;

  showCreate = false;
  showJoin = false;
  joinError = '';
  createError = '';

  constructor() {
    this.createForm = this.fb.group({
      name: ['', Validators.required],
      category: ['UNIVERSITY', Validators.required],
      password: ['']
    });

    this.joinForm = this.fb.group({
      code: ['', Validators.required],
      password: ['']
    });
  }

  ngOnInit() {
    this.loadRooms();
  }

  loadRooms() {
    this.api.get<Room[]>('rooms/').subscribe({
      next: (data) => {
        this.myRooms.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleCreate() {
    this.showCreate = !this.showCreate;
    this.showJoin = false;
  }

  toggleJoin() {
    this.showJoin = !this.showJoin;
    this.showCreate = false;
  }

  createRoom() {
    if(this.createForm.invalid) return;
    this.api.post<Room>('rooms/create/', this.createForm.value).subscribe({
      next: (room) => {
        this.myRooms.update(rooms => [...rooms, room]);
        this.showCreate = false;
        this.createForm.reset({ category: 'UNIVERSITY' });
      },
      error: () => this.createError = 'Failed to create room'
    });
  }

  joinRoom() {
    if(this.joinForm.invalid) return;
    this.api.post<any>('rooms/join/', this.joinForm.value).subscribe({
      next: (res) => {
        this.showJoin = false;
        this.joinForm.reset();
        this.router.navigate(['/rooms', res.room, 'schedule']);
      },
      error: (err) => {
        if(err.status === 400 && err.error.password) {
          this.joinError = 'Incorrect password for this room.';
        } else if(err.status === 404 || err.status === 400) {
          this.joinError = 'Invalid Code or Password';
        } else {
          this.joinError = 'Failed to join room';
        }
      }
    });
  }

  openRoom(room: Room) {
    this.router.navigate(['/rooms', room.id, 'schedule']);
  }

  deleteRoom(event: Event, roomId: number) {
    event.stopPropagation(); // Prevents opening the room
    if (confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      this.api.delete(`rooms/${roomId}/delete/`).subscribe({
        next: () => {
          this.myRooms.update(rooms => rooms.filter(r => r.id !== roomId));
        },
        error: () => alert('Failed to delete room. You might not have permission.')
      });
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.authService.clearAll();
    this.router.navigate(['/login']);
  }
}