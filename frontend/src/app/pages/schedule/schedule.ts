import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ScheduleService } from '../../services/schedule';
import { AuthService } from '../../services/auth';
import { ScheduleEntry } from '../../shared/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit, OnDestroy {
  roomId!: number;
  entries: ScheduleEntry[] = [];
  loading = false;
  error = '';
  showModal = false;
  editingEntry: ScheduleEntry | null = null;
  private pollSub!: Subscription;

  days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  dayLabels: Record<string, string> = {
    MON: 'Пн', TUE: 'Вт', WED: 'Ср',
    THU: 'Чт', FRI: 'Пт', SAT: 'Сб'
  };
  timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  form: {
  subject: string;
  teacher: string;
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  time_slot: string;
} = {
  subject: '',
  teacher: '',
  day: 'MON',
  time_slot: '08:00'
};

  username = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private scheduleService: ScheduleService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.roomId = Number(this.route.snapshot.paramMap.get('id'));
    this.username = this.auth.getUser()?.username || '';
    this.pollSub = this.scheduleService.pollSchedule(this.roomId).subscribe({
      next: (data) => { this.entries = data; },
      error: () => { this.error = 'Ошибка загрузки расписания'; }
    });
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  getEntriesForSlot(day: string, time: string): ScheduleEntry[] {
    return this.entries.filter(e => e.day === day && e.time_slot === time);
  }

  getColor(entry: ScheduleEntry): string {
    const colors: Record<string, string> = {
      'admin': '#00c896',
    };
    return colors[entry.created_by_username] || this.stringToColor(entry.created_by_username);
  }

  stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${Math.abs(h)}, 70%, 55%)`;
  }

  openModal(entry?: ScheduleEntry) {
    if (entry) {
      this.editingEntry = entry;
      this.form = {
        subject: entry.subject,
        teacher: entry.teacher,
        day: entry.day as 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN',
        time_slot: entry.time_slot
};
    } else {
      this.editingEntry = null;
      this.form = { subject: '', teacher: '', day: 'MON', time_slot: '08:00' };
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingEntry = null;
  }

  saveEntry() {
    if (!this.form.subject || !this.form.teacher) return;
    this.loading = true;

    const payload = { ...this.form, room: this.roomId };

    if (this.editingEntry) {
      this.scheduleService.updateEntry(this.editingEntry.id, payload).subscribe({
        next: () => { this.closeModal(); this.loading = false; },
        error: () => { this.error = 'Ошибка обновления'; this.loading = false; }
      });
    } else {
      this.scheduleService.createEntry(payload).subscribe({
        next: () => { this.closeModal(); this.loading = false; },
        error: () => { this.error = 'Ошибка создания'; this.loading = false; }
      });
    }
  }

  deleteEntry(id: number) {
    this.scheduleService.deleteEntry(id).subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e.id !== id);
      },
      error: () => { this.error = 'Ошибка удаления'; }
    });
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => { this.auth.clearAll(); this.router.navigate(['/login']); },
      error: () => { this.auth.clearAll(); this.router.navigate(['/login']); }
    });
  }

  goToRooms() {
    this.router.navigate(['/rooms']);
  }
}