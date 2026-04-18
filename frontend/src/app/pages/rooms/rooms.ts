import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RoomService } from '../../services/room';
import { AuthService } from '../../services/auth';
import { Room } from '../../shared/interfaces';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css']
})
export class RoomsComponent implements OnInit {
  rooms: Room[] = [];
  newRoomName = '';
  joinCode = '';
  error = '';
  success = '';
  loading = false;
  username = '';

  constructor(
    private roomService: RoomService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.auth.getUser();
    this.username = user?.username || 'Пользователь';
  }

  createRoom() {
    if (!this.newRoomName.trim()) return;
    this.loading = true;
    this.error = '';
    this.roomService.createRoom(this.newRoomName).subscribe({
      next: (room) => {
        this.rooms.push(room);
        this.newRoomName = '';
        this.success = `Комната "${room.name}" создана! Код: ${room.code}`;
        this.loading = false;
      },
      error: () => {
        this.error = 'Ошибка создания комнаты';
        this.loading = false;
      }
    });
  }

  joinRoom() {
    if (!this.joinCode.trim()) return;
    this.loading = true;
    this.error = '';
    this.roomService.joinRoom(this.joinCode).subscribe({
      next: (participant: any) => {
        this.success = `Вы вошли в комнату!`;
        this.joinCode = '';
        this.loading = false;
        this.router.navigate(['/rooms', participant.room, 'schedule']);
      },
      error: () => {
        this.error = 'Неверный код комнаты';
        this.loading = false;
      }
    });
  }

  goToSchedule(roomId: number) {
    this.router.navigate(['/rooms', roomId, 'schedule']);
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => { this.auth.clearAll(); this.router.navigate(['/login']); },
      error: () => { this.auth.clearAll(); this.router.navigate(['/login']); }
    });
  }
}