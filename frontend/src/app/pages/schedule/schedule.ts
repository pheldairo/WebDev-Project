import { Component, inject, OnInit, signal, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../core/services/theme.service';
import { ScheduleEntry, Room, AcademicSlot, Participant, User } from '../../shared/interfaces';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './schedule.html',
  styleUrl: './schedule.css'
})
export class ScheduleComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);

  public roomId: number = 0;
  public room = signal<Room | null>(null);
  public entries = signal<any[]>([]); // Тип any[] чтобы видеть новые поля из бэкенда
  public academicSlots = signal<AcademicSlot[]>([]);
  public participants = signal<Participant[]>([]);
  public currentUser = this.authService.getUser();

  public loading = signal(true);
  public selectedSlots = new Set<number>();

  public readonly days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  private pollSub?: any;

  // WebRTC
  public isVoiceActive = signal(false);
  public isMuted = signal(false);
  private ws: WebSocket | null = null;
  private peerConnections: { [peerId: string]: RTCPeerConnection } = {};
  private pendingCandidates: { [peerId: string]: RTCIceCandidateInit[] } = {};
  private localStream: MediaStream | null = null;
  private myPeerId = Math.random().toString(36).substring(2, 9);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.roomId = Number(params.get('id'));
      if (this.roomId) {
        this.loadRoomDetails();
        this.loadParticipants();
        this.loadSchedule();
        this.loadSlotsAndProfile();
        this.startPolling();
      } else {
        this.router.navigate(['/rooms']);
      }
    });
  }

  @HostListener('window:beforeunload')
  public leaveRoom(): void {
    if (this.roomId && localStorage.getItem('access_token')) {
      fetch(`${environment.apiUrl}/rooms/${this.roomId}/leave/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        keepalive: true
      }).catch(console.error);
    }
  }

  ngOnDestroy(): void {
    if (this.pollSub) {
      clearInterval(this.pollSub);
    }
    this.leaveVoice();
    this.leaveRoomApi();
  }

  private leaveRoomApi(): void {
    if (this.roomId && this.authService.isLoggedIn()) {
      this.api.post(`rooms/${this.roomId}/leave/`, {}).subscribe({
        error: (err) => console.error('Failed to leave room API', err)
      });
    }
  }

  public loadRoomDetails(): void {
    this.api.get<Room[]>('rooms/').subscribe({
      next: (rooms) => {
        const current = rooms.find(r => r.id === this.roomId);
        if (current) this.room.set(current);
      },
      error: (err) => console.error('Failed to load room details', err)
    });
  }

  public loadSchedule(): void {
    this.api.get<any[]>(`schedule/?room=${this.roomId}`).subscribe({
      next: (data) => {
        this.entries.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load schedule', err);
        this.loading.set(false);
      }
    });
  }

  private startPolling(): void {
    this.pollSub = setInterval(() => {
      this.loadSchedule();
      this.loadParticipants();
    }, 3000);
  }

  public loadParticipants(): void {
    this.api.get<Participant[]>(`rooms/${this.roomId}/participants/`).subscribe({
      next: (data) => this.participants.set(data),
      error: (err) => console.error('Failed to load participants', err)
    });
  }

  public loadSlotsAndProfile(): void {
    this.api.get<AcademicSlot[]>('university/slots/').subscribe({
      next: (slots) => {
        this.academicSlots.set(slots);
        this.api.get<User>('auth/profile/').subscribe({
          next: (profile) => {
            if (profile.saved_slots) {
              this.selectedSlots.clear();
              profile.saved_slots.forEach(id => this.selectedSlots.add(id));
            }
          },
          error: (err) => console.error('Failed to load user profile for slots', err)
        });
      },
      error: (err) => console.error('Failed to load academic slots', err)
    });
  }

  public onSlotSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedId = Number(select.value);
    if (selectedId) {
      this.selectedSlots.clear();
      this.selectedSlots.add(selectedId);
    }
  }

  public confirmSelection(): void {
    if (this.selectedSlots.size === 0) return;
    const selected = Array.from(this.selectedSlots);
    this.loading.set(true);

    this.api.post('schedule/confirm-selection/', {
      room: this.roomId,
      slots: selected
    }).subscribe({
      next: () => {
        this.selectedSlots.clear();
        const selectElement = document.getElementById('slotSelect') as HTMLSelectElement;
        if (selectElement) selectElement.value = '';
        this.loadSchedule();
        this.api.patch('auth/profile/', { saved_slots: selected }).subscribe();
      },
      error: (err) => {
        console.error('Failed to confirm selection', err);
        this.loading.set(false);
        alert('Error adding subjects. This slot might be busy.');
      }
    });
  }

  public uniqueTimeSlots(): string[] {
    const slots = new Set(this.entries().map(e => e.time_slot));
    return Array.from(slots).sort();
  }

  // ВАЖНО: Возвращаем any[], чтобы HTML видел created_by
  public getEntriesForDayAndSlot(day: string, slot: string): any[] {
    return this.entries().filter(e => e.day === day && e.time_slot === slot);
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  public logout(): void {
    this.leaveRoomApi();
    this.authService.clearAll();
    this.router.navigate(['/login']);
  }

  public goBack(): void {
    this.router.navigate(['/rooms']);
  }

  public copyRoomCode(): void {
    const code = this.room()?.code;
    if (code) {
      navigator.clipboard.writeText(code);
      alert('Room code copied to clipboard!');
    }
  }

  public isToday(day: string): boolean {
    const daysMap: { [key: string]: number } = {
      'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6
    };
    return new Date().getDay() === daysMap[day];
  }

  public deleteEntry(entryId: number): void {
    if (confirm('Remove this subject from the shared schedule?')) {
      this.api.delete(`schedule/${entryId}/`).subscribe({
        next: () => this.loadSchedule(),
        error: (err) => alert('Failed to delete entry')
      });
    }
  }

  // --- WebRTC Logic ---
  public async toggleVoice(): Promise<void> {
    if (this.isVoiceActive()) {
      this.leaveVoice();
      return;
    }
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.isVoiceActive.set(true);
      const wsUrl = `${environment.wsUrl}/ws/voicechat/${this.roomId}/`;
      this.ws = new WebSocket(wsUrl);
      this.ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        const { type, payload } = data;
        if (payload?.target && payload.target !== this.myPeerId) return;
        if (type === 'join') {
          const pc = this.createPeerConnection(payload.source);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          this.ws?.send(JSON.stringify({ type: 'offer', payload: { sdp: offer, target: payload.source, source: this.myPeerId } }));
        } else if (type === 'offer') {
          const pc = this.createPeerConnection(payload.source);
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.ws?.send(JSON.stringify({ type: 'answer', payload: { sdp: answer, target: payload.source, source: this.myPeerId } }));
          this.processPendingCandidates(payload.source);
        } else if (type === 'answer') {
          const pc = this.peerConnections[payload.source];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            this.processPendingCandidates(payload.source);
          }
        } else if (type === 'ice-candidate') {
          const pc = this.peerConnections[payload.source];
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            if (!this.pendingCandidates[payload.source]) this.pendingCandidates[payload.source] = [];
            this.pendingCandidates[payload.source].push(payload.candidate);
          }
        }
      };
      this.ws.onopen = () => this.ws?.send(JSON.stringify({ type: 'join', payload: { source: this.myPeerId } }));
      this.ws.onclose = () => this.leaveVoice();
    } catch (e) {
      alert('Microphone access denied');
      this.leaveVoice();
    }
  }

  public toggleMute(): void {
    if (!this.localStream) return;
    this.isMuted.set(!this.isMuted());
    this.localStream.getAudioTracks().forEach(track => track.enabled = !this.isMuted());
  }

  private processPendingCandidates(peerId: string): void {
    const candidates = this.pendingCandidates[peerId];
    const pc = this.peerConnections[peerId];
    if (candidates && pc) {
      candidates.forEach(candidate => pc.addIceCandidate(new RTCIceCandidate(candidate)));
      delete this.pendingCandidates[peerId];
    }
  }

  public leaveVoice(): void {
    this.isVoiceActive.set(false);
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    Object.values(this.peerConnections).forEach(pc => pc.close());
    this.peerConnections = {};
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    if (this.peerConnections[peerId]) return this.peerConnections[peerId];
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    if (this.localStream) this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream!));
    pc.onicecandidate = (event) => {
      if (event.candidate && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ice-candidate', payload: { candidate: event.candidate, target: peerId, source: this.myPeerId } }));
      }
    };
    pc.ontrack = (event) => {
      const container = document.getElementById('remote-audio-container');
      if (container && event.streams[0]) {
        let audio = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;
        if (!audio) {
          audio = document.createElement('audio');
          audio.id = `audio-${peerId}`;
          audio.autoplay = true;
          container.appendChild(audio);
        }
        audio.srcObject = event.streams[0];
      }
    };
    this.peerConnections[peerId] = pc;
    return pc;
  }

  private removePeer(peerId: string): void {
    if (this.peerConnections[peerId]) {
      this.peerConnections[peerId].close();
      delete this.peerConnections[peerId];
    }
    const audio = document.getElementById(`audio-${peerId}`);
    if (audio) audio.remove();
  }
}
