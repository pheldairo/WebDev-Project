import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ScheduleEntry } from '../shared/interfaces';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private api = `http://${window.location.hostname}:8000/api`;

  constructor(private http: HttpClient) {}

  getSchedule(roomId: number) {
    return this.http.get<ScheduleEntry[]>(`${this.api}/schedule/?room=${roomId}`);
  }

  pollSchedule(roomId: number) {
    return timer(0, 10000).pipe(
      switchMap(() => this.getSchedule(roomId))
    );
  }

  createEntry(data: Partial<ScheduleEntry>) {
    return this.http.post<ScheduleEntry>(`${this.api}/schedule/`, data);
  }

  updateEntry(id: number, data: Partial<ScheduleEntry>) {
    return this.http.put<ScheduleEntry>(`${this.api}/schedule/${id}/`, data);
  }

  deleteEntry(id: number) {
    return this.http.delete(`${this.api}/schedule/${id}/`);
  }
}