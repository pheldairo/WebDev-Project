import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Room, Participant } from '../shared/interfaces';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  createRoom(name: string) {
    return this.http.post<Room>(`${this.api}/rooms/create/`, { name });
  }

  joinRoom(code: string) {
    return this.http.post<Participant>(`${this.api}/rooms/join/`, { code });
  }

  getParticipants(roomId: number) {
    return this.http.get<Participant[]>(`${this.api}/rooms/${roomId}/participants/`);
  }
}