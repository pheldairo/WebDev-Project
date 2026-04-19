import { Component, inject, OnInit, signal, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ScheduleEntry, Room, AcademicSlot, Participant, User } from '../../shared/interfaces';
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
  participants = signal<Participant[]>([]);
  
  loading = signal(true);
  selectedSlots = new Set<number>();

  days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  private pollSub?: Subscription;

  entryForm: FormGroup;
  showEntryForm = false;

  // WebRTC
  isVoiceActive = signal(false);
  private ws: WebSocket | null = null;
  private peerConnections: { [peerId: string]: RTCPeerConnection } = {};
  private localStream: MediaStream | null = null;
  private myPeerId = Math.random().toString(36).substring(2, 9);

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
      this.loadParticipants();
      this.loadSchedule();
      this.loadSlotsAndProfile();
      this.startPolling();
    });
  }

  @HostListener('window:beforeunload')
  leaveRoom() {
    if (this.roomId) {
      fetch(`/api/rooms/${this.roomId}/leave/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
    }
  }

  ngOnDestroy() {
    if(this.pollSub) this.pollSub.unsubscribe();
    this.leaveVoice();
    this.api.post(`rooms/${this.roomId}/leave/`, {}).subscribe();
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
      this.loadParticipants();
    }, 10000) as any;
  }

  loadParticipants() {
    this.api.get<Participant[]>(`rooms/${this.roomId}/participants/`).subscribe(data => {
      this.participants.set(data);
    });
  }

  loadSlotsAndProfile() {
    this.api.get<AcademicSlot[]>('university/slots/').subscribe(slots => {
      this.academicSlots.set(slots);
      this.api.get<User>('auth/profile/').subscribe(profile => {
        if(profile.saved_slots) {
           profile.saved_slots.forEach(id => this.selectedSlots.add(id));
        }
      });
    });
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
    const selected = Array.from(this.selectedSlots);
    this.api.post('schedule/confirm-selection/', {
      room: this.roomId,
      slots: selected
    }).subscribe(() => {
      this.api.patch('auth/profile/', { saved_slots: selected }).subscribe(() => {
        this.loadSchedule();
      });
    });
  }

  uniqueTimeSlots(): string[] {
    const slots = new Set(this.entries().map(e => e.time_slot));
    return Array.from(slots).sort();
  }

  getEntriesForDayAndSlot(day: string, slot: string): ScheduleEntry[] {
    return this.entries().filter(e => e.day === day && e.time_slot === slot);
  }

  // --- WebRTC Logic ---
  async toggleVoice() {
    if (this.isVoiceActive()) {
      this.leaveVoice();
      return;
    }

    if (!this.roomId) {
      console.warn('Cannot join voice: Room ID is missing');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Voice chat requires a secure connection (HTTPS) or localhost.');
      return;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.isVoiceActive.set(true);

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws/voicechat/${this.roomId}/`;
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
        } else if (type === 'answer') {
          const pc = this.peerConnections[payload.source];
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        } else if (type === 'ice-candidate') {
          const pc = this.peerConnections[payload.source];
          if (pc && payload.candidate) pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      };

      this.ws.onopen = () => {
        this.ws?.send(JSON.stringify({ type: 'join', payload: { source: this.myPeerId } }));
      };
    } catch (e) {
      console.error('Failed to get media devices', e);
    }
  }

  leaveVoice() {
    this.isVoiceActive.set(false);
    this.localStream?.getTracks().forEach(t => t.stop());
    Object.values(this.peerConnections).forEach(pc => pc.close());
    this.peerConnections = {};
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    
    this.localStream?.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream!);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && this.ws) {
        this.ws.send(JSON.stringify({ 
           type: 'ice-candidate', 
           payload: { candidate: event.candidate, target: peerId, source: this.myPeerId } 
        }));
      }
    };

    pc.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
    };

    this.peerConnections[peerId] = pc;
    return pc;
  }
}