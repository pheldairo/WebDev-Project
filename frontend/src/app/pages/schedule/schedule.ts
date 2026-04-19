import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ScheduleEntry, Room, AcademicSlot } from '../../shared/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './schedule.html',
  styleUrl: './schedule.css'
})
export class ScheduleComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  roomId: number = 0;
  room = signal<Room | null>(null);
  entries = signal<ScheduleEntry[]>([]);
  academicSlots = signal<AcademicSlot[]>([]);
  
  loading = signal(true);
  isPickerOpen = signal(false);
  selectedSlots = new Set<number>();

  days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  private pollSub?: Subscription;

  entryForm: FormGroup;
  showEntryForm = false;

  constructor() {
    this.entryForm = this.fb.group({
      subject: ['', Validators.required],
      day: ['MON', Validators.required],
      time_slot: ['10:00-11:00', Validators.required],
      entry_type: ['NOTE']
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.roomId = Number(params.get('id'));
      this.loadRoomDetails();
      this.loadSchedule();
      this.startPolling();
    });
  }

  ngOnDestroy() {
    if(this.pollSub) this.pollSub.unsubscribe();
  }

  loadRoomDetails() {
    this.api.get<Room[]>(`rooms/`).subscribe(rooms => {
      const current = rooms.find(r => r.id === this.roomId);
      if(current) this.room.set(current);
    });
  }

  loadSchedule() {
    this.api.get<ScheduleEntry[]>(`schedule/?room=${this.roomId}`).subscribe({
      next: (data) => {
        this.entries.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  startPolling() {
    this.pollSub = setInterval(() => {
      this.loadSchedule();
    }, 10000) as any;
  }

  openAcademicPicker() {
    this.isPickerOpen.set(true);
    this.api.get<AcademicSlot[]>('university/slots/').subscribe(slots => {
      this.academicSlots.set(slots);
    });
  }

  closeAcademicPicker() {
    this.isPickerOpen.set(false);
    this.selectedSlots.clear();
  }

  toggleSlotSelection(id: number) {
    if(this.selectedSlots.has(id)) {
      this.selectedSlots.delete(id);
    } else {
      this.selectedSlots.add(id);
    }
  }

  confirmSelection() {
    if(this.selectedSlots.size === 0) return;
    const body = {
      room: this.roomId,
      slots: Array.from(this.selectedSlots)
    };
    this.api.post('schedule/confirm-selection/', body).subscribe(() => {
      this.closeAcademicPicker();
      this.loadSchedule();
    });
  }

  uniqueTimeSlots(): string[] {
    const slots = new Set(this.entries().map(e => e.time_slot));
    return Array.from(slots).sort();
  }

  getEntriesForDayAndSlot(day: string, slot: string): ScheduleEntry[] {
    return this.entries().filter(e => e.day === day && e.time_slot === slot);
  }
}